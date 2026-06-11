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
