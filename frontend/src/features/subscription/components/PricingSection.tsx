import { useState } from 'react';
import type { BillingInterval, Plan } from '../types';
import faqsData from '../data/faqs.json';
import PricingHeader from './PricingHeader';
import BillingSwitcher from './BillingSwitcher';
import PricingCard from './PricingCard';
import Faq from './Faq';
import TrustSection from './TrustSection';
import { subscriptionPlans } from '../utils/plans';
import { useLazyCheckLicenseQuery, useStartFreeTrialMutation } from '../api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectLicense, setLicense } from '@/features/auth/redux/authSlice';
import { hasDesktopLicenseAccess } from '@/features/auth/utils';

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

const PricingSection = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>('monthly');
  const [startFreeTrial] = useStartFreeTrialMutation();
  const [checkLicense] = useLazyCheckLicenseQuery();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const license = useAppSelector(selectLicense);

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
        /* TODO:-------------------------------
        * Logic
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
        // For paid plans, we can implement the checkout flow here in the future.
        alert(
          `Selected ${plan.name} with ${interval} billing. Paid plan checkout flow not implemented yet.`
        );
      }
    } catch (error) {
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

  return (
    <div className="w-full flex flex-col items-center mt-12">
      <PricingHeader />

      <BillingSwitcher value={billingInterval} onChange={setBillingInterval} />

      {errorMessage && (
        <div className="mb-6 w-full max-w-4xl rounded-xl border border-[var(--color-error-container)] bg-[var(--color-error-container)] px-4 py-3 text-sm font-medium text-[var(--color-on-error-container)]">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto items-stretch px-4">
        {subscriptionPlans.map(plan => (
          <PricingCard
            key={plan.id}
            plan={plan}
            billingInterval={billingInterval}
            isLoading={pendingPlanId === plan.id}
            isDisabled={pendingPlanId !== null && pendingPlanId !== undefined}
            onSelectPlan={onSelectPlan}
          />
        ))}
      </div>

      <Faq faqs={faqsData} />

      <TrustSection />
    </div>
  );
};

export default PricingSection;
