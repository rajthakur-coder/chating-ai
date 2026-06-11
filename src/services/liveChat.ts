import api from "@/lib/api";
import type { LiveChatContact, LiveChatMessage } from "@/types/liveChat";

export type { LiveChatContact, LiveChatMessage } from "@/types/liveChat";

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

export function getLiveChatSocketBaseUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || "";
  const source = explicitUrl || apiUrl;
  if (!source) return "";

  return source
    .replace(/^wss:/i, "https:")
    .replace(/^ws:/i, "http:")
    .replace(/\/ws\/live-chat\/?$/i, "")
    .replace(/\/api\/v\d+\/?$/i, "")
    .replace(/\/$/, "");
}
