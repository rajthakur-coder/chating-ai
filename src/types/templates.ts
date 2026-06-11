export type TemplateStatus = "PENDING" | "REJECTED" | "APPROVED" | "IN_REVIEW";
export type TemplateCategory = "MARKETING" | "UTILITY" | "AUTHENTICATION";

export type WhatsappTemplate = {
  id: number;
  name: string;
  language: string;
  language_name?: string | null;
  category: TemplateCategory;
  parameter_format?: "POSITIONAL" | "NAMED" | string | null;
  components: any[];
  status: TemplateStatus;
  quality_rating?: string | null;
  message_send_ttl_seconds?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type TemplateListResponse = {
  success: boolean;
  statusCode: number;
  message: string;
  recordsTotal: number;
  recordsFiltered: number;
  data: WhatsappTemplate[];
};

export type MutationResponse<T = unknown> = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
};

export type WhatsappTemplatePayload = {
  name: string;
  language: string;
  language_name?: string;
  category?: TemplateCategory;
  parameter_format: "POSITIONAL" | "NAMED";
  components: any[];
  message_send_ttl_seconds?: number;
};
