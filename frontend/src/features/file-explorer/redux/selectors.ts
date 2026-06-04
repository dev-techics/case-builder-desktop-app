import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@/app/store';

import { dedupeOrdered, getChildIds } from './fileTreeModel';
import type { FileTree, FileTreeNode } from '../types/fileTree';

const ROOT_PARENT_KEY = '__ROOT__';

export const selectFileTreeState = (state: RootState) => state.fileTree;

export const selectFileTree = (state: RootState) => state.fileTree.tree;

export const selectExpandedFolders = (state: RootState) =>
  state.fileTree.expanded;

export const selectSelectedFileIds = (state: RootState) =>
  state.fileTree.selectedFileIds;

export const selectSelectionAnchorId = (state: RootState) =>
  state.fileTree.selectionAnchorId;

export const selectIsMergingDocuments = (state: RootState) =>
  state.fileTree.operationsInProgress.merging;

const collectFileIds = ({
  tree,
  rootExpanded,
  isFolderExpanded,
}: {
  tree: FileTree;
  rootExpanded: boolean;
  isFolderExpanded: (folderId: string) => boolean;
}) => {
  if (!rootExpanded) {
    return [];
  }

  const ids: string[] = [];
  const visited = new Set<string>();

  const walk = (childIds: ReadonlyArray<string>) => {
    for (const childId of childIds) {
      if (visited.has(childId)) {
        continue;
      }

      visited.add(childId);

      const node = tree.nodes[childId];
      if (!node) {
        continue;
      }

      if (node.type === 'file') {
        ids.push(node.id);
        continue;
      }

      if (!isFolderExpanded(node.id)) {
        continue;
      }

      walk(getChildIds(tree, node.id));
    }
  };

  walk(getChildIds(tree, null));
  return ids;
};

export const selectAllFileIds = createSelector([selectFileTree], tree =>
  collectFileIds({
    tree,
    rootExpanded: true,
    isFolderExpanded: () => true,
  })
);

export const selectVisibleFileIds = createSelector(
  [selectFileTree, selectExpandedFolders],
  (tree, expanded) =>
    collectFileIds({
      tree,
      rootExpanded: Boolean(expanded[tree.id]),
      isFolderExpanded: folderId => Boolean(expanded[folderId]),
    })
);

export const selectOrderedSelectedFileIds = createSelector(
  [selectSelectedFileIds, selectAllFileIds],
  (selectedFileIds, allFileIds) => {
    const selectedSet = new Set(selectedFileIds);
    return allFileIds.filter(fileId => selectedSet.has(fileId));
  }
);

type MergeSelectionFile = Extract<FileTreeNode, { type: 'file' }>;

export type FileMergeSelectionContext = {
  canMerge: boolean;
  orderedSelectedFileIds: string[];
  files: MergeSelectionFile[];
  parentId: string | null;
  parentLabel: string;
  reason: string | null;
};

/**
 * This selector computes the context for merging files based on the current file tree and the selected file IDs.
 * It checks if the selected files can be merged (e.g., they must all be files and share the same parent folder).
 * It returns the ordered list of selected file IDs, the corresponding file nodes, the common parent ID and label (or root if no parent),
 * and a reason message if merging is not possible.
 */
export const selectMergeSelectionContext = createSelector(
  [selectFileTree, selectOrderedSelectedFileIds],
  (tree, orderedSelectedFileIds): FileMergeSelectionContext => {

    /* It maps each selected ID to its actual node object, 
     - then filters out anything that isn't a file (e.g. folders that somehow ended up in the selection). 
     - The result is an ordered array of only file nodes. 
     */
    const files = orderedSelectedFileIds
      .map(fileId => tree.nodes[fileId])
      .filter((node): node is MergeSelectionFile =>
        Boolean(node?.type === 'file')
      );

    const rootLabel = tree.projectName || tree.name;

    /* Early return if no files are selected, 
     - since we can't merge anything in that case.
    */
    if (files.length === 0) {
      return {
        canMerge: false,
        orderedSelectedFileIds: [],
        files: [],
        parentId: null,
        parentLabel: rootLabel,
        reason: 'Select files to merge.',
      };
    }
    /* If there's only one file, we also can't merge, 
     - and we can skip the more complex logic around parent folders.
     */
    if (files.length < 2) {
      return {
        canMerge: false,
        orderedSelectedFileIds,
        files,
        parentId: files[0]?.parentId ?? null,
        parentLabel:
          files[0]?.parentId === null
            ? rootLabel
            : (tree.nodes[files[0].parentId]?.name ?? rootLabel),
        reason: 'Select at least 2 files.',
      };
    }

    /* This is the key check. It collects the parentId of every selected file,
     - deduplicates them, and asks: do all selected files share exactly one parent folder?
     - If yes, we can merge and we return the common parentId and its label (or root if parentId is null).
     - If not, we can't merge and we return a reason explaining that all files must be from the same folder.
     */
    const parentKeys = dedupeOrdered(
      files.map(file => file.parentId ?? ROOT_PARENT_KEY)
    );
    const hasSingleParent = parentKeys.length === 1;
    const parentId = hasSingleParent ? (files[0]?.parentId ?? null) : null;
    const parentLabel =
      parentId === null ? rootLabel : (tree.nodes[parentId]?.name ?? rootLabel);

    return {
      canMerge: hasSingleParent,
      orderedSelectedFileIds,
      files,
      parentId,
      parentLabel,
      reason: hasSingleParent
        ? null
        : 'Select files from the same folder to merge them.',
    };
  }
);
