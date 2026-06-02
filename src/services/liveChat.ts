import api from "@/lib/api";

export type LiveChatContact = {
  id: string;
  customer_phone_number: string;
  profile_name: string;
  custom_name?: string | null;
  last_message: string;
  last_message_time?: string | null;
  unread_count?: number;
  status?: string;
  isWindowOpen?: boolean;
};

export type LiveChatMessage = {
  id: string | number;
  msg_id?: string | number;
  from_no?: string;
  to_no?: string;
  message_body: string;
  message_type: string;
  payload?: unknown;
  direction: "in" | "out" | "incoming" | "outgoing";
  status?: string;
  created_at: string;
};

type ListResponse<T> = {
  data: T[];
  recordsTotal?: number;
  recordsFiltered?: number;
};

export async function getLiveChatContacts(params?: {
  offset?: number;
  limit?: number;
  searchValue?: string;
}) {
  const response = await api.get<ListResponse<LiveChatContact>>(
    "/whatsapp-message/contacts/get",
    { params },
  );
  return response.data;
}

export async function getLiveChatMessages(contact: string) {
  const response = await api.get<{ data: LiveChatMessage[] }>(
    "/whatsapp-message/chat",
    { params: { contact } },
  );
  return response.data.data;
}

export async function sendLiveChatMessage(payload: {
  to_no: string;
  message_body: string;
  temp_msg_id?: string;
}) {
  const response = await api.post("/whatsapp-message/send-media", {
    ...payload,
    message_type: "text",
  });
  return response.data;
}

export function getLiveChatSocketUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (explicitUrl) return explicitUrl;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  if (!apiUrl) return "";

  return apiUrl.replace(/^http/i, "ws").replace(/\/$/, "") + "/ws/live-chat";
}
