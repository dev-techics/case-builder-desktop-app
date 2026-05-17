export interface StoredCoverPage {
  id: string;
  name: string;
  description: string;
  type: 'front' | 'back';
  isDefault: boolean;
  html: string;
  designJson: string;
  createdAt: string;
  updatedAt: string;
}
