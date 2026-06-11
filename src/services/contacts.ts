import api from "@/lib/api";
import type {
  ApiMutationResponse,
  ContactStatus,
  ContactTag,
  ContactsResponse,
} from "@/types/contacts";

export type {
  ApiMutationResponse,
  Contact,
  ContactStatus,
  ContactTag,
  ContactsResponse,
} from "@/types/contacts";

export function getContacts(params?: {
  offset?: number;
  limit?: number;
  searchValue?: string;
  status?: ContactStatus;
  tags?: string;
  tag_ids?: string | number;
}) {
  return api
    .get<ContactsResponse>("/whatsapp-message/contacts/get", { params })
    .then((response) => response.data);
}

export function saveContact(payload: {
  customer_phone_number: string;
  custom_name: string;
  remark?: string;
}) {
  return api
    .post<ApiMutationResponse>("/whatsapp-message/contacts/add", payload)
    .then((response) => response.data);
}

export function updateContactStatus(payload: {
  customer_phone_number: string;
  status: ContactStatus;
}) {
  return api
    .patch<ApiMutationResponse>("/whatsapp-message/contacts/update-status", payload)
    .then((response) => response.data);
}

export function deleteContact(contact: string) {
  return api
    .delete<ApiMutationResponse>("/whatsapp-message/contacts/delete", {
      params: { contact },
    })
    .then((response) => response.data);
}

export function getTags(params?: { search?: string; offset?: number; limit?: number }) {
  return api
    .get<{ data: ContactTag[] }>("/whatsapp-message/tags/get-list", { params })
    .then((response) => response.data.data);
}

export function createTag(payload: { name: string; color?: string }) {
  return api
    .post<ApiMutationResponse<ContactTag>>("/whatsapp-message/tags/create", payload)
    .then((response) => response.data);
}

export function assignTags(payload: { contact_id: number; tag_ids: number[] }) {
  return api
    .post<ApiMutationResponse>("/whatsapp-message/tags/assign", payload)
    .then((response) => response.data);
}

export function removeAssignedTag(payload: { contact_id: number; tag_id: number }) {
  return api
    .post<ApiMutationResponse>("/whatsapp-message/tags/remove", payload)
    .then((response) => response.data);
}
