export type VariableMappings = {
  body?: string[];
  buttons?: string[];
};

export type AutomationRule = {
  id: number;
  sr_no?: number;
  name: string;
  trigger: string;
  message_template_id?: number | null;
  message_template_type?: string | null;
  provider_template_name?: string | null;
  template_language?: string | null;
  message_body?: string | null;
  delay_seconds: number;
  conditions?: Record<string, unknown>;
  variable_mappings?: VariableMappings;
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
