import { useEffect } from 'react';
import {
  CalendarDays,
  Clock3,
  Files,
  FolderKanban,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import { useCreateBundleMutation } from '@/features/bundles-list/api';
import { useCreateBundleDialog } from '@/features/bundles-list/hooks';
import { selectUser } from '@/features/auth/redux/authSlice';
import { CreateBundleDialog } from '@case-builder/ui';
import { useGetStatsQuery } from './api';
import { ActivityFeed } from './components/ActivityFeed';
import { RecentBundles } from './components/RecentBundles';
import { StatsCard } from './components/StatsCard';
import { selectDashboardStats } from './redux';

const createBundleEvent = 'dashboard:create-bundle';

const Dashboard = () => {
  useGetStatsQuery();

  const stats = useAppSelector(selectDashboardStats);
  const user = useAppSelector(selectUser);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createBundle] = useCreateBundleMutation();
  const {
    bundleName,
    canSubmit,
    caseNumber,
    description,
    handleBundleNameChange,
    handleCaseNumberChange,
    handleDescriptionChange,
    handleOpenChange,
    handleSubmit,
    isDialogOpen,
    isSubmitting,
    openCreateDialog,
  } = useCreateBundleDialog({
    createBundle: payload => createBundle(payload).unwrap(),
    onCreated: bundle => navigate(`/dashboard/editor/${bundle.id}`),
  });

  useEffect(() => {
    const handleCreateBundle = () => {
      openCreateDialog();
    };

    window.addEventListener(createBundleEvent, handleCreateBundle);
    return () =>
      window.removeEventListener(createBundleEvent, handleCreateBundle);
  }, [openCreateDialog]);

  useEffect(() => {
    if (searchParams.get('createBundle') !== '1') {
      return;
    }

    openCreateDialog();
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('createBundle');
    setSearchParams(nextSearchParams, { replace: true });
  }, [openCreateDialog, searchParams, setSearchParams]);

  const firstName = user?.name.split(' ')[0] ?? 'there';
  const todayLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <>
      <div className="space-y-6">
        <section className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-on-surface-variant)]">
                Workspace Overview
              </p>
              <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.04em] text-[var(--dashboard-on-surface)]">
                Welcome back, {firstName}
              </h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[var(--dashboard-on-surface-variant)]">
                Review active bundles, recent updates, and storage health across
                your legal workspace.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 text-[13px] font-medium text-[var(--dashboard-on-surface)] shadow-[0_8px_18px_rgba(11,28,48,0.04)]">
                <CalendarDays className="size-4 text-[var(--primary)]" />
                {todayLabel}
              </div>

              <Button
                onClick={openCreateDialog}
                className="h-11 rounded-full bg-[var(--dashboard-primary-container)] px-5 text-[13px] font-semibold text-white shadow-[0_14px_30px_rgba(53,37,205,0.2)] hover:bg-[var(--primary)]"
              >
                Create Bundle
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-75">
          <StatsCard
            title="Total Bundles"
            value={stats.totalBundles}
            icon={<FolderKanban className="size-5" />}
            badge="All matters"
            note="Structured case bundles in the workspace."
            iconTone="primary"
          />
          <StatsCard
            title="Updated This Week"
            value={stats.updatedThisWeek}
            icon={<Clock3 className="size-5" />}
            badge="Active"
            badgeTone="positive"
            note="Bundles touched within the last seven days."
            iconTone="secondary"
          />
          <StatsCard
            title="Total Documents"
            value={stats.totalDocuments}
            icon={<Files className="size-5" />}
            badge="Across workspace"
            note="Documents currently stored across all bundles."
            iconTone="tertiary"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-150">
          <RecentBundles />

          <ActivityFeed />
        </section>
      </div>

      <CreateBundleDialog
        bundleName={bundleName}
        canSubmit={canSubmit}
        caseNumber={caseNumber}
        description={description}
        isSubmitting={isSubmitting}
        open={isDialogOpen}
        onBundleNameChange={handleBundleNameChange}
        onCaseNumberChange={handleCaseNumberChange}
        onDescriptionChange={handleDescriptionChange}
        onOpenChange={handleOpenChange}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default Dashboard;
