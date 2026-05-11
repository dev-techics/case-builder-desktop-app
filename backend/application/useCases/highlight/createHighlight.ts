import { v4 as uuidv4 } from 'uuid';
import type { DocumentRepository } from '../../ports/documents/documentRepository.js';
import type { HighlightRepository } from '../../ports/highlights/highlightRepository.js';
import {
  normalizeHighlightColorName,
  normalizeHighlightText,
  type HighlightColorRgb,
  type StoredHighlight,
} from '../../../domain/highlight.js';
import { ValidationError } from '../../../domain/errors.js';

type CreateHighlightInput = {
  bundleId: string;
  documentId: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  colorName: string;
  colorHex: string;
  colorRgb: HighlightColorRgb;
  opacity: number;
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isValidColorHex = (value: string) => /^#[0-9A-Fa-f]{6}$/.test(value);

const isValidColorChannel = (value: unknown) =>
  isFiniteNumber(value) && value >= 0 && value <= 255;

export class CreateHighlightUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly highlightRepository: HighlightRepository
  ) {}

  async execute(input: CreateHighlightInput): Promise<StoredHighlight> {
    const bundleId = input.bundleId?.trim();
    const documentId = input.documentId?.trim();
    const text = normalizeHighlightText(input.text ?? '');
    const colorName = normalizeHighlightColorName(input.colorName ?? '');
    const colorHex = input.colorHex?.trim();

    if (!bundleId) {
      throw new ValidationError('Bundle id is required.');
    }

    const bundleName = await this.documentRepository.getBundleName(bundleId);
    if (!bundleName) {
      throw new ValidationError('Bundle not found.');
    }

    if (!documentId) {
      throw new ValidationError('Document id is required.');
    }

    const document = await this.documentRepository.getById(documentId);
    if (!document || document.bundleId !== bundleId) {
      throw new ValidationError('Document not found.');
    }

    if (document.type !== 'file') {
      throw new ValidationError('Highlights can only be created for files.');
    }

    if (!Number.isInteger(input.pageNumber) || input.pageNumber <= 0) {
      throw new ValidationError('Page number must be a positive integer.');
    }

    if (!isFiniteNumber(input.x) || !isFiniteNumber(input.y)) {
      throw new ValidationError('Highlight coordinates must be valid numbers.');
    }

    if (!isFiniteNumber(input.width) || input.width <= 0) {
      throw new ValidationError('Highlight width must be greater than zero.');
    }

    if (!isFiniteNumber(input.height) || input.height <= 0) {
      throw new ValidationError('Highlight height must be greater than zero.');
    }

    if (!text) {
      throw new ValidationError('Highlight text is required.');
    }

    if (!colorName) {
      throw new ValidationError('Highlight color name is required.');
    }

    if (!colorHex || !isValidColorHex(colorHex)) {
      throw new ValidationError('Highlight color hex is invalid.');
    }

    if (
      !isValidColorChannel(input.colorRgb?.r) ||
      !isValidColorChannel(input.colorRgb?.g) ||
      !isValidColorChannel(input.colorRgb?.b)
    ) {
      throw new ValidationError('Highlight color RGB is invalid.');
    }

    if (!isFiniteNumber(input.opacity) || input.opacity < 0 || input.opacity > 1) {
      throw new ValidationError('Highlight opacity must be between 0 and 1.');
    }

    const now = new Date().toISOString();
    const highlight: StoredHighlight = {
      id: uuidv4(),
      bundleId,
      documentId,
      pageNumber: input.pageNumber,
      x: input.x,
      y: input.y,
      width: input.width,
      height: input.height,
      text,
      colorName,
      colorHex,
      colorRgb: input.colorRgb,
      opacity: input.opacity,
      createdAt: now,
      updatedAt: now,
    };

    await this.highlightRepository.create(highlight);
    return highlight;
  }
}
