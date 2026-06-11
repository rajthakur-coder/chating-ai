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
