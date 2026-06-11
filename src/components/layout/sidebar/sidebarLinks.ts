import { SidebarLinkItem } from "@/components/layout/sidebar/sidebarTypes";
import { ROUTES } from "@/routes";

export const sidebarLinks: SidebarLinkItem[] = [
  { label: "Dashboard", href: ROUTES.dashboard, icon: "ri:dashboard-line" },
  {
    label: "Live Chat",
    href: ROUTES.liveChat,
    icon: "bi:message-rounded-dots",
  },
  { label: "Contacts", href: ROUTES.contacts, icon: "md:contacts" },
  {
    label: "Knowledge Base",
    href: ROUTES.knowledgeBase,
    icon: "ri:database-2-line",
  },
  {
    label: "Bot Settings",
    href: ROUTES.botSettings,
    icon: "ri:settings-3-line",
  },
  {
    label: "WhatsApp Bot",
    href: ROUTES.whatsappBot,
    icon: "bi:message-rounded-dots",
  },
  {
    label: "Handoff Rules",
    href: ROUTES.handoffRules,
    icon: "ri:flow-chart",
  },
  {
    label: "Support Tickets",
    href: ROUTES.supportTickets,
    icon: "bi:message-rounded-dots",
  },
  { label: "Campaigns", href: ROUTES.campaigns, icon: "md:campaign" },
  {
    label: "Analytics",
    href: ROUTES.whatsappAnalytics,
    icon: "fi:bar-chart-2",
  },
  {
    label: "Ecommerce",
    href: ROUTES.ecommerce,
    icon: "ri:database-2-line",
  },
  {
    label: "Onboarding",
    href: ROUTES.onboarding,
    icon: "ri:flow-chart",
  },
  {
    label: "Template Library",
    href: ROUTES.templateLibrary,
    icon: "ri:layout-grid-line",
  },
  {
    label: "Template Message",
    href: ROUTES.templateMessage,
    icon: "bi:message-rounded-dots",
  },
  {
    label: "Shopify Integration",
    href: ROUTES.shopifyIntegration,
    icon: "si:shopify",
  },
 
];
