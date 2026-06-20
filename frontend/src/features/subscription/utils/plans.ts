import plansData from '../data/plans.json';
import type { BillingInterval, Plan } from '../types';

export const subscriptionPlans = plansData as Plan[];

export function getPlanById(planId: string | undefined): Plan | null {
    if (!planId) {
        return null;
    }

    return subscriptionPlans.find(plan => plan.id === planId) ?? null;
}

export function getPlanPrice(plan: Plan, interval: BillingInterval): string {
    return interval === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
}

export function getPlanSubtext(
    plan: Plan,
    interval: BillingInterval
): string | null {
    if (plan.tagline) {
        return plan.tagline;
    }

    return interval === 'yearly' ? plan.yearlySubtext : plan.monthlySubtext;
}

export function getBillingLabel(interval: BillingInterval): string {
    return interval === 'yearly' ? 'Yearly billing' : 'Monthly billing';
}

export function isBillingInterval(value: string | null): value is BillingInterval {
    return value === 'monthly' || value === 'yearly';
}

export function isFreePlan(plan: Plan): boolean {
    return plan.id === 'free';
}
