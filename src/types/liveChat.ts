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
