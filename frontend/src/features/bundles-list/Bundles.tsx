import { useMemo, useState } from 'react';
import { BundleRenameDialog, CreateBundleDialog } from '@case-builder/ui';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { useAppDispatch } from '@/app/hooks';
import { getSortTimestamp } from '../dashboard/utils';
import {
  bundleListApi,
  useCreateBundleMutation,
  useDeleteBundleMutation,
  useGetBundlesQuery,
  useUpdateBundleStatusMutation,
} from './api';
import { BundleListContent } from './components/BundleListContent';
import {
  BundleListControls,
  BundleListHero,
} from './components/BundleListControls';
import { useCreateBundleDialog, useRenameBundle } from './hooks';
import type { Bundle, BundleStatus, SortOption, ViewMode } from './types';
import { formatBundleTimestamp } from './utils/formatBundleTimestamp';

const createDuplicateBundle = (bundle: Bundle): Bundle => ({
  ...bundle,
  id: crypto.randomUUID(),
  name: `${bundle.name} (Copy)`,
  updatedAt: new Date().toISOString().split('T')[0],
  status: 'In Progress',
});

type BundleListItem = {
  bundle: Bundle;
  lastModifiedLabel: string;
  lastModifiedTitle?: string;
};

const sortBundles = (items: BundleListItem[], sortBy: SortOption) => {
  return [...items].sort((a, b) => {
    if (sortBy === 'oldest') {
      return (
        getSortTimestamp(a.bundle.updatedAt, a.bundle.createdAt) -
        getSortTimestamp(b.bundle.updatedAt, b.bundle.createdAt)
      );
    }

    if (sortBy === 'name-asc') return a.bundle.name.localeCompare(b.bundle.name);
    if (sortBy === 'name-desc') return b.bundle.name.localeCompare(a.bundle.name);
    if (sortBy === 'documents') {
      return b.bundle.totalDocuments - a.bundle.totalDocuments;
    }

    return (
      getSortTimestamp(b.bundle.updatedAt, b.bundle.createdAt) -
      getSortTimestamp(a.bundle.updatedAt, a.bundle.createdAt)
    );
  });
};

const BundleList = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [updatingStatusBundleId, setUpdatingStatusBundleId] = useState<
    Bundle['id'] | null
  >(null);
  const [createBundle] = useCreateBundleMutation();
  const [deleteBundle] = useDeleteBundleMutation();
  const [updateBundleStatus] = useUpdateBundleStatusMutation();
  const { data: bundles = [], isLoading, error } = useGetBundlesQuery();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    bundleName,
    canSubmit: canCreateBundle,
    caseNumber,
    description,
    handleBundleNameChange,
    handleCaseNumberChange,
    handleDescriptionChange,
    handleOpenChange: handleCreateDialogOpenChange,
    handleSubmit: handleCreateBundleSubmit,
    isDialogOpen: isCreateDialogOpen,
    isSubmitting: isCreatingBundle,
    openCreateDialog,
  } = useCreateBundleDialog({
    createBundle: payload => createBundle(payload).unwrap(),
  });

  const {
    bundleToRename,
    closeRenameDialog,
    isRenameDialogOpen,
    isRenaming,
    openRenameDialog,
    submitRename,
  } = useRenameBundle();

  const filteredBundles: BundleListItem[] = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    const visibleBundles = bundles.filter(bundle => {
      if (!bundle?.name || !bundle?.caseNumber) return false;

      return (
        bundle.name.toLowerCase().includes(normalizedSearchTerm) ||
        bundle.caseNumber.toLowerCase().includes(normalizedSearchTerm)
      );
    });

    return sortBundles(
      visibleBundles.map(bundle => {
        const lastModifiedLabel = formatBundleTimestamp(bundle.updatedAt);

        return {
          bundle,
          lastModifiedLabel,
          lastModifiedTitle:
            lastModifiedLabel !== '—' ? lastModifiedLabel : undefined,
        };
      }),
      sortBy
    );
  }, [bundles, searchTerm, sortBy]);

  const handleOpenBundle = (bundle: Bundle) => {
    navigate(`/dashboard/editor/${bundle.id}`);
  };

  const handleBundleDelete = async (id: string | number) => {
    try {
      await deleteBundle(id).unwrap();
      toast.success('Bundle Deleted Successfully');
    } catch {
      toast.error('Failed to delete bundle');
    }
  };

  const handleBundleDuplicate = (bundle: Bundle) => {
    const duplicatedBundle = createDuplicateBundle(bundle);

    dispatch(
      bundleListApi.util.updateQueryData('getBundles', undefined, draft => {
        const originalBundleIndex = draft.findIndex(
          item => item.id === bundle.id
        );

        if (originalBundleIndex === -1) draft.unshift(duplicatedBundle);
        else draft.splice(originalBundleIndex + 1, 0, duplicatedBundle);
      })
    );

    toast.success('Bundle Duplicated Successfully');
  };

  const handleBundleStatusChange = async (
    bundle: Bundle,
    status: BundleStatus
  ) => {
    if (status === bundle.status) return;

    setUpdatingStatusBundleId(bundle.id);
    try {
      await updateBundleStatus({ bundleId: bundle.id, status }).unwrap();
      toast.success(`Bundle status updated to ${status}`);
    } catch {
      toast.error('Failed to update bundle status');
    } finally {
      setUpdatingStatusBundleId(currentId =>
        currentId === bundle.id ? null : currentId
      );
    }
  };

  const handleRenameDialogOpenChange = (open: boolean) => {
    if (!open) closeRenameDialog();
  };

  return (
    <div className="space-y-6">
      <BundleListHero onCreateBundle={openCreateDialog} />

      <section className="rounded-[28px] border border-[var(--border)] bg-[var(--dashboard-surface-lowest)] shadow-[0_10px_28px_rgba(11,28,48,0.05)] animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-75">
        <BundleListControls
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          setSortBy={setSortBy}
          setViewMode={setViewMode}
          sortBy={sortBy}
          viewMode={viewMode}
        />

        <div className="p-5">
          <BundleListContent
            bundles={filteredBundles}
            error={error}
            isLoading={isLoading}
            onCreateBundle={openCreateDialog}
            onDelete={handleBundleDelete}
            onDuplicate={handleBundleDuplicate}
            onOpen={handleOpenBundle}
            onRename={openRenameDialog}
            onStatusChange={(bundle, status) =>
              void handleBundleStatusChange(bundle, status)
            }
            sourceBundleCount={bundles.length}
            updatingStatusBundleId={updatingStatusBundleId}
            viewMode={viewMode}
          />
        </div>
      </section>

      <CreateBundleDialog
        bundleName={bundleName}
        canSubmit={canCreateBundle}
        caseNumber={caseNumber}
        description={description}
        isSubmitting={isCreatingBundle}
        open={isCreateDialogOpen}
        onBundleNameChange={handleBundleNameChange}
        onCaseNumberChange={handleCaseNumberChange}
        onDescriptionChange={handleDescriptionChange}
        onOpenChange={handleCreateDialogOpenChange}
        onSubmit={handleCreateBundleSubmit}
      />
      <BundleRenameDialog
        key={bundleToRename?.id ?? 'rename-dialog'}
        bundle={bundleToRename}
        isSubmitting={isRenaming}
        open={isRenameDialogOpen}
        onOpenChange={handleRenameDialogOpenChange}
        onSubmit={submitRename}
      />
    </div>
  );
};

export default BundleList;
