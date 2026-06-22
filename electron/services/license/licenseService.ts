import { shell } from 'electron';
import {
  ApiError,
  authApiRoutes,
  getServiceErrorMessage,
  isNetworkError,
  requestApi,
} from '../authApiClient.js';
import { secureStore } from '../secure-store/index.js';
import type { LicenseCache } from '../secure-store/types.js';
import { extractNormalizedLicense } from './licenseResponse.js';

const OFFLINE_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;
const EMPTY_LICENSE_STATE: Omit<LicenseCache, 'lastChecked'> = {
  status: 'none',
};
const EMPTY_LICENSE: LicenseCache = {
  ...EMPTY_LICENSE_STATE,
  lastChecked: 0,
};

type BillingInterval = 'monthly' | 'yearly';

type CheckoutInput = {
  planId?: string;
  billingInterval?: BillingInterval;
};

type StartTrialResponse = {
  message: string;
  license?: Omit<LicenseCache, 'lastChecked'> | null;
  status?: string;
};

export const licenseService = {
  async checkLicense(): Promise<LicenseCache> {
    const accessToken = await secureStore.getAccessToken();
    if (!accessToken) {
      return EMPTY_LICENSE;
    }

    try {
      const response = await requestApi<unknown>(authApiRoutes.license, {
        accessToken,
      });
      
      const normalizedLicense = normalizeLicenseResponse(response);
      await secureStore.setLicenseCache(normalizedLicense);

      return {
        ...normalizedLicense,
        lastChecked: Date.now(),
      };
    } catch (error) {
      if (isNetworkError(error)) {
        return this.getCachedLicense();
      }

      if (isUnauthorizedError(error)) {
        await secureStore.clear();
        throw new Error('Your session has expired. Please sign in again.');
      }

      if (isMissingLicenseError(error)) {
        await secureStore.setLicenseCache(EMPTY_LICENSE_STATE);

        return {
          ...EMPTY_LICENSE_STATE,
          lastChecked: Date.now(),
        };
      }

      return this.getCachedLicense();
    }
  },

  async getCachedLicense(): Promise<LicenseCache> {
    const cachedLicense = await secureStore.getLicenseCache();
    if (!cachedLicense) {
      return EMPTY_LICENSE;
    }

    if (isExpiredByDate(cachedLicense.expiresAt)) {
      return {
        ...cachedLicense,
        status: 'expired',
        daysLeft: 0,
      };
    }

    const isEligibleForGracePeriod =
      cachedLicense.status === 'active' || cachedLicense.status === 'trialing';
    const isWithinGracePeriod =
      Date.now() - cachedLicense.lastChecked <= OFFLINE_GRACE_PERIOD_MS;

    if (isEligibleForGracePeriod && isWithinGracePeriod) {
      return {
        ...cachedLicense,
        status: 'offline_grace',
      };
    }

    if (
      cachedLicense.status === 'active' ||
      cachedLicense.status === 'trialing'
    ) {
      return {
        ...cachedLicense,
        status: 'expired',
        daysLeft: 0,
      };
    }

    return cachedLicense;
  },

  async startTrial() {
    const accessToken = await secureStore.getAccessToken();
    if (!accessToken) {
      return {
        success: false,
        error: 'Please sign in before starting your trial.',
      };
    }

    try {
      const response = await requestApi<StartTrialResponse>(
        authApiRoutes.startTrial,
        {
          method: 'POST',
          accessToken,
          body: { source: 'desktop' },
        }
      );
      console.log('Start trial response:', response.status);
      const normalizedLicense = normalizeLicenseResponse(response);
      await secureStore.setLicenseCache(normalizedLicense);

      return {
        success: true,
        status: response.status,
        license: {
          ...normalizedLicense,
          lastChecked: Date.now(),
        },
        message: response?.message ?? undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: getServiceErrorMessage(
          error,
          'Unable to start the free trial right now.'
        ),
      };
    }
  },

  async openCheckout(input: CheckoutInput = {}) {
    const accessToken = await secureStore.getAccessToken();
    if (!accessToken) {
      return {
        success: false,
        error: 'Please sign in before upgrading your subscription.',
      };
    }

    try {
      const response = await requestApi<unknown>(authApiRoutes.checkout, {
        method: 'POST',
        accessToken,
        body: {
          source: 'desktop',
          planId: input.planId ?? 'pro',
          billingInterval: input.billingInterval ?? 'monthly',
        },
      });

      const checkoutUrl = extractCheckoutUrl(response);
      if (!checkoutUrl) {
        return {
          success: false,
          error: 'The server did not return a checkout URL.',
        };
      }

      await shell.openExternal(checkoutUrl);

      return {
        success: true,
        url: checkoutUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: getServiceErrorMessage(
          error,
          'Unable to open the checkout right now.'
        ),
      };
    }
  },
};

function normalizeLicenseResponse(
  value: unknown
): Omit<LicenseCache, 'lastChecked'> {
  return extractNormalizedLicense(value) ?? EMPTY_LICENSE_STATE;
}

function extractCheckoutUrl(value: unknown): string | null {
  const response = getPrimaryRecord(value);

  return (
    readString(response.url) ??
    readString(response.checkoutUrl) ??
    readString(response.checkout_url) ??
    (isRecord(response.data) ? extractCheckoutUrl(response.data) : null)
  );
}

function getPrimaryRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    return {};
  }

  if (hasLicenseShape(value) || hasCheckoutShape(value)) {
    return value;
  }

  if (isRecord(value.data)) {
    return value.data;
  }

  return value;
}

function hasLicenseShape(value: Record<string, unknown>): boolean {
  return (
    'status' in value ||
    'licenseStatus' in value ||
    'license_status' in value ||
    'subscriptionStatus' in value ||
    'subscription_status' in value ||
    'stripeStatus' in value ||
    'stripe_status' in value ||
    'license' in value ||
    'subscription' in value ||
    'currentSubscription' in value ||
    'current_subscription' in value
  );
}

function hasCheckoutShape(value: Record<string, unknown>): boolean {
  return 'url' in value || 'checkoutUrl' in value || 'checkout_url' in value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function isExpiredByDate(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  const expiresAtMs = Date.parse(value);
  return !Number.isNaN(expiresAtMs) && expiresAtMs <= Date.now();
}

function isUnauthorizedError(error: unknown): error is ApiError {
  return error instanceof ApiError && [401, 403].includes(error.status);
}

function isMissingLicenseError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 404;
}
