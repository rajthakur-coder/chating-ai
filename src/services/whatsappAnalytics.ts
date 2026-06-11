import api from "@/lib/api";
import type {
  WhatsappAnalyticsEventPage,
  WhatsappAnalyticsSummary,
} from "@/types/analytics";

export type {
  AnalyticsGroup,
  WhatsappAnalyticsEvent,
  WhatsappAnalyticsEventPage,
  WhatsappAnalyticsSummary,
} from "@/types/analytics";

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
