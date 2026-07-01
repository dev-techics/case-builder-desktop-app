import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectLicense, setLicense } from '@/features/auth/redux/authSlice';
import { hasDesktopLicenseAccess } from '@/features/auth/utils';
import {
  useCreatePaymentMutation,
  useGetSubscriptionStatusQuery,
  useLazyCheckLicenseQuery,
  useLazyGetSubscriptionStatusQuery,
  useStartFreeTrialMutation,
} from '../api';
import type { BillingInterval, Plan } from '../types';

// Extract the most useful message from RTK Query, IPC, or thrown errors.
function getPlanSelectionErrorMessage(
  error: unknown,
  fallbackMessage: string
): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (!isRecord(error)) {
    return fallbackMessage;
  }

  const directError = readString(error.error);
  if (directError) {
    return directError;
  }

  const data = error.data;
  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (isRecord(data)) {
    return readString(data.message) ?? readString(data.error) ?? fallbackMessage;
  }

  return fallbackMessage;
}

// Narrow unknown values before reading error payload properties.
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// Read a non-empty string value from an unknown error field.
function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function normalizePaymentErrorMessage(error: unknown, fallbackMessage: string): string {
  const message = getPlanSelectionErrorMessage(error, fallbackMessage);

  if (message.toLowerCase().includes('interval field is required')) {
    return 'The interval field is required.';
  }

  return message;
}

const desktopApi =
  typeof window !== 'undefined' && window.api ? window.api : undefined;

// Manage the selected plan flow, including trial activation and paid-plan checkout.
export function usePlanSelection() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);
  const [startFreeTrial] = useStartFreeTrialMutation();
  const [checkLicense] = useLazyCheckLicenseQuery();
  const [getSubscriptionStatus] = useLazyGetSubscriptionStatusQuery();
  const [createPayment] = useCreatePaymentMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const license = useAppSelector(selectLicense);

  const {
    data: subscriptionStatus,
    error: subscriptionStatusError,
    isFetching: isCheckingSubscription,
  } = useGetSubscriptionStatusQuery(undefined, {
    skip: !checkoutPlanId,
    pollingInterval: checkoutPlanId ? 5000 : 0,
  });

  useEffect(() => {
    if (!checkoutPlanId || !subscriptionStatus) {
      return;
    }

    if (subscriptionStatus.license) {
      dispatch(setLicense(subscriptionStatus.license));
    }

    if (subscriptionStatus.success && subscriptionStatus.is_active) {
      setCheckoutPlanId(null);
      setErrorMessage(null);

      if (subscriptionStatus.license && hasDesktopLicenseAccess(subscriptionStatus.license)) {
        navigate('/dashboard');
      }
      return;
    }

    if (
      subscriptionStatus.status === 'cancelled' ||
      subscriptionStatus.status === 'expired'
    ) {
      setCheckoutPlanId(null);
      setErrorMessage(
        'Your payment is no longer active. Please try again if you want to upgrade.'
      );
    }
  }, [checkoutPlanId, dispatch, navigate, subscriptionStatus]);

  useEffect(() => {
    if (!checkoutPlanId || !subscriptionStatusError) {
      return;
    }

    setErrorMessage(
      getPlanSelectionErrorMessage(
        subscriptionStatusError,
        'Unable to confirm your payment status right now.'
      )
    );
  }, [checkoutPlanId, subscriptionStatusError]);

  useEffect(() => {
    if (!desktopApi?.onProtocolUrl) {
      return;
    }

    return desktopApi.onProtocolUrl(async payload => {
      if (payload.host !== 'payment') {
        return;
      }

      try {
        const result = await getSubscriptionStatus(undefined, false).unwrap();
        if (result.license) {
          dispatch(setLicense(result.license));
        }

        if (
          result.success &&
          result.is_active &&
          result.license &&
          hasDesktopLicenseAccess(result.license)
        ) {
          setCheckoutPlanId(null);
          setErrorMessage(null);
          navigate('/dashboard');
        }
      } catch (error) {
        setErrorMessage(
          getPlanSelectionErrorMessage(
            error,
            'Unable to confirm your payment status right now.'
          )
        );
      }
    });
  }, [dispatch, getSubscriptionStatus, navigate]);

  /**-----------------------------------------------------------------------------------
     * For simplicity, the free trial is treated as a "plan" in the UI,
     * even though it doesn't have dynamic subtext like the paid plans.
     * This allows us to reuse the same PricingCard component and maintain a consistent user experience.
     * When the user selects the free trial, we call the startFreeTrial mutation
     * which interacts with the desktop API to activate the trial and handle any errors that may arise.
     --------------------------------------------------------------------------------*/
  const onSelectPlan = async (plan: Plan, interval: BillingInterval) => {
    setPendingPlanId(plan.id);
    setErrorMessage(null);

    try {
      if (plan.type === 'free') {
        /*----------------------------------------------
        Check If license is available in the local state
        ------------------------------------------------*/
        if (hasDesktopLicenseAccess(license)) {
          navigate('/dashboard');
          return;
        }

        /*-----------------------------------------------
        Check for a valid license through the desktop API
        -------------------------------------------------*/
        /*-------------------------------
         Call the license check IPC here
         If a valid license is found.
             1. set it to the redux state
             2. navigate to the dashboard
          If free trial is expired show an message
          If no license is found, proceed to start the free trial as below.
        ----------------------------------------*/
        const checkedLicense = await checkLicense(undefined, false).unwrap();
        dispatch(setLicense(checkedLicense));

        if (hasDesktopLicenseAccess(checkedLicense)) {
          navigate('/dashboard');
          return;
        }

        if (checkedLicense?.status === 'expired') {
          setErrorMessage(
            'Your free trial has expired. Please choose a paid plan to continue.'
          );
          return;
        }

        /*--------------------------------------------
          Start the free trial through the desktop API
        -----------------------------------------------*/
        const result = await startFreeTrial().unwrap();

        /* ---------------------------------------------------------------------------------
          If user already has a valid license, we navigate them to the dashboard immediately.
        ------------------------------------------------------------------------------------*/
        if (result.license) {
          dispatch(setLicense(result.license)); // Update license in the global state
        }

        const trialStatus = String(result.status ?? '');

        if (result.success && trialStatus === '200' && result.license) {
          setErrorMessage(null);
          if (hasDesktopLicenseAccess(result.license)) {
            navigate('/dashboard');
          }
        } else if (result.success && trialStatus === '201') {
          toast.success(
            result.message ||
              'Free trial started successfully. Enjoy exploring Case Builder!'
          );
          setTimeout(() => {
            navigate('/dashboard');
          }, 4000);
        } else {
          setErrorMessage(
            result.message || 'Failed to start free trial. Please try again.'
          );
        }
      } else {
        /*--------------------------------------------
          Create the PayPal subscription checkout
        -----------------------------------------------*/
        const result = await createPayment({
          planId: plan.id,
          billingInterval: interval,
        }).unwrap();
        console.log('PayPal checkout result:', result);
        if (!result.success) {
          setErrorMessage(
            normalizePaymentErrorMessage(
              result.error,
              'Unable to open PayPal checkout.'
            )
          );
          return;
        }

        setCheckoutPlanId(plan.id);
        toast.info(
          'PayPal checkout opened in your browser. We will keep checking your subscription status.'
        );
      }
    } catch (error) {
      if (plan.type === 'paid') {
        setErrorMessage(
          normalizePaymentErrorMessage(
            error,
            'Unable to open PayPal checkout.'
          )
        );
        return;
      }

      setErrorMessage(
        getPlanSelectionErrorMessage(
          error,
          'Failed to start free trial. Please try again.'
        )
      );
    } finally {
      setPendingPlanId(null);
    }
  };

  return {
    errorMessage,
    onSelectPlan,
    pendingPlanId,
    isCheckingSubscription,
    isCheckoutPending: !!checkoutPlanId,
  };
}
