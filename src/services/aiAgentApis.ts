import api from "@/lib/api";

export type ApiHealth = {
  status?: string;
  app?: string;
  version?: string;
  [key: string]: unknown;
};

export type RuntimeConfig = {
  shopify_webhook_automation_enabled?: boolean;
  automation_processor_enabled?: boolean;
  [key: string]: unknown;
};

export type ReadinessCheck = {
  ok?: boolean;
  warnings?: string[];
  missing?: string[];
  error?: string;
  reason?: string;
  [key: string]: unknown;
};

export type ReadinessStatus = {
  status?: "ready" | "not_ready" | string;
  tenant_id?: string;
  checked_at?: string;
  checks?: Record<string, ReadinessCheck>;
};

export type WebhookEvent = {
  id: number;
  provider?: string | null;
  external_id?: string | null;
  tenant_id?: string | null;
  phone?: string | null;
  message_text?: string | null;
  status?: string | null;
  attempts?: number | null;
  error?: string | null;
  last_error?: string | null;
  created_at?: string | null;
  processed_at?: string | null;
  dead_lettered_at?: string | null;
};

export type EcommerceConnection = {
  id: number;
  name?: string | null;
  platform?: string | null;
  store_name?: string | null;
  store_url?: string | null;
  status?: string | null;
  webhook_status?: string | null;
  bot_enabled?: boolean;
};

export type WhatsappBusinessIntegration = {
  connected?: boolean;
  status?: string;
  phone_number_id?: string | null;
  waba_id?: string | null;
  business_id?: string | null;
  [key: string]: unknown;
};

export type HeadlessProviders = {
  providers?: unknown[];
  [key: string]: unknown;
};

export type OmsAdapters = {
  platforms?: string[];
  [key: string]: unknown;
};

export type CustomTool = {
  id?: number | string;
  name?: string;
  description?: string | null;
  endpoint?: string | null;
  method?: string | null;
  enabled?: boolean;
  [key: string]: unknown;
};

export type HeadlessOnboarding = {
  connect_whatsapp?: boolean;
  connect_oms?: boolean;
  import_catalog?: boolean;
  brand_voice?: boolean;
  policies?: boolean;
  discounts?: boolean;
  bundle_pairs?: boolean;
  templates?: boolean;
  go_live?: boolean;
  [key: string]: unknown;
};

export type TenantConfigResponse = {
  status?: string;
  data?: Record<string, unknown>;
};

export type DpdpReadiness = {
  status?: string;
  checks?: Record<string, unknown>;
  [key: string]: unknown;
};

export type CommerceDashboard = {
  revenue?: number;
  orders?: number;
  carts_recovered?: number;
  [key: string]: unknown;
};

export type LlmRespondPayload = {
  phone: string;
  message: string;
};

export type ToolExecutePayload = {
  tool_name: string;
  phone: string;
  message: string;
  entities?: Record<string, unknown>;
};

export type CatalogSearchResult = {
  id?: number | string;
  sku?: string | null;
  title?: string | null;
  price_min?: number | string | null;
  product_url?: string | null;
};

export type OmsOrder = {
  id?: number | string;
  order_number?: string | null;
  status?: string | null;
  total?: number | string | null;
  phone?: string | null;
};

export const aiAgentApiGroups = [
  {
    title: "Runtime",
    description: "Production health, readiness and config visibility.",
    endpoints: [
      { method: "GET", path: "/health", label: "Health check" },
      { method: "GET", path: "/readiness?tenant_id=<tenant>", label: "Launch readiness" },
      { method: "GET", path: "/runtime/config", label: "Automation flags" },
      { method: "POST", path: "/runtime/tenant-config", label: "Seed live tenant config" },
    ],
  },
  {
    title: "WhatsApp Core",
    description: "Number setup, messages, live chat and templates.",
    endpoints: [
      { method: "GET", path: "/whatsapp-credential/get", label: "Connected number" },
      { method: "POST", path: "/whatsapp-credential/number-setup", label: "Save Cloud API number" },
      { method: "POST", path: "/send-message", label: "Send text message" },
      { method: "GET", path: "/conversations", label: "Conversation list" },
      { method: "GET", path: "/messages/{phone}", label: "Message history" },
      { method: "GET", path: "/whatsapp-message/contacts/get", label: "Live chat contacts" },
      { method: "POST", path: "/whatsapp-message/contacts/add", label: "Add live-chat contact" },
      { method: "PATCH", path: "/whatsapp-message/contacts/update-status", label: "Update contact status" },
      { method: "GET", path: "/whatsapp-message/tags/get-list", label: "Contact tags" },
      { method: "POST", path: "/whatsapp-message/tags/create", label: "Create tag" },
      { method: "GET", path: "/whatsapp-message/chat", label: "Chat thread" },
      { method: "POST", path: "/whatsapp-message/send-template", label: "Send template" },
      { method: "POST", path: "/whatsapp-message/send-media", label: "Send media" },
      { method: "POST", path: "/whatsapp-message/mark-read", label: "Mark message read" },
    ],
  },
  {
    title: "Templates",
    description: "Meta template create, sync, review and preview APIs.",
    endpoints: [
      { method: "POST", path: "/whatsapp-template/register", label: "Register template" },
      { method: "GET", path: "/whatsapp-template/get-list", label: "List templates" },
      { method: "GET", path: "/whatsapp-template/byid/{template_id}", label: "Template detail" },
      { method: "PUT", path: "/whatsapp-template/update/{template_id}", label: "Update template" },
      { method: "DELETE", path: "/whatsapp-template/delete/{template_id}", label: "Delete template" },
      { method: "GET", path: "/whatsapp-template/sync-template", label: "Sync from Meta" },
      { method: "GET", path: "/whatsapp-template/get-status/{template_id}", label: "Approval status" },
      { method: "GET", path: "/whatsapp-template/preview", label: "Template preview" },
      { method: "GET", path: "/whatsapp-template/language", label: "Languages" },
    ],
  },
  {
    title: "Webhooks",
    description: "Inbound WhatsApp callback, queue status, dead letters and replay.",
    endpoints: [
      { method: "GET", path: "/webhook", label: "Meta verify callback" },
      { method: "POST", path: "/webhook", label: "Inbound message callback" },
      { method: "GET", path: "/webhook/events", label: "Webhook events" },
      { method: "GET", path: "/webhook/events/dead-letter", label: "Dead-letter events" },
      { method: "POST", path: "/webhook/events/{event_id}/replay", label: "Replay failed event" },
      { method: "POST", path: "/webhook/events/retry-failed", label: "Retry failed batch" },
      { method: "POST", path: "/v1/webhook/whatsapp", label: "Versioned WhatsApp webhook" },
      { method: "POST", path: "/v1/webhook/shopify", label: "Versioned Shopify webhook" },
    ],
  },
  {
    title: "Ecommerce",
    description: "Store connections, catalog, orders and automation inputs.",
    endpoints: [
      { method: "GET", path: "/ecommerce/connections", label: "Store connections" },
      { method: "POST", path: "/ecommerce/connections", label: "Connect store" },
      { method: "PATCH", path: "/ecommerce/connections/{connection_id}", label: "Update store connection" },
      { method: "POST", path: "/ecommerce/connections/{connection_id}/test", label: "Test store connection" },
      { method: "POST", path: "/ecommerce/connections/{connection_id}/sync-orders", label: "Sync orders" },
      { method: "POST", path: "/ecommerce/connections/{connection_id}/sync-products", label: "Sync products" },
      { method: "GET", path: "/ecommerce/products", label: "Products" },
      { method: "GET", path: "/ecommerce/orders", label: "Orders" },
      { method: "GET", path: "/ecommerce/customers", label: "Customers" },
      { method: "POST", path: "/ecommerce/abandoned-cart", label: "Abandoned cart automation" },
      { method: "POST", path: "/ecommerce/automations/delivered-followups", label: "Delivered followups" },
      { method: "GET", path: "/ecommerce/bundles", label: "Bundle pairings" },
      { method: "POST", path: "/ecommerce/bundles", label: "Create bundle pairing" },
    ],
  },
  {
    title: "Automation",
    description: "Outbound templates, rules, events and due-processing APIs.",
    endpoints: [
      { method: "POST", path: "/automations/seed-defaults", label: "Seed defaults" },
      { method: "GET", path: "/automations/templates", label: "Automation templates" },
      { method: "POST", path: "/automations/templates", label: "Create automation template" },
      { method: "POST", path: "/automations/templates/outbound/seed", label: "Seed outbound templates" },
      { method: "POST", path: "/automations/templates/outbound/submit-meta", label: "Submit templates to Meta" },
      { method: "GET", path: "/automations/templates/outbound/approval-status", label: "Template approval status" },
      { method: "GET", path: "/automations/rules", label: "Automation rules" },
      { method: "POST", path: "/automations/rules", label: "Create rule" },
      { method: "PATCH", path: "/automations/rules/{rule_id}", label: "Update rule" },
      { method: "GET", path: "/automations/events", label: "Automation events" },
      { method: "POST", path: "/automations/events", label: "Create automation event" },
      { method: "POST", path: "/automations/events/abandoned-cart", label: "Create cart event" },
      { method: "POST", path: "/automations/events/{event_id}/process", label: "Process one event" },
      { method: "POST", path: "/automations/process-due", label: "Process due events" },
      { method: "GET", path: "/automations/executions", label: "Execution logs" },
    ],
  },
  {
    title: "AI Agent Runtime",
    description: "Headless agent settings, provider registry and internal tool execution.",
    endpoints: [
      { method: "GET", path: "/headless/oms/adapters", label: "OMS adapters" },
      { method: "GET", path: "/headless/llm/providers", label: "LLM providers" },
      { method: "GET", path: "/headless/tools", label: "Custom tools" },
      { method: "POST", path: "/headless/tools", label: "Upsert custom tool" },
      { method: "GET", path: "/headless/onboarding", label: "Onboarding state" },
      { method: "POST", path: "/headless/onboarding/ai-assist/website", label: "Website onboarding assist" },
      { method: "POST", path: "/headless/onboarding/ai-assist/faqs", label: "FAQ assist" },
      { method: "POST", path: "/headless/onboarding/ai-assist/bundles/suggest", label: "Suggest bundles" },
      { method: "POST", path: "/headless/onboarding/ai-assist/bundles/apply", label: "Apply bundle suggestions" },
      { method: "PUT", path: "/headless/settings", label: "Update headless settings" },
      { method: "POST", path: "/internal/llm/respond", label: "Run LLM orchestrator" },
      { method: "POST", path: "/internal/tool/execute", label: "Execute agent tool" },
      { method: "GET", path: "/internal/catalog/search", label: "Internal catalog search" },
      { method: "GET", path: "/internal/oms/order", label: "Internal OMS order lookup" },
    ],
  },
  {
    title: "CRM",
    description: "Bot settings, handoff tickets, leads and agent actions.",
    endpoints: [
      { method: "GET", path: "/bot/settings", label: "Bot settings" },
      { method: "PUT", path: "/bot/settings", label: "Update bot settings" },
      { method: "GET", path: "/handoffs", label: "Handoff tickets" },
      { method: "POST", path: "/handoffs/{ticket_id}/resolve", label: "Resolve handoff" },
      { method: "GET", path: "/leads", label: "Leads" },
      { method: "GET", path: "/appointments", label: "Appointments" },
      { method: "GET", path: "/customers/{phone}/memory", label: "Customer memory" },
      { method: "GET", path: "/agent/actions", label: "Agent actions" },
      { method: "POST", path: "/agent/actions/crm-update", label: "CRM update action" },
      { method: "POST", path: "/agent/actions/payment-link", label: "Payment link action" },
    ],
  },
  {
    title: "Analytics",
    description: "Click tracking and interaction reporting.",
    endpoints: [
      { method: "GET", path: "/analytics/dashboard", label: "Commerce dashboard" },
      { method: "POST", path: "/analytics/csat", label: "Record CSAT" },
      { method: "GET", path: "/whatsapp/analytics/summary", label: "Summary" },
      { method: "GET", path: "/whatsapp/analytics/events", label: "Events" },
      { method: "GET", path: "/whatsapp/analytics/track-click", label: "Tracked click redirect" },
    ],
  },
  {
    title: "Integrations",
    description: "Tenant-scoped WhatsApp Business integration state.",
    endpoints: [
      { method: "GET", path: "/integrations/whatsapp-business", label: "Integration status" },
      { method: "GET", path: "/integrations/whatsapp-business/connections", label: "Connections" },
      { method: "PUT", path: "/integrations/whatsapp-business/connect", label: "Connect" },
      { method: "DELETE", path: "/integrations/whatsapp-business/disconnect", label: "Disconnect" },
      { method: "GET", path: "/integrations/shopify", label: "Shopify status" },
      { method: "PUT", path: "/integrations/shopify/connect", label: "Connect Shopify" },
      { method: "GET", path: "/integrations/woocommerce", label: "WooCommerce status" },
      { method: "PUT", path: "/integrations/woocommerce/connect", label: "Connect WooCommerce" },
    ],
  },
  {
    title: "Tenant & Compliance",
    description: "Tenant config, DPDP readiness, data requests and audits.",
    endpoints: [
      { method: "GET", path: "/tenants/current/config", label: "Tenant config" },
      { method: "PUT", path: "/tenants/current/config", label: "Update tenant config" },
      { method: "POST", path: "/tenants/current/config/seed", label: "Seed tenant config" },
      { method: "POST", path: "/compliance/consent", label: "Capture consent" },
      { method: "GET", path: "/compliance/consent/status", label: "Consent status" },
      { method: "GET", path: "/compliance/dpdp/readiness", label: "DPDP readiness" },
      { method: "POST", path: "/compliance/export", label: "Export customer data" },
      { method: "POST", path: "/compliance/delete", label: "Delete customer data" },
      { method: "GET", path: "/compliance/security/audit", label: "Security audit" },
      { method: "GET", path: "/compliance/tenant-isolation/audit", label: "Tenant isolation audit" },
      { method: "POST", path: "/compliance/template/check", label: "Template compliance check" },
    ],
  },
  {
    title: "V1 Public Surface",
    description: "Versioned APIs meant for channel, dashboard and partner clients.",
    endpoints: [
      { method: "GET", path: "/v1/conversations", label: "Versioned conversations" },
      { method: "GET", path: "/v1/analytics/dashboard", label: "Versioned dashboard" },
      { method: "POST", path: "/v1/templates/submit", label: "Submit outbound templates" },
      { method: "GET", path: "/v1/broadcasts", label: "Broadcast campaigns" },
      { method: "POST", path: "/v1/broadcasts", label: "Create broadcast" },
      { method: "POST", path: "/v1/cross-sell/rules", label: "Cross-sell rule" },
      { method: "GET", path: "/v1/leads/bulk", label: "Bulk leads" },
      { method: "POST", path: "/v1/tickets/resolve", label: "Resolve ticket" },
    ],
  },
] as const;

export function getHealth() {
  return api.get<ApiHealth>("/health").then((response) => response.data);
}

export function getReadiness(tenantId = "default") {
  return api
    .get<ReadinessStatus>("/readiness", { params: { tenant_id: tenantId } })
    .then((response) => response.data);
}

export function getRuntimeConfig() {
  return api.get<RuntimeConfig>("/runtime/config").then((response) => response.data);
}

export function getWebhookEvents(status?: string) {
  return api
    .get<WebhookEvent[]>("/webhook/events", {
      params: status ? { status } : undefined,
    })
    .then((response) => response.data);
}

export function getDeadLetterEvents() {
  return api
    .get<WebhookEvent[]>("/webhook/events/dead-letter")
    .then((response) => response.data);
}

export function replayWebhookEvent(eventId: number) {
  return api
    .post<{ status: string; event_id: number }>(`/webhook/events/${eventId}/replay`)
    .then((response) => response.data);
}

export function retryFailedWebhookEvents(limit = 25) {
  return api
    .post<{ status: string; queued: number; failed: number }>("/webhook/events/retry-failed", {
      limit,
    })
    .then((response) => response.data);
}

export function getEcommerceConnections() {
  return api
    .get<EcommerceConnection[]>("/ecommerce/connections")
    .then((response) => response.data);
}

export function getWhatsappBusinessIntegration() {
  return api
    .get<WhatsappBusinessIntegration>("/integrations/whatsapp-business")
    .then((response) => response.data);
}

export function getOmsAdapters() {
  return api.get<OmsAdapters>("/headless/oms/adapters").then((response) => response.data);
}

export function getLlmProviders() {
  return api.get<HeadlessProviders>("/headless/llm/providers").then((response) => response.data);
}

export function getCustomTools() {
  return api.get<CustomTool[]>("/headless/tools").then((response) => response.data);
}

export function getHeadlessOnboarding() {
  return api.get<HeadlessOnboarding>("/headless/onboarding").then((response) => response.data);
}

export function runLlmRespond(payload: LlmRespondPayload) {
  return api.post<Record<string, unknown>>("/internal/llm/respond", payload).then((response) => response.data);
}

export function executeAgentTool(payload: ToolExecutePayload) {
  return api.post<Record<string, unknown>>("/internal/tool/execute", payload).then((response) => response.data);
}

export function searchInternalCatalog(query: string, limit = 5) {
  return api
    .get<CatalogSearchResult[]>("/internal/catalog/search", { params: { query, limit } })
    .then((response) => response.data);
}

export function lookupOmsOrder(orderId: string, phone = "") {
  return api
    .get<OmsOrder>("/internal/oms/order", { params: { order_id: orderId, phone } })
    .then((response) => response.data);
}

export function getTenantConfig() {
  return api.get<TenantConfigResponse>("/tenants/current/config").then((response) => response.data);
}

export function getDpdpReadiness() {
  return api.get<DpdpReadiness>("/compliance/dpdp/readiness").then((response) => response.data);
}

export function getCommerceDashboard(days = 30) {
  return api
    .get<CommerceDashboard>("/analytics/dashboard", { params: { days } })
    .then((response) => response.data);
}
