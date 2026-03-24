import { useEffect } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { loadComments } from '@/features/toolbar/redux';
import {
  clearDocumentInfo,
  loadMetadataFromBackend,
  setCurrentBundleId,
} from '@/features/properties-panel/redux/propertiesPanelSlice';

type UseBundleMetadataOptions = {
  bundleId?: string;
  treeId: string;
};

export const useBundleMetadata = ({
  bundleId,
  treeId,
}: UseBundleMetadataOptions) => {
  const dispatch = useAppDispatch();
  const isDesktop = !!window.api;

  useEffect(() => {
    if (isDesktop) return;
    if (bundleId) {
      dispatch(loadComments({ bundleId }));
    }
  }, [dispatch, bundleId, isDesktop]);

  useEffect(() => {
    if (isDesktop) return;
    if (bundleId) {
      dispatch(clearDocumentInfo());
    }
  }, [bundleId, dispatch, isDesktop]);

  useEffect(() => {
    if (isDesktop) return;
    const resolvedBundleId = treeId.split('-')[1];
    if (resolvedBundleId) {
      dispatch(setCurrentBundleId(resolvedBundleId));
      dispatch(loadMetadataFromBackend(resolvedBundleId));
    }
  }, [dispatch, treeId, isDesktop]);
};
