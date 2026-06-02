import api from "@/lib/api";

export type KnowledgeSocial = {
  type?: string;
  social_type?: string;
  url: string;
};

export type KnowledgeBase = {
  website_link?: string | null;
  company_name?: string | null;
  industry?: string | null;
  about_company?: string | null;
  target_demographics?: string | null;
  logo?: string | null;
  socials: KnowledgeSocial[];
  page_images: string[];
  policies?: string | null;
  faqs?: string | null;
  updated_at?: string | null;
};

export type ScraperResponse = {
  status: string;
  data: KnowledgeBase;
};

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
