import api from "@/lib/api";

export type AutomationRule = {
  id: number;
  sr_no?: number;
  name: string;
  trigger: string;
  message_template_id?: number | null;
  message_body?: string | null;
  delay_seconds: number;
  conditions?: Record<string, unknown>;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
};

export type AutomationTemplate = {
  id: number;
  name: string;
  body: string;
  channel: string;
  template_type: string;
  provider_template_name?: string | null;
  language: string;
  body_variable_order: string[];
  status: string;
  created_at?: string;
  updated_at?: string;
};

export async function getAutomationRules() {
  const response = await api.get<AutomationRule[]>("/automations/rules");
  return response.data;
}

export async function getAutomationTemplates() {
  const response = await api.get<AutomationTemplate[]>("/automations/templates");
  return response.data;
}

export async function updateAutomationRule({
  ruleId,
  name,
  message_template_id,
  whatsapp_template_id,
  message_body,
  enabled,
  delay_seconds,
}: {
  ruleId: number;
  name?: string;
  message_template_id?: number | null;
  whatsapp_template_id?: number | null;
  message_body?: string | null;
  enabled?: boolean;
  delay_seconds?: number;
}) {
  const response = await api.patch<{ status: string; rule: AutomationRule }>(
    `/automations/rules/${ruleId}`,
    { name, message_template_id, whatsapp_template_id, message_body, enabled, delay_seconds },
  );
  return response.data.rule;
}

export async function createAutomationRule({
  name,
  trigger,
  message_template_id,
  whatsapp_template_id,
  message_body,
  enabled,
  delay_seconds,
  conditions,
}: {
  name: string;
  trigger: string;
  message_template_id?: number | null;
  whatsapp_template_id?: number | null;
  message_body?: string | null;
  enabled?: boolean;
  delay_seconds?: number;
  conditions?: Record<string, unknown>;
}) {
  const response = await api.post<{ status: string; rule: AutomationRule }>("/automations/rules", {
    name,
    trigger,
    message_template_id,
    whatsapp_template_id,
    message_body,
    enabled,
    delay_seconds,
    conditions,
  });
  return response.data.rule;
}

export async function seedAutomationDefaults() {
  const response = await api.post("/automations/seed-defaults");
  return response.data;
}
