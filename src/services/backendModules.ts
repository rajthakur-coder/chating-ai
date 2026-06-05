import api from "@/lib/api";

export type AnyRecord = Record<string, unknown>;

export function unwrap<T = unknown>(promise: Promise<{ data: T }>) {
  return promise.then((response) => response.data);
}

export const ecommerceApi = {
  connections: () => unwrap<unknown[]>(api.get("/ecommerce/connections")),
  products: () => unwrap<unknown[]>(api.get("/ecommerce/products")),
  orders: () => unwrap<unknown[]>(api.get("/ecommerce/orders")),
  customers: () => unwrap<unknown[]>(api.get("/ecommerce/customers")),
  bundles: () => unwrap<unknown[]>(api.get("/ecommerce/bundles")),
  syncActive: () => unwrap(api.post("/ecommerce/sync-active")),
  syncOrders: (connectionId: string) => unwrap(api.post(`/ecommerce/connections/${connectionId}/sync-orders`, { limit: 50 })),
  syncProducts: (connectionId: string) => unwrap(api.post(`/ecommerce/connections/${connectionId}/sync-products`, { limit: 5000 })),
};

export const onboardingApi = {
  status: () => unwrap(api.get("/onboarding/status")),
  wizard: () => unwrap(api.get("/onboarding/wizard")),
  readiness: () => unwrap(api.get("/onboarding/go-live/readiness")),
  websiteAssist: (website_url: string) => unwrap(api.post("/onboarding/ai-assist/from-website", { website_url, apply: true })),
  previewTest: (phone: string, message: string) => unwrap(api.post("/onboarding/preview-test", { phone, message })),
  goLive: () => unwrap(api.post("/onboarding/go-live")),
};

export const complianceApi = {
  dpdp: () => unwrap(api.get("/compliance/dpdp/readiness")),
  securityAudit: () => unwrap(api.get("/compliance/security/audit")),
  tenantIsolation: () => unwrap(api.get("/compliance/tenant-isolation/audit")),
  dataRequests: () => unwrap(api.get("/compliance/data-principal/requests")),
  consentStatus: (phone: string) => unwrap(api.get("/compliance/consent/status", { params: { phone } })),
  templateCheck: (payload: AnyRecord) => unwrap(api.post("/compliance/template/check", payload)),
};

export const agencyApi = {
  overview: () => unwrap(api.get("/agency/overview")),
  clients: () => unwrap<unknown[]>(api.get("/agency/clients")),
  whiteLabel: () => unwrap(api.get("/agency/white-label")),
  saveClient: (payload: AnyRecord) => unwrap(api.post("/agency/clients", payload)),
};

export const systemApi = {
  health: () => unwrap(api.get("/health")),
  runtime: () => unwrap(api.get("/runtime/config")),
  readiness: (tenantId: string) => unwrap(api.get("/readiness", { params: { tenant_id: tenantId } })),
  seedTenantConfig: () => unwrap(api.post("/runtime/tenant-config")),
};

export const scraperApi = {
  scrape: (website_link: string) => unwrap(api.post("/scrape", { website_link })),
  scrapePartner: (website_link: string) => unwrap(api.post("/scrape/partner", { website_link })),
};
