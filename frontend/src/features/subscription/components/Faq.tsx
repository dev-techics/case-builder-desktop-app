import { useState } from "react";
import type { FAQItem } from "../types";
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type FaqProps = {
    faqs: FAQItem[]
}
const Faq = ({ faqs }: FaqProps) => {
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

    return (
        <section className="w-full max-w-3xl mt-24 px-4">
            <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight mb-2">
                    Frequently Asked Questions
                </h2>
                <p className="text-sm md:text-base text-on-surface-variant font-medium">
                    Everything you need to know about our legal practice subscriptions.
                </p>
            </div>

            <div className="space-y-4">
                {faqs.map((faq, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                        <div
                            key={idx}
                            className="bg-white rounded-xl border border-outline-variant/60 overflow-hidden transition-all duration-200"
                        >
                            <button
                                onClick={() => {
                                    setOpenFaqIndex(isOpen ? null : idx);
                                }}
                                className="w-full flex justify-between items-center px-6 py-4 text-left font-bold text-sm md:text-base text-on-surface hover:text-primary transition-colors focus:outline-none focus:bg-surface-container-low"
                            >
                                <span>{faq.question}</span>
                                {isOpen ? (
                                    <ChevronUp size={18} className="text-primary" />
                                ) : (
                                    <ChevronDown size={18} className="text-outline" />
                                )}
                            </button>

                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="border-t border-outline-variant/30 bg-surface-container-low/30"
                                    >
                                        <p className="px-6 py-4 text-xs md:text-sm text-on-surface-variant leading-relaxed">
                                            {faq.answer}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </section>
    )
}

export default Faq