export type HandoffStatus = "open" | "closed" | string;

export type HandoffMessage = {
  id?: string | number;
  message_body?: string | null;
  body?: string | null;
  text?: string | null;
  content?: string | null;
  message_type?: string | null;
  payload?: unknown;
  direction?: "in" | "out" | "incoming" | "outgoing" | string;
  sender?: string | null;
  from_no?: string | null;
  to_no?: string | null;
  created_at?: string | null;
  timestamp?: string | null;
};

export type HandoffTimelineItem = {
  id?: string | number;
  title?: string | null;
  description?: string | null;
  created_at?: string | null;
  timestamp?: string | null;
  status?: string | null;
};

export type HandoffCustomerProfile = {
  customer_id?: string | number | null;
  lifetime_value?: string | number | null;
  last_order?: string | null;
  plan?: string | null;
  sentiment?: string | null;
  [key: string]: unknown;
};

export type HandoffTicket = {
  id: number;
  phone: string;
  customer_name?: string | null;
  name?: string | null;
  profile_name?: string | null;
  channel?: string | null;
  priority?: string | null;
  tags?: string[] | null;
  reason?: string | null;
  status: HandoffStatus;
  summary?: string | null;
  resolution_note?: string | null;
  messages?: HandoffMessage[] | string | null;
  conversation?: HandoffMessage[] | string | null;
  transcript?: HandoffMessage[] | string | null;
  timeline?: HandoffTimelineItem[] | null;
  customer_profile?: HandoffCustomerProfile | null;
  profile?: HandoffCustomerProfile | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};
