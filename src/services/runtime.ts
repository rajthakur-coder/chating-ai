import api from "@/lib/api";
import type { RuntimeConfig } from "@/types/runtime";

export type { RuntimeConfig } from "@/types/runtime";

export async function getRuntimeConfig() {
  const response = await api.get<RuntimeConfig>("/runtime/config");
  return response.data;
}
