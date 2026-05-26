import { FolderOpen, LayoutDashboard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import {
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    url: '/dashboard',
    matches: (pathname: string) => pathname === '/dashboard',
  },
  {
    name: 'Bundles',
    icon: FolderOpen,
    url: '/dashboard/bundles',
    matches: (pathname: string) => pathname.startsWith('/dashboard/bundles'),
  },
];

const DashboardSidebarMenu = () => {
  const location = useLocation();

  return (
    <SidebarGroupContent>
      <SidebarMenu className="mt-2 gap-1.5">
        {menuItems.map(item => {
          const isActive = item.matches(location.pathname);
          const Icon = item.icon;

          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                className={cn(
                  'group h-10 rounded-xl border border-transparent px-3 text-[13px] font-medium text-[var(--dashboard-on-surface-variant)] hover:border-[var(--sidebar-border)] hover:bg-white hover:text-[var(--dashboard-on-surface)]',
                  isActive &&
                    'border-[var(--dashboard-surface-highest)] bg-white text-[var(--primary)] shadow-[inset_3px_0_0_var(--dashboard-primary-container)]'
                )}
              >
                <Link to={item.url}>
                  <Icon className="size-[18px]" />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroupContent>
  );
};

export default DashboardSidebarMenu;
