export type ContentCategory =
  | 'business_credit'
  | 'business_funding'
  | 'credit_education'
  | 'business_readiness'
  | 'getting_started'
  | 'general';

export type ContentStatus = 'draft' | 'published' | 'archived';

export interface ContentPage {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  content: string; // Structured Markdown / Rich text
  category: ContentCategory;
  status: ContentStatus;
  featured: boolean;
  readingTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const CONTENT_CATEGORIES: Record<ContentCategory, string> = {
  business_credit: 'Business Credit',
  business_funding: 'Business Funding',
  credit_education: 'Credit Education',
  business_readiness: 'Business Readiness',
  getting_started: 'Getting Started',
  general: 'General Guides',
};
