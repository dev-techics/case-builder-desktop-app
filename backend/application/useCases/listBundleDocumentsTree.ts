import { ValidationError } from '../../domain/errors.js';
import type { DocumentType } from '../../domain/document.js';
import type { DocumentRepository } from '../ports/documentRepository.js';

export interface DocumentTreeNode {
  id: string;
  name: string;
  type: DocumentType;
  parentId: string | null;
  url?: string;
}

export interface BundleDocumentsTree {
  id: string;
  name: string;
  projectName?: string;
  type: 'folder';
  nodes: Record<string, DocumentTreeNode>;
  children: Record<string, string[]>;
  rootIds: string[];
}

const buildTreeId = (bundleId: string) => `bundle-${bundleId}`;

export class ListBundleDocumentsTreeUseCase {
  constructor(private readonly documentRepository: DocumentRepository) {}

  async execute(bundleIdInput: string): Promise<BundleDocumentsTree> {
    const bundleId = bundleIdInput?.trim();
    if (!bundleId) {
      throw new ValidationError('Bundle id is required.');
    }

    const [bundleName, documents] = await Promise.all([
      this.documentRepository.getBundleName(bundleId),
      this.documentRepository.listByBundle(bundleId),
    ]);

    const treeId = buildTreeId(bundleId);
    const tree: BundleDocumentsTree = {
      id: treeId,
      name: 'Bundle',
      projectName: bundleName ?? 'Bundle',
      type: 'folder',
      nodes: {},
      children: {},
      rootIds: [],
    };

    for (const document of documents) {
      tree.nodes[document.id] = {
        id: document.id,
        name: document.name,
        type: document.type,
        parentId: document.parentId,
      };
    }

    for (const document of documents) {
      const node = tree.nodes[document.id];
      if (!node) {
        continue;
      }

      const parentId =
        document.parentId && tree.nodes[document.parentId]
          ? document.parentId
          : null;

      node.parentId = parentId;

      if (parentId === null) {
        tree.rootIds.push(document.id);
        continue;
      }

      if (!tree.children[parentId]) {
        tree.children[parentId] = [];
      }
      tree.children[parentId].push(document.id);
    }

    return tree;
  }
}
