export type DashboardSectionKey =
  | 'business_profile'
  | 'business_readiness'
  | 'credit_readiness'
  | 'funding_readiness'
  | 'roadmap'
  | 'products'
  | 'funding'
  | 'funding_tracker'
  | 'consultation';

export interface DashboardSectionConfig {
  key: DashboardSectionKey;
  name: string;
  description: string;
  category: 'profile' | 'readiness' | 'tools' | 'services';
  path?: string;
}

export const PREDEFINED_DASHBOARD_SECTIONS: DashboardSectionConfig[] = [
  {
    key: 'business_profile',
    name: 'Business Profile',
    description: 'Business entity details, structure, address, and profile completeness.',
    category: 'profile',
    path: '/business',
  },
  {
    key: 'business_readiness',
    name: 'Business Readiness',
    description: 'Foundational operational score (EIN, website, domain email, phone, licenses).',
    category: 'readiness',
    path: '/dashboard',
  },
  {
    key: 'credit_readiness',
    name: 'Credit Readiness',
    description: 'Credit bureau reporting, tradelines, and credit history score.',
    category: 'readiness',
    path: '/dashboard',
  },
  {
    key: 'funding_readiness',
    name: 'Funding Readiness',
    description: 'Commercial underwriting readiness score and bank account preparedness.',
    category: 'readiness',
    path: '/funding-readiness',
  },
  {
    key: 'roadmap',
    name: 'Credit Roadmap',
    description: 'Step-by-step personalized credit-building tasks and milestones.',
    category: 'tools',
    path: '/roadmap',
  },
  {
    key: 'products',
    name: 'Credit Products',
    description: 'Vendor net-30 accounts, credit-building tradelines, and corporate cards.',
    category: 'tools',
    path: '/products',
  },
  {
    key: 'funding',
    name: 'Funding Recommendations',
    description: 'Personalized commercial loans, lines of credit, and financing options.',
    category: 'tools',
    path: '/funding',
  },
  {
    key: 'funding_tracker',
    name: 'Funding Application Tracker',
    description: 'Customer tracking for active commercial financing opportunities.',
    category: 'tools',
    path: '/funding-tracker',
  },
  {
    key: 'consultation',
    name: 'Consultation Services',
    description: '1-on-1 advisor strategy booking and appointment scheduling.',
    category: 'services',
    path: '/consultation',
  },
];

export const DEFAULT_SECTION_VISIBILITY: Record<DashboardSectionKey, boolean> = {
  business_profile: true,
  business_readiness: true,
  credit_readiness: true,
  funding_readiness: true,
  roadmap: true,
  products: true,
  funding: true,
  funding_tracker: true,
  consultation: true,
};

export interface PlatformMessaging {
  dashboardAnnouncement?: string;
  announcementEnabled?: boolean;
  welcomeMessage?: string;
  consultationMessage?: string;
  fundingGuidanceMessage?: string;
}

export interface RoadmapTaskOverride {
  title?: string;
  whyItMatters?: string;
  enabled?: boolean;
}

export interface RoadmapAdminSettings {
  disabledStages?: string[];
  disabledTasks?: string[];
  taskOverrides?: Record<string, RoadmapTaskOverride>;
}

export interface PlatformSettings {
  sections: Record<DashboardSectionKey, boolean>;
  platformName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  allowNewSignups: boolean;
  messaging?: PlatformMessaging;
  roadmapSettings?: RoadmapAdminSettings;
  updatedAt: string;
  updatedBy?: string;
}

