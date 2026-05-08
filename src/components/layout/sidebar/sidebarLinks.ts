import { SidebarLinkItem } from "@/components/layout/sidebar/sidebarTypes";
import { ROUTES } from "@/routes";

export const sidebarLinks: SidebarLinkItem[] = [
  { label: "Dashboard", href: ROUTES.dashboard, icon: "ri:dashboard-line" },
  {
    label: "Live Chat",
    href: ROUTES.comingSoon,
    icon: "bi:message-rounded-dots",
  },
  { label: "Contacts", href: ROUTES.contacts, icon: "md:contacts" },
  { label: "Campaigns", href: ROUTES.campaigns, icon: "md:campaign" },
  { label: "Flows", href: ROUTES.flows, icon: "ri:flow-chart" },
];
