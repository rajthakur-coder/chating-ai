export type ContactStatus = "Active" | "Inactive" | "Blocked" | "Banned" | "Archived";

export type ContactTag = {
  id: number | string;
  name: string;
  color?: string | null;
};

export type Contact = {
  id: string;
  sr_no?: number;
  customer_phone_number: string;
  profile_name?: string | null;
  custom_name?: string | null;
  contact_tags?: ContactTag[];
  remark?: string | null;
  status?: ContactStatus;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ContactsResponse = {
  success: boolean;
  statusCode: number;
  message: string;
  recordsTotal: number;
  recordsFiltered: number;
  total_active?: number;
  total_blocked?: number;
  total_inactive?: number;
  data: Contact[];
};

export type ApiMutationResponse<T = unknown> = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
};
