import api from "@/lib/api";
import type { KnowledgeBase, ScraperResponse } from "@/types/knowledgeBase";

export type { KnowledgeBase, KnowledgeSocial, ScraperResponse } from "@/types/knowledgeBase";

export async function scrapeWebsite(websiteLink: string) {
  const response = await api.post<ScraperResponse>("/scrape", {
    website_link: websiteLink,
  });
  return response.data.data;
}

export async function getKnowledgeBase() {
  const response = await api.get<KnowledgeBase>("/knowledge-base");
  return response.data;
}

export async function saveKnowledgeBase(payload: KnowledgeBase) {
  const response = await api.put<{ status: string; data: KnowledgeBase }>(
    "/knowledge-base",
    payload,
  );
  return response.data.data;
}
