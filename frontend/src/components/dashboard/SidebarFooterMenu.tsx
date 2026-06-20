import { ChevronUp } from 'lucide-react';

import UserAccountMenu from '@/components/UserAccountMenu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

const SidebarFooterMenu = () => {
  return (
    <SidebarMenuItem>
      <UserAccountMenu
        side="right"
        align="end"
        sideOffset={16}
        contentClassName="mb-4"
      >
        {({ initials, isOpen, user }) => (
          <SidebarMenuButton className="h-auto rounded-2xl border border-[var(--sidebar-border)] bg-white px-3 py-3 hover:bg-[var(--dashboard-surface-low)] hover:text-[var(--dashboard-on-surface)] data-[state=open]:bg-[var(--dashboard-surface-low)]">
            <Avatar className="size-10 rounded-xl border border-[var(--sidebar-border)]">
              <AvatarImage src="" alt={user?.name ?? 'Case Builder user'} />
              <AvatarFallback className="rounded-xl bg-[var(--dashboard-primary-fixed)] text-[12px] font-semibold text-[var(--primary)]">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate text-[13px] font-semibold text-[var(--dashboard-on-surface)]">
                {user?.name ?? 'Case Builder'}
              </span>
              <span className="truncate text-[12px] text-[var(--dashboard-on-surface-variant)]">
                {user?.email ?? 'Workspace account'}
              </span>
            </div>

            <ChevronUp
              className={`size-4 text-[var(--dashboard-on-surface-variant)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </SidebarMenuButton>
        )}
      </UserAccountMenu>
    </SidebarMenuItem>
  );
};

export default SidebarFooterMenu;
