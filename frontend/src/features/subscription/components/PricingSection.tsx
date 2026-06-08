import { useState } from 'react';
import type { BillingInterval, Plan } from '../types';
import faqsData from '../data/faqs.json';
import PricingHeader from './PricingHeader';
import BillingSwitcher from './BillingSwitcher';
import PricingCard from './PricingCard';
import Faq from './Faq';
import TrustSection from './TrustSection';
import { subscriptionPlans } from '../utils/plans';
import { useStartFreeTrialMutation } from '../api';
import { toast } from 'react-toastify';


const PricingSection = () => {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
    const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
    const [ startFreeTrial ] = useStartFreeTrialMutation();

    /**-----------------------------------------------------------------------------------  
     * For simplicity, the free trial is treated as a "plan" in the UI, 
     * even though it doesn't have dynamic subtext like the paid plans. 
     * This allows us to reuse the same PricingCard component and maintain a consistent user experience. 
     * When the user selects the free trial, we call the startFreeTrial mutation 
     * which interacts with the desktop API to activate the trial and handle any errors that may arise.
     --------------------------------------------------------------------------------*/
    const onSelectPlan = async (plan: Plan, interval: BillingInterval) =>{
        try{
            if (plan.type === 'free') {
                const result = await startFreeTrial().unwrap();
                console.log(result);
                if (result.success) {
                    setErrorMessage(null);
                    toast.success(result.message || 'Free trial started successfully. Enjoy exploring Case Builder!');
                } else{
                    setErrorMessage(result.message || 'Failed to start free trial. Please try again.');
                }
            } else {
                // For paid plans, we can implement the checkout flow here in the future.
                alert(`Selected ${plan.name} with ${interval} billing. Paid plan checkout flow not implemented yet.`);
            }
        } catch (error) {
            setErrorMessage('Failed to start free trial. Please try again.');
            console.log(error);
        }
    }

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
                {subscriptionPlans.map((plan) => (
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
}

export default PricingSection;