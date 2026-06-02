import api from "@/lib/api";

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

export function getWhatsappTemplates(params?: {
  name?: string;
  status?: string;
  offset?: number;
  limit?: number;
  language?: string;
  category?: string;
  authentication?: boolean;
}) {
  return api
    .get<TemplateListResponse>("/whatsapp-template/get-list", { params })
    .then((response) => response.data);
}

export function getWhatsappTemplateById(id: number) {
  return api
    .get<MutationResponse<WhatsappTemplate>>(`/whatsapp-template/byid/${id}`)
    .then((response) => response.data);
}

export function registerWhatsappTemplate(payload: WhatsappTemplatePayload) {
  return api
    .post<MutationResponse>("/whatsapp-template/register", payload)
    .then((response) => response.data);
}

export function updateWhatsappTemplate(id: number, payload: WhatsappTemplatePayload) {
  return api
    .put<MutationResponse>(`/whatsapp-template/update/${id}`, payload)
    .then((response) => response.data);
}

export function deleteWhatsappTemplate(id: number) {
  return api
    .delete<MutationResponse>(`/whatsapp-template/delete/${id}`)
    .then((response) => response.data);
}

export function syncWhatsappTemplates() {
  return api
    .get<MutationResponse<{ synced_count: number }>>("/whatsapp-template/sync-template")
    .then((response) => response.data);
}

export function getWhatsappTemplateStatus(id: number) {
  return api
    .get<MutationResponse>(`/whatsapp-template/get-status/${id}`)
    .then((response) => response.data);
}

export function getWhatsappTemplateLanguages() {
  return api
    .get<MutationResponse<Array<{ language: string; language_name?: string | null }>>>(
      "/whatsapp-template/language",
    )
    .then((response) => response.data);
}

export function previewWhatsappTemplate(params: {
  languages?: string;
  add_security_recommendation?: boolean;
  code_expiration_minutes?: number;
  category?: TemplateCategory;
}) {
  return api
    .get<MutationResponse<any[]>>("/whatsapp-template/preview", { params })
    .then((response) => response.data);
}

export function sendWhatsappTemplate(payload: {
  to_no: string;
  template_id: number;
  variables: Record<string, string>;
}) {
  return api
    .post<MutationResponse>("/whatsapp-message/send-template", payload)
    .then((response) => response.data);
}
