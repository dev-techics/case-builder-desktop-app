import type { BillingInterval } from '../types';

interface BillingSwitcherProps {
  value: BillingInterval;
  onChange: (interval: BillingInterval) => void;
}

const BillingSwitcher =({
  value,
  onChange,
}: Readonly<BillingSwitcherProps>) => {
  const isYearly = value === 'yearly';

  return (
    <div className="flex items-center justify-center gap-4 mb-12 p-1.5 bg-surface-container-low rounded-full border border-outline-variant/70 shadow-sm">
      <button
        onClick={() => onChange('monthly')}
        className={`text-xs md:text-sm px-4 py-2 rounded-full transition-all duration-200 cursor-pointer focus:outline-none ${
          !isYearly
            ? 'bg-white text-primary font-bold shadow-sm'
            : 'text-on-surface-variant hover:text-on-surface font-medium'
        }`}
      >
        Monthly billing
      </button>

      {/* Slider toggle */}
      <button
        onClick={() => onChange(isYearly ? 'monthly' : 'yearly')}
        className="relative w-12 h-7 bg-[#c7c4d8] rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
        aria-label="Toggle billing cycle"
      >
        <div
          className={`absolute top-1 left-1 w-5 h-5 bg-white bg-linear-to-b from-white to-gray-50 rounded-full shadow-md transition-all duration-300 transform ${
            isYearly ? 'translate-x-5' : ''
          }`}
        />
      </button>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange('yearly')}
          className={`text-xs md:text-sm px-4 py-2 rounded-full transition-all duration-200 cursor-pointer focus:outline-none ${
            isYearly
              ? 'bg-white text-primary font-bold shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface font-medium'
          }`}
        >
          Yearly billing
        </button>
        <span className="bg-tertiary-container/15 text-tertiary font-extrabold text-[10px] px-2 py-1 rounded-full uppercase tracking-wider animate-pulse border border-tertiary/20">
          Save 20%
        </span>
      </div>
    </div>
  );
}

export default BillingSwitcher;