import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';

import { useRenameBundleMutation } from '../api';
import type { Bundle } from '../types';

export const useRenameBundle = () => {
  const [bundleToRename, setBundleToRename] = useState<Bundle | null>(null);
  const [updatedBundle, { isLoading: isRenaming }] = useRenameBundleMutation();

  const openRenameDialog = useCallback((bundle: Bundle) => {
    setBundleToRename(bundle);
  }, []);

  const closeRenameDialog = useCallback(() => {
    setBundleToRename(null);
  }, []);

  const submitRename = useCallback(
    async (nextName: string) => {
      if (!bundleToRename) {
        return;
      }

      const trimmedName = nextName.trim();

      if (!trimmedName || trimmedName === bundleToRename.name.trim()) {
        closeRenameDialog();
        return;
      }

      try {
        await updatedBundle({
          bundleId: bundleToRename.id,
          name: trimmedName,
        }).unwrap();
        toast.success('Bundle renamed successfully');
        closeRenameDialog();
      } catch(err) {
        console.log(err);
        toast.error('Failed to rename bundle');
      }
    },
    [bundleToRename, closeRenameDialog, updatedBundle]
  );

  return {
    bundleToRename,
    closeRenameDialog,
    isRenameDialogOpen: Boolean(bundleToRename),
    isRenaming,
    openRenameDialog,
    submitRename,
  };
};
