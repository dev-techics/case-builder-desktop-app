import { useState } from 'react';
import {
  ChevronUp,
  CreditCard,
  LogOut,
  Settings,
  UserCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useLogoutMutation } from '@/features/auth/api';
import { clearAuth, selectUser } from '@/features/auth/redux/authSlice';
import { HugeiconsIcon } from '@hugeicons/react';
import { AiMagicIcon } from '@hugeicons/core-free-icons';

const getInitials = (name?: string | null) => {
  if (!name) {
    return 'CB';
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
};

const SidebarFooterMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } finally {
      dispatch(clearAuth());
      navigate('/login', { replace: true });
    }
  };

  return (
    <SidebarMenuItem>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton className="h-auto rounded-2xl border border-[var(--sidebar-border)] bg-white px-3 py-3 hover:bg-[var(--dashboard-surface-low)] hover:text-[var(--dashboard-on-surface)] data-[state=open]:bg-[var(--dashboard-surface-low)]">
            <Avatar className="size-10 rounded-xl border border-[var(--sidebar-border)]">
              <AvatarImage src="" alt={user?.name ?? 'Case Builder user'} />
              <AvatarFallback className="rounded-xl bg-[var(--dashboard-primary-fixed)] text-[12px] font-semibold text-[var(--primary)]">
                {getInitials(user?.name)}
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
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="right"
          align="end"
          sideOffset={16}
          className="mb-4 w-64 rounded-2xl border-[var(--border)] bg-white p-2 shadow-[0_18px_40px_rgba(11,28,48,0.14)]"
        >
          <DropdownMenuLabel className="px-2 py-2">
            <div className="flex items-center gap-3">
              <Avatar className="size-10 rounded-xl border border-[var(--sidebar-border)]">
                <AvatarImage src="" alt={user?.name ?? 'Case Builder user'} />
                <AvatarFallback className="rounded-xl bg-[var(--dashboard-primary-fixed)] text-[12px] font-semibold text-[var(--primary)]">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-[var(--dashboard-on-surface)]">
                  {user?.name ?? 'Case Builder'}
                </p>
                <p className="truncate text-[12px] text-[var(--dashboard-on-surface-variant)]">
                  {user?.email ?? 'Workspace account'}
                </p>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="bg-[var(--border)]" />
          <DropdownMenuItem
            onClick={() =>
              navigate('/plans', {
                state: {
                  from: "/dashboard",
                },
              })
            }
            className="rounded-xl cursor-pointer text-[13px] text-[var(--dashboard-on-surface)] focus:bg-[var(--dashboard-surface-low)] focus:text-[var(--dashboard-on-surface)]"
          >
            <HugeiconsIcon icon={AiMagicIcon} className="size-4" />
            Upgrade Plan
          </DropdownMenuItem>
          <DropdownMenuItem className="rounded-xl text-[13px] text-[var(--dashboard-on-surface)] focus:bg-[var(--dashboard-surface-low)] focus:text-[var(--dashboard-on-surface)]">
            <UserCircle2 className="size-4" />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem className="rounded-xl text-[13px] text-[var(--dashboard-on-surface)] focus:bg-[var(--dashboard-surface-low)] focus:text-[var(--dashboard-on-surface)]">
            <CreditCard className="size-4" />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem className="rounded-xl text-[13px] text-[var(--dashboard-on-surface)] focus:bg-[var(--dashboard-surface-low)] focus:text-[var(--dashboard-on-surface)]">
            <Settings className="size-4" />
            Settings
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-[var(--border)]" />

          <DropdownMenuItem
            onClick={handleLogout}
            className="rounded-xl text-[13px] text-[var(--destructive)] focus:bg-[#ffdad6] focus:text-[var(--destructive)]"
          >
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export default SidebarFooterMenu;
