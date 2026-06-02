import api from "@/lib/api";

export type AnalyticsGroup = {
  count: number;
  event_type?: string | null;
  interaction_id?: string | null;
  title?: string | null;
  target_url?: string | null;
  phone?: string | null;
};

export type WhatsappAnalyticsSummary = {
  total: number;
  by_event_type: AnalyticsGroup[];
  by_button_or_link: AnalyticsGroup[];
  by_phone: AnalyticsGroup[];
};

export type WhatsappAnalyticsEvent = {
  id: number;
  phone?: string | null;
  event_type: string;
  source?: string | null;
  message_id?: string | null;
  interaction_id?: string | null;
  title?: string | null;
  target_url?: string | null;
  created_at?: string | null;
};

export type WhatsappAnalyticsEventPage = {
  items: WhatsappAnalyticsEvent[];
  total: number;
  limit: number;
  offset: number;
};

export async function getWhatsappAnalyticsSummary(days?: number) {
  const response = await api.get<WhatsappAnalyticsSummary>(
    "/whatsapp/analytics/summary",
    {
      params: days ? { days } : undefined,
    },
  );
  return response.data;
}

export async function getWhatsappAnalyticsEvents({
  limit,
  offset,
  eventType,
}: {
  limit: number;
  offset: number;
  eventType?: string;
}) {
  const response = await api.get<WhatsappAnalyticsEventPage>(
    "/whatsapp/analytics/events",
    {
      params: {
        limit,
        offset,
        event_type: eventType || undefined,
      },
    },
  );
  return response.data;
}
