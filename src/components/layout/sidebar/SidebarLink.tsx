"use client";

import Icon from "@/components/ui/Icon";
import { SidebarLinkItem } from "@/components/layout/sidebar/sidebarTypes";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarLink({
  label,
  href,
  icon,
  active,
}: SidebarLinkItem) {
  const pathname = usePathname();
  const isActive = active ?? pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
        isActive
          ? "bg-accent text-white shadow-lg shadow-accent/20"
          : "text-foreground hover:bg-surface-strong hover:text-foreground"
      }`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-2xl bg-surface text-foreground">
        <Icon name={icon} size={18} color="currentColor" />
      </span>
      <span className="text-left">{label}</span>
    </Link>
  );
}
