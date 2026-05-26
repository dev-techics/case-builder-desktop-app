import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import SidebarFooterMenu from './SidebarFooterMenu';
import DashboardSidebarMenu from './SidebarMenu';

const DashboardSidebar = () => {
  return (
    <Sidebar
      collapsible="offcanvas"
      className="top-[72px] h-[calc(100vh-72px)] border-r border-[var(--sidebar-border)]"
    >
      <SidebarContent className="bg-[var(--sidebar)]">
        <SidebarGroup className="px-3 py-4">
          <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-on-surface-variant)]">
            Workspace
          </SidebarGroupLabel>
          <DashboardSidebarMenu />
        </SidebarGroup>

        <SidebarGroup className="mt-auto px-3 pb-4">
          <div className="rounded-3xl border border-[var(--sidebar-border)] bg-white p-4 shadow-[0_8px_20px_rgba(11,28,48,0.05)]">
            <p className="text-[13px] font-semibold text-[var(--dashboard-on-surface)]">
              Stay export-ready
            </p>
            <p className="mt-2 text-[13px] leading-5 text-[var(--dashboard-on-surface-variant)]">
              Keep bundle structure clean so case files are easier to review and
              assemble.
            </p>
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-[var(--sidebar-border)] bg-[var(--sidebar)] px-3 py-4">
        <SidebarFooterMenu />
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
