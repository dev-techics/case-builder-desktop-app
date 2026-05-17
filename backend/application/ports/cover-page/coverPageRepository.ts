import { StoredCoverPage } from '../../../domain/coverPage.js';

export interface CoverPageHtml {
  id: string;
  html: string;
}

export interface CoverPageRepository {
  createCoverPage: (payload: StoredCoverPage) => Promise<void>;
  listCoverPages: () => Promise<StoredCoverPage[]>;
  getCoverPageById: (id: string) => Promise<StoredCoverPage>;
  updateCoverPage(
    id: string,
    payload: Partial<Omit<StoredCoverPage, 'id' | 'createdAt'>>
  ): Promise<void>;
  deleteCoverPage: (id: string) => Promise<void>;
  getHtmlById(id: string): Promise<CoverPageHtml | null>;
}
