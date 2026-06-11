import api from "@/lib/api";
import type { CommerceDashboard } from "@/types/analytics";

export type { CommerceDashboard } from "@/types/analytics";

export function getCommerceDashboard(days = 30) {
  return api
    .get<CommerceDashboard>("/analytics/dashboard", { params: { days } })
    .then((response) => response.data);
}
