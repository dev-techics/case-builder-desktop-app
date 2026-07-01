import { motion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';

export default function PricingHeader() {
  return (
    <header className="text-center max-w-2xl mb-12 px-4">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-sans text-4xl md:text-5xl font-black text-on-surface tracking-tight mb-3"
      >
        Choose your plan
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="font-sans text-base md:text-lg text-on-surface-variant font-medium mb-6"
      >
        Start with a free trial or unlock full features with a paid plan
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container-low rounded-full border border-outline-variant/60 text-on-surface-variant/90 shadow-sm"
      >
        <BadgeCheck size={16} className="text-primary fill-primary/10" />
        <span className="text-xs font-bold tracking-tight uppercase">Cancel anytime</span>
      </motion.div>
    </header>
  );
}
