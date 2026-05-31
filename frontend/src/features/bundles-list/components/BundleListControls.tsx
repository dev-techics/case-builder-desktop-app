import {
  Grid3X3,
  List,
  Plus,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { SortOption, ViewMode } from '../types';

type BundleListControlsProps = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  setSortBy: (value: SortOption) => void;
  setViewMode: (value: ViewMode) => void;
  sortBy: SortOption;
  viewMode: ViewMode;
};

export const BundleListHero = ({
  onCreateBundle,
}: {
  onCreateBundle: () => void;
}) => (
  <section className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-on-surface-variant)]">
          Bundle Library
        </p>
        <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.04em] text-[var(--dashboard-on-surface)]">
          Case Bundles
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[var(--dashboard-on-surface-variant)]">
          Manage organized case files, review status, and jump back into active
          document work.
        </p>
      </div>

      <Button
        onClick={onCreateBundle}
        className="h-11 rounded-full bg-[var(--dashboard-primary-container)] px-5 text-[13px] font-semibold text-white shadow-[0_14px_30px_rgba(53,37,205,0.2)] hover:bg-[var(--primary)]"
      >
        <Plus className="size-4" />
        Create Bundle
      </Button>
    </div>
  </section>
);

export const BundleListControls = ({
  searchTerm,
  setSearchTerm,
  setSortBy,
  setViewMode,
  sortBy,
  viewMode,
}: BundleListControlsProps) => (
  <div className="flex flex-col gap-4 border-b border-[var(--border)] px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
    <div className="relative min-w-0 flex-1 lg:max-w-md">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--dashboard-on-surface-variant)]" />
      <Input
        value={searchTerm}
        onChange={event => setSearchTerm(event.target.value)}
        placeholder="Search bundles by name or case number..."
        className="h-11 rounded-full border-[var(--border)] bg-[var(--dashboard-surface-low)] pl-11 pr-4 text-[13px] text-[var(--dashboard-on-surface)] placeholder:text-[var(--dashboard-on-surface-variant)] focus-visible:border-[var(--dashboard-primary-container)] focus-visible:ring-[3px] focus-visible:ring-[color:rgba(79,70,229,0.16)]"
      />
    </div>

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="inline-flex h-10 rounded-full border border-[var(--border)] bg-[var(--dashboard-surface-low)] p-1">
        {(['grid', 'list'] as ViewMode[]).map(mode => {
          const Icon = mode === 'grid' ? Grid3X3 : List;

          return (
            <Button
              key={mode}
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setViewMode(mode)}
              className={cn(
                'size-8 rounded-full text-[var(--dashboard-on-surface-variant)] hover:bg-white hover:text-[var(--dashboard-on-surface)]',
                viewMode === mode &&
                  'bg-white text-[var(--primary)] shadow-[0_6px_14px_rgba(11,28,48,0.08)]'
              )}
              aria-label={`Show bundles in ${mode} view`}
            >
              <Icon className="size-4" />
            </Button>
          );
        })}
      </div>

      <Select value={sortBy} onValueChange={value => setSortBy(value as SortOption)}>
        <SelectTrigger className="h-10 min-w-[190px] rounded-full border-[var(--border)] bg-white px-4 text-[13px] text-[var(--dashboard-on-surface)] shadow-[0_8px_18px_rgba(11,28,48,0.04)]">
          <SlidersHorizontal className="size-4 text-[var(--primary)]" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-[var(--border)] bg-white">
          <SelectItem value="recent">Most Recent</SelectItem>
          <SelectItem value="oldest">Oldest First</SelectItem>
          <SelectItem value="name-asc">Name (A-Z)</SelectItem>
          <SelectItem value="name-desc">Name (Z-A)</SelectItem>
          <SelectItem value="documents">Document Count</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);
