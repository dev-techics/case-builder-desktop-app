import {
  Copy,
  Edit,
  FileText,
  FolderOpen,
  MoreVertical,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { bundleStatuses, type Bundle, type BundleStatus } from '../types';

type BundleItemProps = {
  bundle: Bundle;
  lastModifiedLabel: string;
  lastModifiedTitle?: string;
  onDelete: (bundleId: string | number) => void;
  onDuplicate: (bundle: Bundle) => void;
  onOpen: (bundle: Bundle) => void;
  onRename: (bundle: Bundle) => void;
  onStatusChange: (status: BundleStatus) => void;
  isStatusUpdating?: boolean;
};

const statusClasses: Record<BundleStatus, string> = {
  'In Progress': 'bg-[var(--dashboard-primary-fixed)] text-[var(--primary)]',
  Complete: 'bg-[#e9f9ef] text-[#1e8e4f]',
  Review: 'bg-[#fff0e8] text-[var(--dashboard-tertiary)]',
  Archived:
    'bg-[var(--dashboard-surface-low)] text-[var(--dashboard-on-surface-variant)]',
};

const handleDelete = (
  bundleId: string | number,
  onDelete: (bundleId: string | number) => void
) => {
  if (confirm('Are you sure you want to delete this bundle?')) {
    onDelete(bundleId);
  }
};

const BundleActions = ({
  bundle,
  onDelete,
  onDuplicate,
  onOpen,
  onRename,
}: Pick<
  BundleItemProps,
  'bundle' | 'onDelete' | 'onDuplicate' | 'onOpen' | 'onRename'
>) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild onClick={event => event.stopPropagation()}>
      <Button
        variant="ghost"
        size="icon"
        className="size-9 rounded-full text-[var(--dashboard-on-surface-variant)] opacity-0 transition-opacity hover:bg-[var(--dashboard-surface-low)] group-hover:opacity-100"
      >
        <MoreVertical className="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="end"
      className="rounded-2xl border-[var(--border)] bg-white p-1.5"
    >
      <DropdownMenuItem onClick={() => onOpen(bundle)} className="rounded-xl">
        <FolderOpen className="size-4" />
        Open Bundle
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onRename(bundle)} className="rounded-xl">
        <Edit className="size-4" />
        Rename
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => onDuplicate(bundle)}
        className="rounded-xl"
      >
        <Copy className="size-4" />
        Duplicate
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        variant="destructive"
        onClick={() => handleDelete(bundle.id, onDelete)}
        className="rounded-xl"
      >
        <Trash2 className="size-4" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const BundleStatusSelect = ({
  disabled,
  onChange,
  status,
}: {
  disabled?: boolean;
  onChange: (status: BundleStatus) => void;
  status: BundleStatus;
}) => (
  <Select
    disabled={disabled}
    value={status}
    onValueChange={value => onChange(value as BundleStatus)}
  >
    <SelectTrigger
      className={cn(
        'h-8 w-[132px] rounded-full border-0 px-3 text-[11px] font-semibold shadow-none focus:ring-[2px]',
        statusClasses[status]
      )}
      onClick={event => event.stopPropagation()}
    >
      <SelectValue />
    </SelectTrigger>
    <SelectContent className="rounded-2xl border-[var(--border)] bg-white">
      {bundleStatuses.map(option => (
        <SelectItem key={option} value={option} className="rounded-xl">
          {option}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export const BundleGridCard = (props: BundleItemProps) => {
  const { bundle, lastModifiedLabel, lastModifiedTitle } = props;

  return (
    <article
      onClick={() => props.onOpen(bundle)}
      className="group cursor-pointer rounded-[24px] border border-[var(--border)] bg-[var(--dashboard-surface-lowest)] p-5 shadow-[0_8px_24px_rgba(11,28,48,0.05)] transition-all hover:border-[var(--dashboard-primary-fixed-dim)] hover:bg-[var(--dashboard-surface-low)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--dashboard-primary-fixed)] text-[var(--primary)]">
            <FolderOpen className="size-5" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold tracking-[-0.02em] text-[var(--dashboard-on-surface)]">
              {bundle.name}
            </h3>
            <p className="mt-1 truncate text-[12px] font-medium text-[var(--dashboard-on-surface-variant)]">
              Case {bundle.caseNumber}
            </p>
          </div>
        </div>
        <BundleActions {...props} />
      </div>

      <div className="mt-7 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-[13px] font-medium text-[var(--dashboard-on-surface-variant)]">
          <FileText className="size-4 text-[var(--dashboard-secondary)]" />
          {bundle.totalDocuments} document
          {bundle.totalDocuments === 1 ? '' : 's'}
        </div>
        <BundleStatusSelect
          disabled={props.isStatusUpdating}
          onChange={props.onStatusChange}
          status={bundle.status}
        />
      </div>

      <p
        className="mt-5 text-[12px] text-[var(--dashboard-on-surface-variant)]"
        title={lastModifiedTitle}
      >
        Last modified {lastModifiedLabel}
      </p>
    </article>
  );
};

export const BundleTableRow = (props: BundleItemProps) => {
  const { bundle, lastModifiedLabel, lastModifiedTitle } = props;

  return (
    <tr
      onClick={() => props.onOpen(bundle)}
      className="group cursor-pointer border-b border-[var(--border)] transition-colors last:border-0 hover:bg-[var(--dashboard-surface-low)]"
    >
      <td className="px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--dashboard-primary-fixed)] text-[var(--primary)]">
            <FolderOpen className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-[var(--dashboard-on-surface)]">
              {bundle.name}
            </p>
            <p className="truncate text-[12px] text-[var(--dashboard-on-surface-variant)]">
              Case {bundle.caseNumber}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 text-[13px] text-[var(--dashboard-on-surface-variant)]">
        {bundle.totalDocuments} document
        {bundle.totalDocuments === 1 ? '' : 's'}
      </td>
      <td className="px-5 py-4">
        <BundleStatusSelect
          disabled={props.isStatusUpdating}
          onChange={props.onStatusChange}
          status={bundle.status}
        />
      </td>
      <td
        className="px-5 py-4 text-[13px] text-[var(--dashboard-on-surface-variant)]"
        title={lastModifiedTitle}
      >
        {lastModifiedLabel}
      </td>
      <td className="px-5 py-4 text-right">
        <BundleActions {...props} />
      </td>
    </tr>
  );
};
