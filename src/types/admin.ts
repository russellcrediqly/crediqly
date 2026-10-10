import { UserRole, AccountStatus } from './user';
import { BusinessProfile } from './business';
import { AccessSource, GrantType } from './subscription';

export interface AdminCustomerNote {
  id: string;
  userId: string;
  adminEmail: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminUserListItem {
  id: string; // profile id
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
  
  // Associated Business & Readiness summary
  businessId?: string;
  businessName?: string;
  entityType?: string;
  state?: string;
  industry?: string;
  businessAge?: string;
  profileCompleted: boolean;
  businessReadinessScore?: number;
  creditReadinessScore?: number;
  fundingReadinessScore?: number;
  businessReadinessLevel?: string;
  creditReadinessLevel?: string;
  fundingReadinessLevel?: string;

  // Plan, Subscription & Operations
  plan?: 'free' | 'foundation' | 'guided' | 'intensive' | 'pro' | 'premium_advisory';
  subscriptionStatus?: string;
  accessSource?: AccessSource;
  grantType?: GrantType;
  grantedBy?: string;
  grantReason?: string;
  expiresAt?: string;
  billingStatus?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  isAdvisory?: boolean;
  advisoryStatus?: string;
  fundingApplicationsCount?: number;
  lastSeenAt?: string;
}

export interface AdminUserDetail {
  profile: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    status: AccountStatus;
    lastSeenAt?: string;
    createdAt: string;
    updatedAt: string;
  };
  business: BusinessProfile | null;
  subscription: {
    planId: string;
    status: string;
    provider: string;
    accessSource?: AccessSource;
    grantType?: GrantType;
    grantedBy?: string;
    grantReason?: string;
    grantedAt?: string;
    expiresAt?: string;
    currentPeriodEnd?: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    billingStatus?: string;
    createdAt?: string;
  } | null;
  payments?: {
    id: string;
    amount: number;
    paymentType: string;
    status: string;
    createdAt: string;
    description?: string;
    stripePaymentIntentId?: string;
    stripeCheckoutSessionId?: string;
  }[];
  notes?: AdminCustomerNote[];
  consultations?: any[];
  fundingApplications?: any[];
  roadmapProgress?: {
    percentage: number;
    completedCount: number;
    totalCount: number;
    currentStageTitle?: string;
    tasks?: any[];
  };
  readinessScore: {
    businessReadinessScore: number;
    creditReadinessScore: number;
    businessReadinessLevel: string;
    creditReadinessLevel: string;
    calculatedAt: string;
  } | null;
  fundingReadinessScore?: {
    score: number;
    level: string;
    foundationScore: number;
    businessCreditScore: number;
    financialReadinessScore: number;
    profileScore: number;
    calculatedAt: string;
  } | null;
}

export interface AdminUserFilters {
  search: string;
  role: 'all' | UserRole;
  status: 'all' | AccountStatus;
  onboarding: 'all' | 'completed' | 'in_progress';
  plan: 'all' | 'free' | 'foundation' | 'guided';
  accessSource: 'all' | AccessSource;
  billingStatus: 'all' | string;
}

export interface AdminOverviewStats {
  totalUsers: number;
  totalBusinesses: number;
  completedProfiles: number;
  activeProducts: number;
  featuredProducts: number;
  publishedContent: number;
  completedRoadmapTasks: number;
  affiliateClicks: number;
  avgBusinessReadiness: number;
  avgCreditReadiness: number;
  activeSubscriptions: number;
  newUsersThisWeek: number;
  freeUsers: number;
  foundationUsers: number;
  guidedMonthlyUsers: number;
  guidedOneTimeUsers: number;
  adminGrantedUsers: number;
  complimentaryUsers: number;
  proUsers?: number; // legacy alias for foundationUsers
  advisoryUsers?: number; // legacy alias for guidedUsers
  mrr?: number;
  recurringMrr: number;
  oneTimeRevenue: number;
  totalVerifiedRevenue: number;
}
