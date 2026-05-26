import { ArrowRight, FolderOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useGetBundlesQuery } from '@/features/bundles-list/api';
import type { BundleStatus } from '@/features/bundles-list/types';
import { formatRelativeTime, getSortTimestamp } from '../utils';

const statusClasses: Record<BundleStatus, string> = {
  'In Progress': 'bg-[var(--dashboard-primary-fixed)] text-[var(--primary)]',
  Complete: 'bg-[#e9f9ef] text-[#1e8e4f]',
  Review: 'bg-[#fff0e8] text-[var(--dashboard-tertiary)]',
  Archived:
    'bg-[var(--dashboard-surface-low)] text-[var(--dashboard-on-surface-variant)]',
};

export const RecentBundles = () => {
  const { data: bundles = [], isLoading, error } = useGetBundlesQuery();
  const navigate = useNavigate();

  const recentBundles = [...bundles]
    .sort(
      (a, b) =>
        getSortTimestamp(b.updatedAt, b.createdAt) -
        getSortTimestamp(a.updatedAt, a.createdAt)
    )
    .slice(0, 4);

  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-[var(--dashboard-surface-lowest)] shadow-[0_10px_28px_rgba(11,28,48,0.05)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-6 py-5">
        <div>
          <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--dashboard-on-surface)]">
            Recent Bundles
          </h2>
          <p className="mt-1 text-[13px] text-[var(--dashboard-on-surface-variant)]">
            Pick up where your latest case work left off.
          </p>
        </div>

        <Button
          asChild
          variant="ghost"
          className="h-9 rounded-full px-3 text-[13px] font-medium text-[var(--primary)] hover:bg-[var(--dashboard-surface-low)] hover:text-[var(--primary)]"
        >
          <Link to="/dashboard/bundles">
            View all bundles
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="p-4">
        {isLoading && bundles.length === 0 ? (
          <p className="px-2 py-8 text-center text-[13px] text-[var(--dashboard-on-surface-variant)]">
            Loading recent bundles...
          </p>
        ) : null}

        {error && bundles.length === 0 ? (
          <p className="px-2 py-8 text-center text-[13px] text-[var(--dashboard-on-surface-variant)]">
            Failed to load recent bundles.
          </p>
        ) : null}

        {!isLoading && !error && recentBundles.length === 0 ? (
          <p className="px-2 py-8 text-center text-[13px] text-[var(--dashboard-on-surface-variant)]">
            No recent bundles yet.
          </p>
        ) : null}

        <div className="space-y-3">
          {recentBundles.map(bundle => (
            <button
              key={bundle.id}
              type="button"
              onClick={() => navigate(`/dashboard/editor/${bundle.id}`)}
              className="group flex w-full items-center justify-between gap-4 rounded-3xl border border-[var(--border)] bg-white px-4 py-4 text-left transition-all hover:border-[var(--dashboard-primary-fixed-dim)] hover:bg-[var(--dashboard-surface-low)]"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--dashboard-primary-fixed)] text-[var(--primary)]">
                  <FolderOpen className="size-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[14px] font-semibold text-[var(--dashboard-on-surface)]">
                      {bundle.name}
                    </p>
                    {bundle.caseNumber ? (
                      <span className="rounded-full bg-[var(--dashboard-surface-low)] px-2.5 py-1 text-[11px] font-medium text-[var(--dashboard-on-surface-variant)]">
                        Case {bundle.caseNumber}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 text-[13px] text-[var(--dashboard-on-surface-variant)]">
                    Updated {formatRelativeTime(bundle.updatedAt ?? bundle.createdAt)}{' '}
                    • {bundle.totalDocuments} document
                    {bundle.totalDocuments === 1 ? '' : 's'}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span
                  className={`hidden rounded-full px-3 py-1 text-[11px] font-semibold sm:inline-flex ${statusClasses[bundle.status]}`}
                >
                  {bundle.status}
                </span>

                <span className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--primary)]">
                  Open
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
