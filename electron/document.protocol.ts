import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { net, protocol } from 'electron';
import type { DocumentRepository } from '../backend/application/ports/documentRepository.js';
import { DOCUMENT_PROTOCOL } from './utils/index.js';

protocol.registerSchemesAsPrivileged([
  {
    scheme: DOCUMENT_PROTOCOL,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

export function registerDocumentProtocol(deps: {
  documentRepository: DocumentRepository;
  documentsStorageRoot: string;
}) {
  protocol.handle(DOCUMENT_PROTOCOL, async request => {
    const requestUrl = new URL(request.url);
    const documentId = decodeURIComponent(requestUrl.pathname.replace(/^\//, ''));

    if (!documentId) {
      return new Response('Document id is required.', { status: 400 });
    }

    const document = await deps.documentRepository.getById(documentId);
    if (!document?.storagePath) {
      return new Response('Document not found.', { status: 404 });
    }

    const absolutePath = path.join(
      deps.documentsStorageRoot,
      document.storagePath
    );

    try {
      await fs.access(absolutePath);
    } catch {
      return new Response('Document file not found.', { status: 404 });
    }

    return net.fetch(pathToFileURL(absolutePath).toString());
  });
}
