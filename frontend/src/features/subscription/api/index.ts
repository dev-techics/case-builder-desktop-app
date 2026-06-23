import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { toIpcError } from '@/utils';
import type { LicenseCache } from '@/types/desktop/license.types';
import type { Plan } from '../types';
import { transformPlansResponse } from '../utils/plans';
const BaseQuery = import.meta.env.VITE_BASE_URL;

type BillingInterval = 'monthly' | 'yearly';

type TrialResponse = {
  success: boolean;
  status?: string | number;
  message: string;
  license: LicenseCache | null;
};

type CheckoutResponse = {
  success: boolean;
  checkoutUrl?: string;
  approvalUrl?: string;
  paypalSubscriptionId?: string;
  subscriptionId?: string | number;
  status?: string;
  url?: string;
  error?: string;
};

type SubscriptionStatusResponse = {
  success: boolean;
  status?: string;
  is_active?: boolean;
  days_left?: number;
  expires_at?: string | null;
  next_billing_at?: string | null;
  subscription?: {
    id: string | number;
    status: string;
    plan: string | null;
    plan_name: string | null;
    paypal_subscription_id: string | null;
    amount: string | null;
    currency: string | null;
  } | null;
  license?: LicenseCache | null;
  error?: string;
};

const desktopApi =
  typeof window !== 'undefined' && window.api ? window.api : undefined;

const authApi = createApi({
  reducerPath: 'subscriptionApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BaseQuery,
  }),
  endpoints: build => ({
    /*---------------------------------
        Get plans from server
    -----------------------------------*/
    getPlans: build.query<Plan[], void>({
      query: () => '/api/plans',
      transformResponse: transformPlansResponse,
    }),
    /*---------------------------
        Check license
    -----------------------------*/
    checkLicense: build.query<LicenseCache | null, void>({
      async queryFn(_args, _api, _extraOptions): Promise<any> {
        if (desktopApi) {
          try {
            const result = await desktopApi.checkLicense();
            return {
              data: result,
            };
          } catch (error) {
            return {
              error: toIpcError(error),
            };
          }
        }
        return {
          error: {
            name: 'Desktop API Unavailable',
          },
        };
      },
    }),
    /*--------------------------
        Start a free trial
    ----------------------------*/
    startFreeTrial: build.mutation<TrialResponse, void>({
      async queryFn(_args, _api, _extraOptions): Promise<any> {
        if (desktopApi) {
          try {
            const result = await desktopApi.startTrial();
            return {
              data: {
                success: result.success,
                status: result.status,
                message: result.error ?? 'Free trial started successfully.',
                license: result.license ?? null,
              },
            };
          } catch (error) {
            return {
              error: toIpcError(error),
            };
          }
        }
        return {
          error: {
            name: 'Desktop API Unavailable',
          },
        };
      },
    }),
    /*--------------------------
        Create payment
    ----------------------------*/
    createPayment: build.mutation<
      CheckoutResponse,
      { planId: string; billingInterval: BillingInterval }
    >({
      async queryFn(input, _api, _extraOptions, fetchWithBQ): Promise<any> {
        if (desktopApi?.openCheckout) {
          try {
            const result = await desktopApi.openCheckout({
              planId: input.planId,
              billingInterval: input.billingInterval,
            });
            return {
              data: result,
            };
          } catch (error) {
            return {
              error: toIpcError(error),
            };
          }
        }

        const response = await fetchWithBQ({
          url: '/api/subscriptions/create-payment',
          method: 'POST',
          body: {
            plan_id: input.planId,
            interval: input.billingInterval,
          },
        });

        if (response.error) {
          return { error: response.error };
        }

        return {
          data: response.data as CheckoutResponse,
        };
      },
    }),
    /*--------------------------
        Get subscription status
    ----------------------------*/
    getSubscriptionStatus: build.query<SubscriptionStatusResponse, void>({
      async queryFn(_args, _api, _extraOptions, fetchWithBQ): Promise<any> {
        if (desktopApi?.getSubscriptionStatus) {
          try {
            const result = await desktopApi.getSubscriptionStatus();
            return {
              data: result,
            };
          } catch (error) {
            return {
              error: toIpcError(error),
            };
          }
        }

        const response = await fetchWithBQ('/api/subscriptions/status');

        if (response.error) {
          return { error: response.error };
        }

        return {
          data: response.data as SubscriptionStatusResponse,
        };
      },
    }),
  }),
});

export const {
  useGetPlansQuery,
  useStartFreeTrialMutation,
  useCheckLicenseQuery,
  useLazyCheckLicenseQuery,
  useCreatePaymentMutation,
  useGetSubscriptionStatusQuery,
  useLazyGetSubscriptionStatusQuery,
} = authApi;
export default authApi;
