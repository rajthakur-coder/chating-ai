import api from "@/lib/api";

export type AgentActionLog = {
  id: number;
  sr_no?: number;
  phone?: string | null;
  action_type: string;
  status: string;
  payload?: string | null;
  result?: string | null;
  created_at?: string | null;
};

export type AgentActionLogPage = {
  items: AgentActionLog[];
  total: number;
  limit: number;
  offset: number;
};

export async function getBotLogs({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) {
  const response = await api.get<AgentActionLogPage>("/agent/actions", {
    params: { limit, offset },
  });
  return response.data;
}
