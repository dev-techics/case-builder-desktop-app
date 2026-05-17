import { ipcMain } from 'electron';
import type { CoverPageRepository } from '../../backend/application/ports/cover-page/coverPageRepository.js';
import { CreateCoverPageUseCase } from '../../backend/application/useCases/cover-page/createCoverPage.js';
import { UpdateCoverPageUseCase } from '../../backend/application/useCases/cover-page/updateCoverPage.js';
import { DeleteCoverPageUseCase } from '../../backend/application/useCases/cover-page/deleteCoverPage.js';
import {
  ListCoverPagesUseCase,
  GetCoverPageByIdUseCase,
} from '../../backend/application/useCases/cover-page/getCoverPages.js';
import type { StoredCoverPage } from '../../backend/domain/coverPage.js';

// ─── Payload Types ────────────────────────────────────────────────────────────

type CoverPageIdPayload = {
  id?: string | number;
};

type CreateCoverPagePayload = {
  name?: string;
  description?: string;
  type?: string;
  isDefault?: boolean;
  html?: string;
  designJson?: string;
};

type UpdateCoverPagePayload = {
  id?: string | number;
  data?: {
    name?: string;
    description?: string;
    type?: string;
    isDefault?: boolean;
    html?: string;
    designJson?: string;
  };
};

// ─── Response Mapper ──────────────────────────────────────────────────────────

const mapCoverPage = (coverPage: StoredCoverPage) => ({
  id: coverPage.id,
  name: coverPage.name,
  description: coverPage.description,
  type: coverPage.type,
  isDefault: coverPage.isDefault,
  html: coverPage.html,
  designJson: coverPage.designJson,
  createdAt: coverPage.createdAt,
  updatedAt: coverPage.updatedAt,
});

// ─── IPC Registration ─────────────────────────────────────────────────────────

export function registerCoverPageIpc(deps: {
  coverPageRepository: CoverPageRepository;
}) {
  const listCoverPages = new ListCoverPagesUseCase(deps.coverPageRepository);
  const getCoverPageById = new GetCoverPageByIdUseCase(
    deps.coverPageRepository
  );
  const createCoverPage = new CreateCoverPageUseCase(deps.coverPageRepository);
  const updateCoverPage = new UpdateCoverPageUseCase(deps.coverPageRepository);
  const deleteCoverPage = new DeleteCoverPageUseCase(deps.coverPageRepository);

  ipcMain.handle('cover-page:list', async () => {
    const coverPages = await listCoverPages.execute();
    return coverPages.map(mapCoverPage);
  });

  ipcMain.handle(
    'cover-page:getById',
    async (_, payload: string | number | CoverPageIdPayload) => {
      const id =
        typeof payload === 'object' && payload !== null
          ? String(payload.id ?? '')
          : String(payload ?? '');

      const coverPage = await getCoverPageById.execute(id);
      return mapCoverPage(coverPage);
    }
  );

  ipcMain.handle(
    'cover-page:create',
    async (_, payload: CreateCoverPagePayload) => {
      const coverPage = await createCoverPage.execute({
        name: typeof payload?.name === 'string' ? payload.name : '',
        description:
          typeof payload?.description === 'string' ? payload.description : '',
        type: payload?.type === 'back' ? 'back' : 'front',
        isDefault: payload?.isDefault === true,
        html: typeof payload?.html === 'string' ? payload.html : '',
        designJson:
          typeof payload?.designJson === 'string' ? payload.designJson : '',
      });

      return mapCoverPage(coverPage);
    }
  );

  ipcMain.handle(
    'cover-page:update',
    async (_, payload: UpdateCoverPagePayload) => {
      const id = String(payload?.id ?? '');
      const data = payload?.data ?? {};

      await updateCoverPage.execute(id, {
        ...(data.name !== undefined && { name: String(data.name) }),
        ...(data.description !== undefined && {
          description: String(data.description),
        }),
        ...(data.type !== undefined && {
          type: data.type === 'back' ? 'back' : 'front',
        }),
        ...(data.isDefault !== undefined && {
          isDefault: data.isDefault === true,
        }),
        ...(data.html !== undefined && { html: String(data.html) }),
        ...(data.designJson !== undefined && {
          designJson: String(data.designJson),
        }),
      });
    }
  );

  ipcMain.handle(
    'cover-page:delete',
    async (_, payload: string | number | CoverPageIdPayload) => {
      const id =
        typeof payload === 'object' && payload !== null
          ? String(payload.id ?? '')
          : String(payload ?? '');

      await deleteCoverPage.execute(id);
      return { id };
    }
  );
}
