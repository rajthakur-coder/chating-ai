import api from "@/lib/api";
import type {
  MutationResponse,
  TemplateCategory,
  TemplateListResponse,
  WhatsappTemplate,
  WhatsappTemplatePayload,
} from "@/types/templates";

export type {
  MutationResponse,
  TemplateCategory,
  TemplateListResponse,
  TemplateStatus,
  WhatsappTemplate,
  WhatsappTemplatePayload,
} from "@/types/templates";

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
