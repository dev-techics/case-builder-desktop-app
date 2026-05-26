import type { CSSProperties } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import 'react-toastify/dist/ReactToastify.css';
import { Outlet } from 'react-router';
import { ToastContainer } from 'react-toastify';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/Header';

const DashboardLayout = () => {
  return (
    <SidebarProvider
      className="case-dashboard-theme"
      defaultOpen={true}
      style={
        {
          '--sidebar-width': '260px',
        } as CSSProperties
      }
    >
      <div className="case-dashboard-theme relative flex h-screen w-screen overflow-hidden bg-[var(--dashboard-surface)] text-[var(--dashboard-on-surface)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.08),_transparent_34%),linear-gradient(180deg,_var(--dashboard-surface)_0%,_#edf4ff_100%)]" />

        <div className="relative flex min-h-0 w-full flex-col">
          <DashboardHeader />

          <div className="flex min-h-0 flex-1">
            <DashboardSidebar />

            <main className="flex-1 overflow-auto">
              <div className="mx-auto w-full max-w-[1200px] px-4 pb-8 pt-6 sm:px-6 lg:px-8">
                <Outlet />
              </div>
            </main>
          </div>
        </div>

        <ToastContainer
          position="bottom-right"
          hideProgressBar={true}
          className="text-sm"
          draggable
        />
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
