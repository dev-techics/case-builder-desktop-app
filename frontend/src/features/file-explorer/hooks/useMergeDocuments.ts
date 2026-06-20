import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { useAppDispatch, useAppSelector } from '@/app/hooks';

import { useMergeDocumentsMutation } from '../api';
import {
  clearMultiFileSelection,
  selectFile,
  setScrollToFile,
} from '../redux/fileTreeSlice';
import {
  selectIsMergingDocuments,
  selectMergeSelectionContext,
} from '../redux/selectors';

/*================================================================== 
Helper functions for merge operation and merged file name generation 
====================================================================*/
const DEFAULT_MERGED_FILE_NAME = 'Merged document';
const MAX_PREVIEW_FILES = 6;

const stripFileExtension = (fileName: string) =>
  fileName.replace(/\.[^.]+$/, '');

const ensurePdfExtension = (fileName: string) =>
  /\.pdf$/i.test(fileName) ? fileName : `${fileName}`;

const buildDefaultMergedFileName = (fileNames: string[]) => {
  if (fileNames.length === 0) {
    return DEFAULT_MERGED_FILE_NAME;
  }

  const baseName = stripFileExtension(fileNames[0]).trim();
  if (!baseName) {
    return DEFAULT_MERGED_FILE_NAME;
  }

  return ensurePdfExtension(`${baseName} merged`);
};

/*================================================================== 
                            Hook 
====================================================================*/
export const useFileTreeBulkActions = (bundleId: string) => {
  const dispatch = useAppDispatch();
  const isMerging = useAppSelector(selectIsMergingDocuments);
  const { canMerge, files, orderedSelectedFileIds, parentId, parentLabel, reason } =
    useAppSelector(selectMergeSelectionContext);

  const [mergeDocuments] = useMergeDocumentsMutation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mergedFileName, setMergedFileName] = useState(DEFAULT_MERGED_FILE_NAME);

  const selectedCount = files.length;
  const previewFiles = useMemo(() => files.slice(0, MAX_PREVIEW_FILES), [files]);
  const isMergeDisabled = !bundleId || !canMerge || selectedCount < 2 || isMerging;

  const handleClearSelection = () => {
    dispatch(clearMultiFileSelection());
  };

  const handleOpenMergeDialog = () => {
    setMergedFileName(buildDefaultMergedFileName(files.map(file => file.name)));
    setIsDialogOpen(true);
  };

  const handleConfirmMerge = async () => {
    if (isMergeDisabled) {
      return;
    }

    const normalizedFileName = ensurePdfExtension(
      mergedFileName.trim() ||
        buildDefaultMergedFileName(files.map(file => file.name))
    );

    try {
      const mergeResult = await mergeDocuments({
        bundleId,
        documentIds: orderedSelectedFileIds,
        name: normalizedFileName,
        parentId,
      }).unwrap();

      dispatch(clearMultiFileSelection());

      const mergedFileId = mergeResult.mergedDocumentId;
      if (mergeResult.tree.nodes[mergedFileId]?.type === 'file') {
        dispatch(selectFile(mergedFileId));
        dispatch(setScrollToFile(mergedFileId));
      }

      setIsDialogOpen(false);
      toast.success(`Merged ${orderedSelectedFileIds.length} files.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to merge files.');
    }
  };

  return {
    // Dialog state
    isDialogOpen,
    setIsDialogOpen,
    mergedFileName,
    setMergedFileName,
    // Derived values
    selectedCount,
    previewFiles,
    isMergeDisabled,
    isMerging,
    // Selector-driven context
    files,
    parentLabel,
    reason,
    // Handlers
    handleClearSelection,
    handleOpenMergeDialog,
    handleConfirmMerge,
  };
};