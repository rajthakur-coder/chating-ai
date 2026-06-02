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
  {
    label: "Automation Settings",
    href: ROUTES.automationSettings,
    icon: "ri:settings-3-line",
  },
  {
    label: "Bot Logs",
    href: ROUTES.botLogs,
    icon: "bi:refresh",
  },
  {
    label: "Analytics",
    href: ROUTES.whatsappAnalytics,
    icon: "fi:bar-chart-2",
  },
  {
    label: "AI Agent APIs",
    href: ROUTES.aiAgentApis,
    icon: "ri:terminal-box-line",
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
    label: "Compliance",
    href: ROUTES.compliance,
    icon: "ri:settings-3-line",
  },
  {
    label: "Agency",
    href: ROUTES.agency,
    icon: "md:contacts",
  },
  {
    label: "Template Message",
    href: ROUTES.templateMessage,
    icon: "bi:message-rounded-dots",
  },
  { label: "Campaigns", href: ROUTES.campaigns, icon: "md:campaign" },
  { label: "Flows", href: ROUTES.flows, icon: "ri:flow-chart" },
  {
    label: "Shopify Integration",
    href: ROUTES.shopifyIntegration,
    icon: "si:shopify",
  },
  {
    label: "WooCommerce",
    href: ROUTES.woocommerceIntegration,
    icon: "si:woocommerce",
  },
];
