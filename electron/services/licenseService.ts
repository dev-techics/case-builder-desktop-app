import { shell } from 'electron';
import {
  authApiRoutes,
  getServiceErrorMessage,
  isNetworkError,
  requestApi,
} from './authApiClient.js';
import {
  secureStore,
  type LicenseCache,
  type LicenseStatus,
} from './secureStore.js';

const OFFLINE_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;
const EMPTY_LICENSE: LicenseCache = {
  status: 'none',
  lastChecked: 0,
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

      const cachedLicense = await secureStore.getLicenseCache();
      return {
        ...(cachedLicense ?? EMPTY_LICENSE),
        status: 'expired',
        daysLeft: 0,
        lastChecked: Date.now(),
      };
    }
  },

  async getCachedLicense(): Promise<LicenseCache> {
    const cachedLicense = await secureStore.getLicenseCache();
    if (!cachedLicense) {
      return EMPTY_LICENSE;
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

    if (cachedLicense.status === 'active' || cachedLicense.status === 'trialing') {
      return {
        ...cachedLicense,
        status: 'expired',
        daysLeft: 0,
      };
    }

    return cachedLicense;
  },

  async openCheckout() {
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
        body: { source: 'desktop' },
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
  const response = getPrimaryRecord(value);
  const source = isRecord(response.license)
    ? response.license
    : isRecord(response.subscription)
      ? response.subscription
      : response;

  const status = normalizeLicenseStatus(
    source.status ??
      source.licenseStatus ??
      source.license_status ??
      source.subscriptionStatus ??
      source.subscription_status
  );
  const expiresAt =
    readString(source.expiresAt) ??
    readString(source.expires_at) ??
    readString(source.trialEndsAt) ??
    readString(source.trial_ends_at);
  const daysLeft =
    readNumber(source.daysLeft) ??
    readNumber(source.days_left) ??
    calculateDaysLeft(expiresAt);

  return {
    status,
    expiresAt: expiresAt ?? undefined,
    daysLeft: daysLeft ?? undefined,
  };
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
    'license' in value ||
    'subscription' in value
  );
}

function hasCheckoutShape(value: Record<string, unknown>): boolean {
  return 'url' in value || 'checkoutUrl' in value || 'checkout_url' in value;
}

function normalizeLicenseStatus(value: unknown): LicenseStatus {
  switch (value) {
    case 'active':
    case 'trialing':
    case 'expired':
    case 'cancelled':
    case 'none':
      return value;
    default:
      return 'none';
  }
}

function calculateDaysLeft(expiresAt?: string | null): number | undefined {
  if (!expiresAt) {
    return undefined;
  }

  const expiresAtMs = Date.parse(expiresAt);
  if (Number.isNaN(expiresAtMs)) {
    return undefined;
  }

  return Math.max(
    0,
    Math.ceil((expiresAtMs - Date.now()) / (24 * 60 * 60 * 1000))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
