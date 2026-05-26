import {
  Archive,
  CheckCircle2,
  Clock3,
  FilePenLine,
  type LucideIcon,
} from 'lucide-react';

import { useGetBundlesQuery } from '@/features/bundles-list/api';
import type { Bundle, BundleStatus } from '@/features/bundles-list/types';
import { formatRelativeTime, getSortTimestamp } from '../utils';

type ActivityItem = {
  id: string | number;
  title: string;
  detail: string;
  timeLabel: string;
  icon: LucideIcon;
  iconClassName: string;
};

const statusMeta: Record<
  BundleStatus,
  Pick<ActivityItem, 'icon' | 'iconClassName'>
> = {
  'In Progress': {
    icon: FilePenLine,
    iconClassName:
      'bg-[var(--dashboard-primary-fixed)] text-[var(--primary)]',
  },
  Complete: {
    icon: CheckCircle2,
    iconClassName: 'bg-[#e9f9ef] text-[#1e8e4f]',
  },
  Review: {
    icon: Clock3,
    iconClassName: 'bg-[#fff0e8] text-[var(--dashboard-tertiary)]',
  },
  Archived: {
    icon: Archive,
    iconClassName:
      'bg-[var(--dashboard-surface-low)] text-[var(--dashboard-on-surface-variant)]',
  },
};

const toActivityItem = (bundle: Bundle): ActivityItem => {
  const hasUpdates =
    Boolean(bundle.updatedAt) &&
    Boolean(bundle.createdAt) &&
    bundle.updatedAt !== bundle.createdAt;
  const meta = statusMeta[bundle.status];

  return {
    id: bundle.id,
    title: hasUpdates ? 'Bundle updated' : 'Bundle created',
    detail: bundle.name,
    timeLabel: formatRelativeTime(bundle.updatedAt ?? bundle.createdAt),
    icon: meta.icon,
    iconClassName: meta.iconClassName,
  };
};

export const ActivityFeed = () => {
  const { data: bundles = [], isLoading, error } = useGetBundlesQuery();

  const items = [...bundles]
    .sort(
      (a, b) =>
        getSortTimestamp(b.updatedAt, b.createdAt) -
        getSortTimestamp(a.updatedAt, a.createdAt)
    )
    .slice(0, 5)
    .map(toActivityItem);

  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-[var(--dashboard-surface-lowest)] p-6 shadow-[0_10px_28px_rgba(11,28,48,0.05)]">
      <div>
        <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--dashboard-on-surface)]">
          Activity Feed
        </h2>
        <p className="mt-1 text-[13px] text-[var(--dashboard-on-surface-variant)]">
          Recent changes across your workspace.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {isLoading && bundles.length === 0 ? (
          <p className="text-[13px] text-[var(--dashboard-on-surface-variant)]">
            Loading activity...
          </p>
        ) : null}

        {error && bundles.length === 0 ? (
          <p className="text-[13px] text-[var(--dashboard-on-surface-variant)]">
            Failed to load workspace activity.
          </p>
        ) : null}

        {!isLoading && !error && items.length === 0 ? (
          <p className="text-[13px] text-[var(--dashboard-on-surface-variant)]">
            Activity will appear here once bundles are created or updated.
          </p>
        ) : null}

        {items.map((item, index) => {
          const Icon = item.icon;

          return (
            <div key={item.id} className="flex gap-3">
              <div className="relative flex flex-col items-center">
                <div
                  className={`flex size-9 items-center justify-center rounded-full ${item.iconClassName}`}
                >
                  <Icon className="size-4" />
                </div>
                {index < items.length - 1 ? (
                  <div className="mt-2 h-full w-px bg-[var(--border)]" />
                ) : null}
              </div>

              <div className="min-w-0 pb-5">
                <p className="text-[13px] font-semibold text-[var(--dashboard-on-surface)]">
                  {item.title}
                </p>
                <p className="mt-1 truncate text-[13px] text-[var(--dashboard-on-surface)]">
                  {item.detail}
                </p>
                <p className="mt-1 text-[12px] text-[var(--dashboard-on-surface-variant)]">
                  {item.timeLabel}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
