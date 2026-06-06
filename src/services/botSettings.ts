import api from "@/lib/api";

export type BotSettings = {
  bot_enabled: boolean;
  default_language: string;
  welcome_message: string;
  fallback_message: string;
  offline_message: string;
  ai_personality: string;
  ai_tone: string;
  response_length: string;
  custom_instructions: string;
  brand_prompt: string;
  main_menu_buttons: Array<{ id: string; title: string }>;
  handoff_keywords: string[];
  business_hours_enabled: boolean;
  business_hours_start: string;
  business_hours_end: string;
  timezone: string;
  updated_at?: string | null;
};

export type LlmProviderMap = Record<string, string[]>;

export type LlmReplySettings = {
  provider: string;
  model: string;
  fallback_provider: string;
  fallback_model: string;
  base_url: string;
  api_key_env: string;
};

export type CommerceFlowSettings = {
  returning_shopper_message: string;
  order_id_prompt: string;
  catalog_unavailable_message: string;
  return_order_prompt: string;
  return_reason_prompt: string;
  return_reason_fallback: string;
  return_cancelled_message: string;
  return_confirmation_prompt: string;
  return_confirmation_fallback: string;
  return_outcome_prompt: string;
  gifting_occasion_prompt: string;
  gifting_occasion_fallback: string;
  gifting_quantity_prompt: string;
  gifting_quantity_fallback: string;
  gifting_timeline_prompt: string;
  gifting_timeline_fallback: string;
  gifting_email_prompt: string;
  bundle_push_message: string;
  first_time_offer_with_code: string;
  first_time_offer_no_code: string;
  returning_shopper_buttons: Array<{ id: string; title: string }>;
  return_outcome_buttons: Array<{ id: string; title: string }>;
  gifting_quantity_buttons: Array<{ id: string; title: string }>;
  gifting_timeline_buttons: Array<{ id: string; title: string }>;
  bundle_push_buttons: Array<{ id: string; title: string }>;
};

export type TenantConfigData = {
  tenant_id?: string;
  brand_name?: string;
  metadata?: {
    llm?: {
      provider?: string;
      model?: string;
      base_url?: string;
      api_key_env?: string;
      fallbacks?: Array<{ provider?: string; model?: string }>;
      reply?: {
        provider?: string;
        model?: string;
        base_url?: string;
        api_key_env?: string;
        fallbacks?: Array<{ provider?: string; model?: string }>;
      };
      [key: string]: unknown;
    };
    flow_settings?: {
      commerce?: Partial<CommerceFlowSettings>;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type AgentPreviewPayload = {
  phone: string;
  message: string;
};

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
