export type BillingInterval = 'monthly' | 'yearly';

export interface FAQItem {
    id: string;
    question: string;
    answer: string;
}

export interface PlanFeature {
    id: string;
    label: string;
    tooltip: string | null;
}

export interface Plan {
    id: string;
    name: string;
    monthlyPrice: string;
    yearlyPrice: string;
    /** Short line shown below the price (e.g. "14-day access"). Null for plans that use dynamic subtext. */
    tagline: string | null;
    description: string;
    /** Renders the card with primary-coloured border, shadow, and badge. */
    highlighted: boolean;
    /** Text inside the "Most Popular" pill. Null hides the badge entirely. */
    badge: string | null;
    ctaLabel: string;
    /** E.g. "$58" — rendered in the annual savings copy. Null if no savings message needed. */
    annualSavings: string | null;
    /** Subtext shown when billing is monthly. */
    monthlySubtext: string | null;
    /** Subtext shown when billing is yearly. */
    yearlySubtext: string | null;
    features: PlanFeature[];
}