import api from "@/lib/api";
import type {
  AgentPreviewPayload,
  BotSettings,
  CommerceFlowSettings,
  LlmProviderMap,
  LlmReplySettings,
  TenantConfigData,
} from "@/types/botSettings";

export type {
  AgentPreviewPayload,
  BotSettings,
  CommerceFlowSettings,
  LlmProviderMap,
  LlmReplySettings,
  TenantConfigData,
} from "@/types/botSettings";

export async function getBotSettings() {
  const response = await api.get<BotSettings>("/bot/settings");
  return response.data;
}

export async function updateBotSettings(settings: BotSettings) {
  const response = await api.put<{ status: string; settings: BotSettings }>(
    "/bot/settings",
    settings,
  );
  return response.data.settings;
}

export async function getLlmProviders() {
  const response = await api.get<LlmProviderMap>("/headless/llm/providers");
  return response.data;
}

export async function getTenantConfig() {
  const response = await api.get<{ status: string; data: TenantConfigData }>("/tenants/current/config");
  return response.data.data;
}

export async function updateTenantCommerceFlowSettings(
  currentConfig: TenantConfigData | undefined,
  commerceFlowSettings: CommerceFlowSettings,
) {
  const metadata = {
    ...(currentConfig?.metadata || {}),
    flow_settings: {
      ...(currentConfig?.metadata?.flow_settings || {}),
      commerce: commerceFlowSettings,
    },
  };

  const response = await api.put<{ status: string; data: TenantConfigData }>("/tenants/current/config", {
    brand_name: currentConfig?.brand_name,
    brand_voice_prompt: currentConfig?.brand_voice_prompt,
    return_policy: currentConfig?.return_policy,
    shipping_policy: currentConfig?.shipping_policy,
    warranty_policy: currentConfig?.warranty_policy,
    discount_rules: currentConfig?.discount_rules || [],
    categories: currentConfig?.categories || [],
    support_email: currentConfig?.support_email,
    support_sla_hours: currentConfig?.support_sla_hours,
    default_emoji: currentConfig?.default_emoji,
    default_tone: currentConfig?.default_tone,
    metadata,
  });
  return response.data.data;
}

export async function updateHeadlessLlmSettings(settings: LlmReplySettings) {
  const fallbacks =
    settings.fallback_provider && settings.fallback_model
      ? [{ provider: settings.fallback_provider, model: settings.fallback_model }]
      : [];

  const response = await api.put<TenantConfigData>("/headless/settings", {
    llm: {
      reply: {
        provider: settings.provider,
        model: settings.model,
        base_url: settings.base_url || undefined,
        api_key_env: settings.api_key_env || undefined,
        fallbacks,
      },
    },
  });
  return response.data;
}

export async function updateHeadlessAgentSettings(
  llmSettings: LlmReplySettings,
  commerceFlowSettings: CommerceFlowSettings,
) {
  const fallbacks =
    llmSettings.fallback_provider && llmSettings.fallback_model
      ? [{ provider: llmSettings.fallback_provider, model: llmSettings.fallback_model }]
      : [];

  const response = await api.put<TenantConfigData>("/headless/settings", {
    llm: {
      reply: {
        provider: llmSettings.provider,
        model: llmSettings.model,
        base_url: llmSettings.base_url || undefined,
        api_key_env: llmSettings.api_key_env || undefined,
        fallbacks,
      },
    },
    flow_settings: {
      commerce: commerceFlowSettings,
    },
  });
  return response.data;
}

export async function runAgentPreview(payload: AgentPreviewPayload) {
  const response = await api.post<Record<string, unknown>>("/internal/llm/respond", payload);
  return response.data;
}
