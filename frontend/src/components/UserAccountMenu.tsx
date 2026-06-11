import { useState } from 'react';
import type { ReactElement } from 'react';
import {
  CreditCard,
  LogOut,
  Settings,
  UserCircle2,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { AiMagicIcon } from '@hugeicons/core-free-icons';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogoutMutation } from '@/features/auth/api';
import { clearAuth, selectUser } from '@/features/auth/redux/authSlice';
import type { User } from '@/features/auth/types/types';

export const getUserInitials = (name?: string | null) => {
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

type AccountMenuTriggerProps = {
  initials: string;
  isOpen: boolean;
  user: User | null;
};

type UserAccountMenuProps = {
  children: (props: AccountMenuTriggerProps) => ReactElement;
  contentClassName?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
};

const menuItemClass =
  'rounded-xl text-[13px] text-[var(--dashboard-on-surface)] focus:bg-[var(--dashboard-surface-low)] focus:text-[var(--dashboard-on-surface)]';

const UserAccountMenu = ({
  children,
  contentClassName = '',
  side = 'bottom',
  align = 'end',
  sideOffset = 8,
}: UserAccountMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [logout] = useLogoutMutation();
  const initials = getUserInitials(user?.name);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } finally {
      dispatch(clearAuth());
      navigate('/login', { replace: true });
    }
  };

  const handleUpgradePlan = () => {
    navigate('/plans', {
      state: {
        from: location.pathname,
      },
    });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {children({ initials, isOpen, user })}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        className={`w-64 rounded-2xl border-[var(--border)] bg-white p-2 shadow-[0_18px_40px_rgba(11,28,48,0.14)] ${contentClassName}`}
      >
        <DropdownMenuLabel className="px-2 py-2">
          <div className="flex items-center gap-3">
            <Avatar className="size-10 rounded-xl border border-[var(--sidebar-border)]">
              <AvatarImage src="" alt={user?.name ?? 'Case Builder user'} />
              <AvatarFallback className="rounded-xl bg-[var(--dashboard-primary-fixed)] text-[12px] font-semibold text-[var(--primary)]">
                {initials}
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
          onClick={handleUpgradePlan}
          className={`${menuItemClass} cursor-pointer`}
        >
          <HugeiconsIcon icon={AiMagicIcon} className="size-4" />
          Upgrade Plan
        </DropdownMenuItem>
        <DropdownMenuItem className={menuItemClass}>
          <UserCircle2 className="size-4" />
          Account
        </DropdownMenuItem>
        <DropdownMenuItem className={menuItemClass}>
          <CreditCard className="size-4" />
          Billing
        </DropdownMenuItem>
        <DropdownMenuItem className={menuItemClass}>
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
  );
};

export default UserAccountMenu;
