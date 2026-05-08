import SidebarLink from "@/components/layout/sidebar/SidebarLink";
import { sidebarLinks } from "@/components/layout/sidebar/sidebarLinks";

export default function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-default bg-surface/95 px-3 py-3 md:flex md:flex-col">
      <div className="mb-5 rounded-xl border border-default bg-surface-strong px-4 py-2 shadow-default">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-3xl bg-accent text-md font-bold text-white shadow-lg shadow-accent/20">
            A
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Alignchat</p>
            <p className="text-xs text-muted">Connect </p>
          </div>
        </div>
      </div>

      <nav className="space-y-3">
        {sidebarLinks.map((link) => (
          <SidebarLink key={link.label} {...link} />
        ))}
      </nav>
    </aside>
  );
}
