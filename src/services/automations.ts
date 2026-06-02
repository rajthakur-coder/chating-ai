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

export async function getAutomationRules() {
  const response = await api.get<AutomationRule[]>("/automations/rules");
  return response.data;
}

export async function updateAutomationRule({
  ruleId,
  enabled,
  delay_seconds,
}: {
  ruleId: number;
  enabled?: boolean;
  delay_seconds?: number;
}) {
  const response = await api.patch<{ status: string; rule: AutomationRule }>(
    `/automations/rules/${ruleId}`,
    { enabled, delay_seconds },
  );
  return response.data.rule;
}

export async function seedAutomationDefaults() {
  const response = await api.post("/automations/seed-defaults");
  return response.data;
}
