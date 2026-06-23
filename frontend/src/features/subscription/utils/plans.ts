import camelcaseKeys from 'camelcase-keys';
import type { BillingInterval, Plan } from '../types';

type PlansResponse = {
    plans: Plan[];
};

// Convert a numeric price string from the API into display-ready currency text.
function formatPlanPrice(price: string): string {
    const numericPrice = Number(price);

    if (Number.isNaN(numericPrice)) {
        return price;
    }

    return `$${numericPrice.toLocaleString('en-US', {
        maximumFractionDigits: numericPrice % 1 === 0 ? 0 : 2,
    })}`;
}

// Convert nullable annual savings into the same currency format as plan prices.
function formatAnnualSavings(savings: string | null): string | null {
    return savings ? formatPlanPrice(savings) : null;
}

// Convert API response keys from snake_case to the frontend's camelCase shape.
function toCamelCase<T>(response: unknown): T {
    if (typeof response === 'object' && response !== null) {
        return camelcaseKeys(response, { deep: true }) as T;
    }

    return response as T;
}

// Format API plan values that are rendered directly in pricing cards.
function formatPlanDisplayValues(plan: Plan): Plan {
    const annualSavings = formatAnnualSavings(plan.annualSavings);

    return {
        ...plan,
        monthlyPrice: formatPlanPrice(plan.monthlyPrice),
        yearlyPrice: formatPlanPrice(plan.yearlyPrice),
        annualSavings,
        yearlySubtext:
            plan.yearlySubtext?.replace(plan.annualSavings ?? '', annualSavings ?? '') ?? null,
    };
}

// Transform the backend plans payload into UI-ready plan objects.
export function transformPlansResponse(response: unknown): Plan[] {
    return toCamelCase<PlansResponse>(response).plans.map(formatPlanDisplayValues);
}

// Resolve the visible price for the selected billing interval.
export function getPlanPrice(plan: Plan, interval: BillingInterval): string {
    return interval === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
}

// Resolve the secondary price text for trial and paid plan cards.
export function getPlanSubtext(
    plan: Plan,
    interval: BillingInterval
): string | null {
    if (plan.tagline) {
        return plan.tagline;
    }

    return interval === 'yearly' ? plan.yearlySubtext : plan.monthlySubtext;
}
