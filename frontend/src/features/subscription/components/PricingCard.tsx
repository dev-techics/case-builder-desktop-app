import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, BadgeCheck, HelpCircle, Star, Sparkles } from 'lucide-react';
import type { BillingInterval, Plan } from '../types';
import { useNavigate } from 'react-router-dom';

interface PricingCardProps {
    plan: Plan;
    billingInterval: BillingInterval;
    onSelectPlan: (planName: string, price: string, interval: BillingInterval) => void;
    onNotify: (message: string) => void;
}

export default function PricingCard({
    plan,
    billingInterval,
    onSelectPlan,
    onNotify,
}: Readonly<PricingCardProps>) {
    const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);
    const navigate = useNavigate();
    const isYearly = billingInterval === 'yearly';
    const activePrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    const activeSubtext = isYearly ? plan.yearlySubtext : plan.monthlySubtext;

    function handleCta() {
        onSelectPlan(plan.name, activePrice, billingInterval);
        navigate('/dashboard');
    }

    return (
        <motion.div
            className={`relative bg-white flex flex-col rounded-2xl p-6 md:p-8 transition-all duration-300 hover:-translate-y-1 ${plan.highlighted
                ? 'border-2 border-primary shadow-[0_20px_50px_rgba(53,37,205,0.12)] hover:shadow-2xl'
                : 'border border-outline-variant/60 hover:shadow-xl group'
                }`}
        >
            {/* Badge */}
            {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-5 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-md flex items-center gap-1.5">
                    <Star size={12} className="fill-white" />
                    {plan.badge}
                </div>
            )}

            {/* Plan name + price */}
            <div className={`mb-6 ${plan.badge ? 'mt-2' : ''}`}>
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-extrabold text-on-surface flex items-center gap-1.5">
                        {plan.name}
                        {plan.highlighted && (
                            <Sparkles size={16} className="text-primary fill-primary/15" />
                        )}
                    </h3>
                </div>

                <div className="flex items-baseline mt-4 gap-1">
                    <motion.span
                        key={billingInterval}
                        initial={{ scale: 0.9, opacity: 0.7 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-4xl md:text-5xl font-black text-on-surface tracking-tight"
                    >
                        {activePrice}
                    </motion.span>

                    {/* Hide "/ month" for free plan since it shows a tagline instead */}
                    {!plan.tagline && (
                        <span className="text-sm md:text-base font-semibold text-on-surface-variant">
                            / {isYearly ? 'year' : 'month'}
                        </span>
                    )}
                </div>

                {/* Tagline (e.g. "14-day access") OR animated subtext for paid plans */}
                {plan.tagline ? (
                    <p className="text-sm text-primary font-extrabold mt-2 tracking-wide uppercase">
                        {plan.tagline}
                    </p>
                ) : (
                    <div className="h-5 mt-1 overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={billingInterval}
                                initial={{ y: 5, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -5, opacity: 0 }}
                                className={`text-xs font-semibold ${isYearly
                                    ? 'text-on-surface-variant/90'
                                    : 'text-on-surface-variant/70'
                                    }`}
                            >
                                {activeSubtext}
                            </motion.p>
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <p className="text-sm md:text-base text-on-surface-variant leading-relaxed mb-6">
                {plan.description}
            </p>

            <div className="w-full h-px bg-outline-variant/60 mb-6" />

            {/* Feature list */}
            <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature) => (
                    <li key={feature.id} className="flex items-start gap-3">
                        <span
                            className="p-1 rounded-full bg-primary/10 text-primary mt-0.5"
                            aria-hidden="true"
                        >
                            {plan.highlighted ? (
                                <BadgeCheck size={15} className="fill-primary/10" />
                            ) : (
                                <Check size={14} className="stroke-[3]" />
                            )}
                        </span>

                        <div className="relative flex items-center gap-1.5">
                            <span
                                className={`text-sm text-on-surface ${plan.highlighted ? 'font-semibold' : 'font-medium'
                                    }`}
                            >
                                {feature.label}
                            </span>

                            {feature.tooltip && (
                                <>
                                    <button
                                        onMouseEnter={() => setHoveredTooltip(feature.id)}
                                        onMouseLeave={() => setHoveredTooltip(null)}
                                        onClick={() => onNotify(feature.tooltip!)}
                                        className="text-outline hover:text-primary focus:outline-none transition-colors"
                                        aria-label={`More info about ${feature.label}`}
                                    >
                                        <HelpCircle size={14} />
                                    </button>

                                    {hoveredTooltip === feature.id && (
                                        <div className="absolute top-6 left-0 bg-on-surface text-white text-[11px] p-2 rounded-lg max-w-xs z-10 shadow-lg">
                                            {feature.tooltip}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </li>
                ))}
            </ul>

            {/* CTA button */}
            {plan.highlighted ? (
                <button
                    onClick={handleCta}
                    className="w-full py-3.5 px-4 bg-primary text-on-primary font-bold text-sm tracking-wide rounded-xl hover:bg-primary-container transition-all shadow-md cursor-pointer hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-primary/20 whitespace-nowrap duration-150"
                >
                    {plan.ctaLabel}
                </button>
            ) : (
                <button
                    onClick={handleCta}
                    className="w-full py-3.5 px-4 border-2 border-primary text-primary font-bold text-sm tracking-wide rounded-xl hover:bg-primary-fixed transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/10 whitespace-nowrap active:scale-[0.98]"
                >
                    {plan.ctaLabel}
                </button>
            )}
        </motion.div>
    );
}