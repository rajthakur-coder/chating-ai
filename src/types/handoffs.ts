export type HandoffStatus = "open" | "closed" | string;

export type HandoffTicket = {
  id: number;
  phone: string;
  reason?: string | null;
  status: HandoffStatus;
  summary?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};
