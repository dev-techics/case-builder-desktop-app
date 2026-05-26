import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  badge?: string;
  note?: string;
  badgeTone?: 'neutral' | 'positive';
  iconTone?: 'primary' | 'secondary' | 'tertiary';
}

const iconToneClasses: Record<NonNullable<StatsCardProps['iconTone']>, string> =
  {
    primary: 'bg-[var(--dashboard-primary-fixed)] text-[var(--primary)]',
    secondary:
      'bg-[var(--dashboard-secondary-fixed)] text-[var(--dashboard-secondary)]',
    tertiary:
      'bg-[var(--dashboard-tertiary-fixed)] text-[var(--dashboard-tertiary)]',
  };

const badgeToneClasses: Record<NonNullable<StatsCardProps['badgeTone']>, string> =
  {
    neutral:
      'bg-[var(--dashboard-surface-low)] text-[var(--dashboard-on-surface-variant)]',
    positive: 'bg-[#e9f9ef] text-[#1e8e4f]',
  };

export const StatsCard = ({
  title,
  value,
  icon,
  badge,
  note,
  badgeTone = 'neutral',
  iconTone = 'primary',
}: StatsCardProps) => {
  return (
    <section className="rounded-[24px] border border-[var(--border)] bg-[var(--dashboard-surface-lowest)] p-5 shadow-[0_8px_24px_rgba(11,28,48,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div
          className={cn(
            'flex size-12 items-center justify-center rounded-2xl',
            iconToneClasses[iconTone]
          )}
        >
          {icon}
        </div>

        {badge ? (
          <span
            className={cn(
              'rounded-full px-3 py-1 text-[11px] font-semibold',
              badgeToneClasses[badgeTone]
            )}
          >
            {badge}
          </span>
        ) : null}
      </div>

      <div className="mt-7 space-y-1.5">
        <p className="text-[13px] font-medium text-[var(--dashboard-on-surface-variant)]">
          {title}
        </p>
        <p className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--dashboard-on-surface)]">
          {value}
        </p>
        {note ? (
          <p className="text-[12px] text-[var(--dashboard-on-surface-variant)]">
            {note}
          </p>
        ) : null}
      </div>
    </section>
  );
};
