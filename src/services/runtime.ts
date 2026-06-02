import api from "@/lib/api";

export type RuntimeConfig = {
  shopify_webhook_automation_enabled: boolean;
  automation_processor_enabled: boolean;
};

export async function getRuntimeConfig() {
  const response = await api.get<RuntimeConfig>("/runtime/config");
  return response.data;
}
