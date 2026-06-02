import { Bell, BriefcaseBusiness, LifeBuoy, Search } from 'lucide-react';
// import { useNavigate, useLocation } from 'react-router-dom';

import { useAppSelector } from '@/app/hooks';
import { selectUser } from '@/features/auth/redux/authSlice';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';

// const createBundleEvent = 'dashboard:create-bundle';

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

const DashboardHeader = () => {
  const user = useAppSelector(selectUser);
  // const navigate = useNavigate();
  // const location = useLocation();

  // const handleCreateBundle = () => {
  //   if (location.pathname !== '/dashboard') {
  //     navigate('/dashboard?createBundle=1');
  //     return;
  //   }

  //   window.dispatchEvent(new Event(createBundleEvent));
  // };

  return (
    <header className="relative z-20 h-[72px] border-b border-[var(--sidebar-border)] bg-[color:rgba(255,255,255,0.92)] backdrop-blur">
      <div className="flex h-full">
        <div className="hidden w-[260px] shrink-0 items-center border-r border-[var(--sidebar-border)] px-5 md:flex">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--dashboard-primary-container)] text-white shadow-[0_10px_24px_rgba(53,37,205,0.2)]">
              <BriefcaseBusiness className="size-4" />
            </div>
            <div>
              <p className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--dashboard-on-surface)]">
                Case Builder
              </p>
              <p className="text-[12px] text-[var(--dashboard-on-surface-variant)]">
                Legal Workspace
              </p>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3 px-4 sm:px-6">
          <SidebarTrigger className="border border-[var(--border)] bg-white text-[var(--dashboard-on-surface-variant)] hover:bg-[var(--dashboard-surface-low)] hover:text-[var(--dashboard-on-surface)]" />

          <div className="flex min-w-0 items-center gap-3 md:hidden">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[var(--dashboard-primary-container)] text-white">
              <BriefcaseBusiness className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold tracking-[-0.02em] text-[var(--dashboard-on-surface)]">
                Case Builder
              </p>
              <p className="truncate text-[12px] text-[var(--dashboard-on-surface-variant)]">
                Legal Workspace
              </p>
            </div>
          </div>

          <div className="relative hidden min-w-0 flex-1 md:block">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--dashboard-on-surface-variant)]" />
            <Input
              placeholder="Search bundles, documents, or cases..."
              className="h-11 rounded-full border-[var(--sidebar-border)] bg-[var(--dashboard-surface-low)] pl-11 pr-4 text-[13px] text-[var(--dashboard-on-surface)] placeholder:text-[var(--dashboard-on-surface-variant)] focus-visible:border-[var(--dashboard-primary-container)] focus-visible:ring-[3px] focus-visible:ring-[color:rgba(79,70,229,0.16)]"
            />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              className="hidden h-10 rounded-full px-3 text-[13px] font-medium text-[var(--dashboard-on-surface-variant)] hover:bg-[var(--dashboard-surface-low)] hover:text-[var(--dashboard-on-surface)] sm:inline-flex"
            >
              <LifeBuoy className="size-4" />
              Support
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative size-10 rounded-full border border-transparent text-[var(--dashboard-on-surface-variant)] hover:bg-[var(--dashboard-surface-low)] hover:text-[var(--dashboard-on-surface)]"
            >
              <Bell className="size-4" />
              <span className="absolute right-3 top-3 size-2 rounded-full bg-[var(--dashboard-primary-container)]" />
            </Button>

            {/* <Button
              onClick={handleCreateBundle}
              className="hidden h-10 rounded-full bg-[var(--dashboard-primary-container)] px-5 text-[13px] font-semibold text-white shadow-[0_14px_30px_rgba(53,37,205,0.22)] hover:bg-[var(--primary)] sm:inline-flex"
            >
              Create New Bundle
            </Button> */}

            <Avatar className="size-10 border border-[var(--sidebar-border)] bg-white">
              <AvatarImage src="" alt={user?.name ?? 'Case Builder user'} />
              <AvatarFallback className="bg-[var(--dashboard-primary-fixed)] text-[12px] font-semibold text-[var(--primary)]">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
