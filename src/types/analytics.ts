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

export type CommerceDashboard = {
  revenue?: number;
  orders?: number;
  carts_recovered?: number;
  [key: string]: unknown;
};
