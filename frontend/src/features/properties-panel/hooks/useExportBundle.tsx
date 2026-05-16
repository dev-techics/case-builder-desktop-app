import { useEffect, useRef, useState } from 'react';

import type { ExportCompressionProfile } from '../api';

type UseExportBundleProps = {
  hasFiles: boolean;
  bundleId: string;
  projectName?: string | null;
  pdfFileCount: number;
  frontCoverAvailable: boolean;
  backCoverAvailable: boolean;
};

type ExportStatus = 'idle' | 'exporting' | 'success' | 'error';

const SUCCESS_RESET_DELAY_MS = 3000;

const getDesktopApi = () =>
  typeof window === 'undefined' ? undefined : window.api;

const getExportErrorMessage = (error: unknown): string => {
  const fallback = 'Failed to export bundle';

  if (!error) {
    return fallback;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object') {
    const fetchError = error as {
      status?: number | string;
      data?: unknown;
      message?: string;
    };

    if (fetchError.status === 403) {
      return 'You do not have permission to export this bundle';
    }

    if (fetchError.status === 404) {
      return 'Bundle not found';
    }

    if (typeof fetchError.data === 'string') {
      return fetchError.data;
    }

    if (fetchError.data && typeof fetchError.data === 'object') {
      const response = fetchError.data as {
        message?: unknown;
        error?: unknown;
      };

      if (typeof response.message === 'string') {
        return response.message;
      }

      if (typeof response.error === 'string') {
        return response.error;
      }
    }

    if (typeof fetchError.message === 'string') {
      return fetchError.message;
    }
  }

  return fallback;
};

const useExportBundle = ({
  hasFiles,
  bundleId,
  projectName,
  pdfFileCount,
  frontCoverAvailable,
  backCoverAvailable,
}: UseExportBundleProps) => {
  const [includeIndex, setIncludeIndex] = useState(true);
  const [includeFrontCover, setIncludeFrontCover] =
    useState(frontCoverAvailable);
  const [includeBackCover, setIncludeBackCover] = useState(backCoverAvailable);
  const [compressionProfile, setCompressionProfile] =
    useState<ExportCompressionProfile>('tiny');
  const [targetSizeMb, setTargetSizeMb] = useState('10');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const [exportMessage, setExportMessage] = useState('');
  const resetTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(
    null
  );

  useEffect(
    () => () => {
      if (resetTimerRef.current !== null) {
        globalThis.clearTimeout(resetTimerRef.current);
      }
    },
    []
  );

  const handleExport = async () => {
    const desktopApi = getDesktopApi();

    if (resetTimerRef.current !== null) {
      globalThis.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    if (!desktopApi?.exportBundle) {
      setExportStatus('error');
      setExportMessage('Desktop export API unavailable');
      return;
    }

    if (!hasFiles || !bundleId) {
      setExportStatus('error');
      setExportMessage(
        !hasFiles ? 'No PDF files to export' : 'Bundle ID not found'
      );
      return;
    }

    setIsExporting(true);
    setExportStatus('exporting');
    setExportMessage('Preparing export...');

    try {
      const exportResponse = await desktopApi.exportBundle({
        bundleId,
        includeFrontCover: includeFrontCover && frontCoverAvailable,
        includeBackCover: includeBackCover && backCoverAvailable,
        includeIndex,
        compress: compressionProfile !== 'none',
        fileName: buildExportFileName(projectName),
      });

      if (exportResponse?.canceled) {
        setExportStatus('idle');
        setExportMessage('');
        return;
      }

      const successParts: string[] = [];
      if (includeFrontCover && frontCoverAvailable) {
        successParts.push('front cover');
      }
      if (includeBackCover && backCoverAvailable) {
        successParts.push('back cover');
      }
      if (includeIndex) {
        successParts.push('index');
      }
      successParts.push(`${pdfFileCount} files`);

      const successAddons =
        successParts.length > 1
          ? ` (including ${successParts.slice(0, -1).join(', ')})`
          : '';
      const savedLocation =
        exportResponse?.outputPath ? ` to ${exportResponse.outputPath}` : '';

      setExportStatus('success');
      setExportMessage(`Successfully exported${successAddons}${savedLocation}`);

      resetTimerRef.current = globalThis.setTimeout(() => {
        setExportStatus('idle');
        setExportMessage('');
        resetTimerRef.current = null;
      }, SUCCESS_RESET_DELAY_MS);
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
      setExportMessage(getExportErrorMessage(error));
    } finally {
      setIsExporting(false);
    }
  };

  return {
    compressionProfile,
    exportMessage,
    exportStatus,
    handleExport,
    includeBackCover,
    includeFrontCover,
    includeIndex,
    isExporting,
    setCompressionProfile,
    setIncludeBackCover,
    setIncludeFrontCover,
    setIncludeIndex,
    setTargetSizeMb,
    targetSizeMb,
  };
};

export default useExportBundle;

function buildExportFileName(projectName?: string | null): string {
  const baseName = projectName?.trim() || 'Bundle';
  return /\.pdf$/i.test(baseName) ? baseName : `${baseName}.pdf`;
}
