// frontend/src/types/desktop/cover-page.types.ts

export type DesktopCoverPageRecord = {
  id: string;
  name: string;
  description: string;
  type: 'front' | 'back';
  isDefault: boolean;
  html: string;
  designJson: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateCoverPageRequest = {
  name: string;
  description?: string;
  type: 'front' | 'back';
  isDefault?: boolean;
  html?: string;
  designJson?: string;
};

export type UpdateCoverPageRequest = {
  name?: string;
  description?: string;
  type?: 'front' | 'back';
  isDefault?: boolean;
  html?: string;
  designJson?: string;
};