import api from "@/lib/api";
import type {
  AutomationRule,
  AutomationTemplate,
  VariableMappings,
} from "@/types/automations";

export type {
  AutomationRule,
  AutomationTemplate,
  VariableMappings,
} from "@/types/automations";

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
  variable_mappings,
}: {
  ruleId: number;
  name?: string;
  message_template_id?: number | null;
  whatsapp_template_id?: number | null;
  message_body?: string | null;
  enabled?: boolean;
  delay_seconds?: number;
  variable_mappings?: VariableMappings;
}) {
  const response = await api.patch<{ status: string; rule: AutomationRule }>(
    `/automations/rules/${ruleId}`,
    { name, message_template_id, whatsapp_template_id, message_body, enabled, delay_seconds, variable_mappings },
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
  variable_mappings,
}: {
  name: string;
  trigger: string;
  message_template_id?: number | null;
  whatsapp_template_id?: number | null;
  message_body?: string | null;
  enabled?: boolean;
  delay_seconds?: number;
  conditions?: Record<string, unknown>;
  variable_mappings?: VariableMappings;
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
    variable_mappings,
  });
  return response.data.rule;
}

export async function seedAutomationDefaults() {
  const response = await api.post("/automations/seed-defaults");
  return response.data;
}
