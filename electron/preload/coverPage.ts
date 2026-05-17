import { ipcRenderer } from 'electron';

// ─── Payload Types ────────────────────────────────────────────────────────────

type CreateCoverPagePayload = {
  name: string;
  description?: string;
  type: 'front' | 'back';
  isDefault?: boolean;
  html?: string;
  designJson?: string;
};

type UpdateCoverPagePayload = {
  name?: string;
  description?: string;
  type?: 'front' | 'back';
  isDefault?: boolean;
  html?: string;
  designJson?: string;
};

// ─── API ────────────────────────────────────────────────────────────────────

export const coverPageApi = {
  // ─── Get all cover pages ─────────────────────────────────────
  listCoverPages: () => ipcRenderer.invoke('cover-page:list'),

  // ─── Get cover page by ID ────────────────────────────────────
  getCoverPageById: (id: string) =>
    ipcRenderer.invoke('cover-page:getById', id),

  // ─── Create cover page ───────────────────────────────────────
  createCoverPage: (payload: CreateCoverPagePayload) =>
    ipcRenderer.invoke('cover-page:create', payload),

  // ─── Update cover page ───────────────────────────────────────
  updateCoverPage: (id: string, data: UpdateCoverPagePayload) =>
    ipcRenderer.invoke('cover-page:update', { id, data }),

  // ─── Delete cover page ───────────────────────────────────────
  deleteCoverPage: (id: string) => ipcRenderer.invoke('cover-page:delete', id),
};
