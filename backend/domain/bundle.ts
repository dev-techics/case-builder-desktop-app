export type BundleStatus = 'In Progress' | 'Complete' | 'Review' | 'Archived';

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
