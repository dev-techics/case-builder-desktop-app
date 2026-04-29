export const bundleStatuses = [
  'In Progress',
  'Complete',
  'Review',
  'Archived',
] as const;

export type BundleStatus = (typeof bundleStatuses)[number];

export interface Bundle {
  id: string;
  name: string;
  caseNumber: string;
  documentCount: number;
  status: BundleStatus;
  createdAt: string;
  updatedAt: string;
  description?: string;
  tags?: string[];
}

export function normalizeBundleName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function normalizeCaseNumber(caseNumber: string): string {
  return caseNumber.trim().replace(/\s+/g, ' ');
}

export function isBundleStatus(value: unknown): value is BundleStatus {
  return (
    typeof value === 'string' &&
    bundleStatuses.includes(value as BundleStatus)
  );
}
