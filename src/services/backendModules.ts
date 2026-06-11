import api from "@/lib/api";
import type { AnyRecord } from "@/types/backendModules";

export type { AnyRecord } from "@/types/backendModules";

export function unwrap<T = unknown>(promise: Promise<{ data: T }>) {
  return promise.then((response) => response.data);
}

export const ecommerceApi = {
  connections: () => unwrap<unknown[]>(api.get("/ecommerce/connections")),
  bundles: () => unwrap<unknown[]>(api.get("/ecommerce/bundles")),
  syncActive: () => unwrap(api.post("/ecommerce/sync-active")),
};

export const onboardingApi = {
  status: () => unwrap(api.get("/onboarding/status")),
  wizard: () => unwrap(api.get("/onboarding/wizard")),
  readiness: () => unwrap(api.get("/onboarding/go-live/readiness")),
  websiteAssist: (website_url: string) => unwrap(api.post("/onboarding/ai-assist/from-website", { website_url, apply: true })),
  previewTest: (phone: string, message: string) => unwrap(api.post("/onboarding/preview-test", { phone, message })),
  goLive: () => unwrap(api.post("/onboarding/go-live")),
};



export const scraperApi = {
  scrape: (website_link: string) => unwrap(api.post("/scrape", { website_link })),
  scrapePartner: (website_link: string) => unwrap(api.post("/scrape/partner", { website_link })),
};
