import api from "@/lib/api";
import axios from "axios";
import type { HandoffTicket } from "@/types/handoffs";

export type { HandoffMessage, HandoffStatus, HandoffTicket } from "@/types/handoffs";

export async function getHandoffs(status?: string) {
  const response = await api.get<HandoffTicket[]>("/handoffs", {
    params: status ? { status } : undefined,
  });
  return response.data;
}

export async function resolveHandoff({
  ticketId,
  note,
}: {
  ticketId: number;
  note?: string;
}) {
  try {
    const response = await api.post<{
      status: string;
      ticket: HandoffTicket;
      bot_resumed: boolean;
    }>(`/handoffs/${ticketId}/resolve`, { note: note || undefined });
    return response.data;
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 404) {
      throw error;
    }

    const fallbackResponse = await api.post<{
      status: string;
      ticket_id: number;
      bot_resumed: boolean;
    }>(`/handoffs/${ticketId}/close`);
    return {
      status: fallbackResponse.data.status,
      ticket: {
        id: fallbackResponse.data.ticket_id,
        phone: "",
        status: "closed",
      },
      bot_resumed: fallbackResponse.data.bot_resumed,
    };
  }
}

export async function reopenHandoff(ticketId: number) {
  const response = await api.post<{
    status: string;
    ticket: HandoffTicket;
    bot_paused: boolean;
  }>(`/handoffs/${ticketId}/reopen`);
  return response.data;
}
