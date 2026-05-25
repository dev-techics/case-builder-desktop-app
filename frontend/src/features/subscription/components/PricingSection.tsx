import { useState } from 'react';
import type { BillingInterval } from '../types';
import plansData from '../data/plans.json';
import faqsData from '../data/faqs.json';
import PricingHeader from './PricingHeader';
import BillingSwitcher from './BillingSwitcher';
import PricingCard from './PricingCard';
import Faq from './Faq';
import TrustSection from './TrustSection';

interface PricingSectionProps {
    onSelectPlan: (planName: string, price: string, interval: BillingInterval) => void;
    onNotify: (message: string) => void;
}

export default function PricingSection({ onSelectPlan, onNotify }: Readonly<PricingSectionProps>) {
    const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

    function handleIntervalChange(next: BillingInterval) {
        setBillingInterval(next);
        onNotify(
            next === 'yearly'
                ? 'Switched to Yearly billing (Save 20%).'
                : 'Switched to Monthly billing.'
        );
    }

    return (
        <div className="w-full flex flex-col items-center mt-12">
            <PricingHeader />

            <BillingSwitcher value={billingInterval} onChange={handleIntervalChange} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto items-stretch px-4">
                {plansData.map((plan) => (
                    <PricingCard
                        key={plan.id}
                        plan={plan}
                        billingInterval={billingInterval}
                        onSelectPlan={onSelectPlan}
                        onNotify={onNotify}
                    />
                ))}
            </div>

            <Faq faqs={faqsData} />

            <TrustSection />
        </div>
    );
}