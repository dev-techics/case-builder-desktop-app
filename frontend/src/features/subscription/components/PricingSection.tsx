import { useState } from 'react';
import type { BillingInterval } from '../types';
import faqsData from '../data/faqs.json';
import PricingHeader from './PricingHeader';
import BillingSwitcher from './BillingSwitcher';
import PricingCard from './PricingCard';
import Faq from './Faq';
import TrustSection from './TrustSection';
import { useGetPlansQuery } from '../api';
import { usePlanSelection } from '../hooks/usePlanSelection';

const PricingSection = () => {
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>('monthly');
  const {
    data: plans = [],
    isError: isPlansError,
    isFetching: isPlansFetching,
    isLoading: isPlansLoading,
    refetch: refetchPlans,
  } = useGetPlansQuery();
  const { errorMessage, onSelectPlan, pendingPlanId } = usePlanSelection();

  return (
    <div className="w-full flex flex-col items-center mt-12">
      <PricingHeader />

      <BillingSwitcher value={billingInterval} onChange={setBillingInterval} />

      {errorMessage && (
        <div className="mb-6 w-full max-w-4xl rounded-xl border border-[var(--color-error-container)] bg-[var(--color-error-container)] px-4 py-3 text-sm font-medium text-[var(--color-on-error-container)]">
          {errorMessage}
        </div>
      )}

      {isPlansLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto items-stretch px-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-[560px] animate-pulse rounded-2xl border border-outline-variant/60 bg-white p-6 md:p-8"
            >
              <div className="h-6 w-36 rounded bg-outline-variant/60" />
              <div className="mt-6 h-12 w-28 rounded bg-outline-variant/60" />
              <div className="mt-8 h-20 rounded bg-outline-variant/40" />
              <div className="mt-8 space-y-4">
                {Array.from({ length: 4 }).map((__, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="h-5 w-full rounded bg-outline-variant/50"
                  />
                ))}
              </div>
              <div className="mt-10 h-12 rounded-xl bg-outline-variant/60" />
            </div>
          ))}
        </div>
      )}

      {!isPlansLoading && isPlansError && (
        <div className="w-full max-w-4xl rounded-xl border border-[var(--color-error-container)] bg-[var(--color-error-container)] px-4 py-4 text-sm font-medium text-[var(--color-on-error-container)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>Unable to load plans. Please try again.</span>
            <button
              type="button"
              onClick={refetchPlans}
              disabled={isPlansFetching}
              className="rounded-lg bg-white/70 px-4 py-2 text-sm font-bold text-[var(--color-on-error-container)] transition hover:bg-white disabled:opacity-60"
            >
              {isPlansFetching ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        </div>
      )}

      {!isPlansLoading && !isPlansError && plans.length === 0 && (
        <div className="w-full max-w-4xl rounded-xl border border-outline-variant/60 bg-white px-4 py-5 text-center text-sm font-medium text-on-surface-variant">
          No subscription plans are available right now.
        </div>
      )}

      {!isPlansLoading && !isPlansError && plans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto items-stretch px-4">
          {plans.map(plan => (
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
      )}

      <Faq faqs={faqsData} />

      <TrustSection />
    </div>
  );
};

export default PricingSection;
