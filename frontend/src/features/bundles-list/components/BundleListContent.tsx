import { FileStack, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Bundle, BundleStatus, ViewMode } from '../types';
import { BundleGridCard, BundleTableRow } from './BundleListItems';

type BundleListItem = {
  bundle: Bundle;
  lastModifiedLabel: string;
  lastModifiedTitle?: string;
};

type BundleListContentProps = {
  bundles: BundleListItem[];
  error: unknown;
  isLoading: boolean;
  onCreateBundle: () => void;
  onDelete: (bundleId: string | number) => void;
  onDuplicate: (bundle: Bundle) => void;
  onOpen: (bundle: Bundle) => void;
  onRename: (bundle: Bundle) => void;
  onStatusChange: (bundle: Bundle, status: BundleStatus) => void;
  sourceBundleCount: number;
  updatingStatusBundleId: Bundle['id'] | null;
  viewMode: ViewMode;
};

const headings = ['Bundle Name', 'Documents', 'Status', 'Last Modified'];

export const BundleListContent = ({
  bundles,
  error,
  isLoading,
  onCreateBundle,
  onDelete,
  onDuplicate,
  onOpen,
  onRename,
  onStatusChange,
  sourceBundleCount,
  updatingStatusBundleId,
  viewMode,
}: BundleListContentProps) => {
  if (isLoading) {
    return (
      <div className="py-12 text-center text-[13px] text-[var(--dashboard-on-surface-variant)]">
        Loading bundles...
      </div>
    );
  }

  if (error && sourceBundleCount === 0) {
    return (
      <div className="py-12 text-center text-[13px] text-[var(--destructive)]">
        Failed to load bundles. Please try again.
      </div>
    );
  }

  if (bundles.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-[var(--dashboard-primary-fixed)] text-[var(--primary)]">
          <FileStack className="size-7" />
        </div>
        <h3 className="mb-2 text-[18px] font-semibold tracking-[-0.02em] text-[var(--dashboard-on-surface)]">
          No bundles found
        </h3>
        <p className="mb-4 text-[13px] text-[var(--dashboard-on-surface-variant)]">
          Try adjusting your search or create a new bundle
        </p>
        <Button
          onClick={onCreateBundle}
          className="h-10 rounded-full bg-[var(--dashboard-primary-container)] px-4 text-[13px] font-semibold text-white hover:bg-[var(--primary)]"
        >
          <Plus className="size-4" />
          Create Your First Bundle
        </Button>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {bundles.map(item => (
          <BundleGridCard
            key={item.bundle.id}
            {...item}
            onOpen={onOpen}
            onStatusChange={status => onStatusChange(item.bundle, status)}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onRename={onRename}
            isStatusUpdating={updatingStatusBundleId === item.bundle.id}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[24px] border border-[var(--border)] bg-white">
      <table className="w-full min-w-[760px]">
        <thead className="bg-[var(--dashboard-surface-low)]">
          <tr>
            {headings.map(heading => (
              <th
                key={heading}
                className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-on-surface-variant)]"
              >
                {heading}
              </th>
            ))}
            <th className="w-12 px-5 py-3" />
          </tr>
        </thead>
        <tbody>
          {bundles.map(item => (
            <BundleTableRow
              key={item.bundle.id}
              {...item}
              onOpen={onOpen}
              onStatusChange={status => onStatusChange(item.bundle, status)}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onRename={onRename}
              isStatusUpdating={updatingStatusBundleId === item.bundle.id}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
