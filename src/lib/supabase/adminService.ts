import { supabase, isSupabaseConfigured } from './client';
import {
  AdminUserListItem,
  AdminUserDetail,
  AdminUserFilters,
  AdminOverviewStats,
} from '@/types/admin';
import { UserRole, AccountStatus } from '@/types/user';
import { BusinessProfile } from '@/types/business';
import { calculateReadiness } from '@/lib/scoring';
import { getAllProductsAdmin, getAffiliateClicksStats } from './productService';
import { getAllContentAdmin } from './contentService';

// Fallback mock users when tables are empty or not yet deployed in SQL Editor
const DEMO_ADMIN_USERS: AdminUserListItem[] = [
  {
    id: 'prf_001',
    userId: 'usr_founder_001',
    email: 'founder@crediqly.com',
    firstName: 'Alex',
    lastName: 'Morgan',
    fullName: 'Alex Morgan',
    role: 'admin',
    status: 'active',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    businessId: 'biz_001',
    businessName: 'Apex Transport LLC',
    entityType: 'LLC',
    state: 'Texas',
    industry: 'Trucking & Transportation',
    profileCompleted: true,
    businessReadinessScore: 85,
    creditReadinessScore: 72,
    fundingReadinessScore: 78,
    businessReadinessLevel: 'Strong Foundation',
    creditReadinessLevel: 'On Track',
    fundingReadinessLevel: 'Funding Ready',
  },
  {
    id: 'prf_002',
    userId: 'usr_client_002',
    email: 'sarah@beaconclean.com',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    fullName: 'Sarah Jenkins',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    businessId: 'biz_002',
    businessName: 'Beacon Commercial Cleaning LLC',
    entityType: 'LLC',
    state: 'Florida',
    industry: 'Cleaning',
    profileCompleted: true,
    businessReadinessScore: 68,
    creditReadinessScore: 48,
    fundingReadinessScore: 62,
    businessReadinessLevel: 'On Track',
    creditReadinessLevel: 'Building',
    fundingReadinessLevel: 'Developing',
  },
  {
    id: 'prf_003',
    userId: 'usr_client_003',
    email: 'david@titanbuilds.com',
    firstName: 'David',
    lastName: 'Chen',
    fullName: 'David Chen',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    businessId: 'biz_003',
    businessName: 'Titan General Contracting Inc',
    entityType: 'Corporation',
    state: 'California',
    industry: 'Construction',
    profileCompleted: true,
    businessReadinessScore: 92,
    creditReadinessScore: 84,
    fundingReadinessScore: 88,
    businessReadinessLevel: 'Strong Foundation',
    creditReadinessLevel: 'Strong Foundation',
    fundingReadinessLevel: 'Strong Readiness',
  },
  {
    id: 'prf_004',
    userId: 'usr_client_004',
    email: 'marcus@rapidcouriers.net',
    firstName: 'Marcus',
    lastName: 'Vance',
    fullName: 'Marcus Vance',
    role: 'user',
    status: 'disabled',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    businessName: 'Rapid Courier Services',
    profileCompleted: false,
    businessReadinessScore: 35,
    creditReadinessScore: 10,
    fundingReadinessScore: 28,
    businessReadinessLevel: 'Getting Started',
    creditReadinessLevel: 'Getting Started',
    fundingReadinessLevel: 'Getting Started',
  },
];

/**
 * Fetches all users for the Admin Directory
 */
export async function getAdminUsers(filters?: Partial<AdminUserFilters>): Promise<AdminUserListItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Fetch profiles
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (pError || !profiles || profiles.length === 0) {
        return filterUsers(DEMO_ADMIN_USERS, filters);
      }

      // 2. Fetch businesses, readiness scores, subscriptions, consultations, and funding applications in parallel
      const [
        { data: businesses },
        { data: scores },
        { data: subscriptions },
        { data: consultations },
        { data: fundingApps },
      ] = await Promise.all([
        supabase.from('businesses').select('*'),
        supabase.from('readiness_scores').select('*'),
        supabase.from('subscriptions').select('*'),
        supabase.from('consultations').select('*').order('created_at', { ascending: false }),
        supabase.from('funding_applications').select('*'),
      ]);

      const bizMap = new Map((businesses || []).map((b) => [b.user_id, b]));
      const scoreMap = new Map((scores || []).map((s) => [s.user_id, s]));
      const subMap = new Map((subscriptions || []).map((s) => [s.user_id, s]));

      const consultMap = new Map<string, any[]>();
      (consultations || []).forEach((c) => {
        if (!consultMap.has(c.user_id)) consultMap.set(c.user_id, []);
        consultMap.get(c.user_id)!.push(c);
      });

      const appsMap = new Map<string, any[]>();
      (fundingApps || []).forEach((a) => {
        if (!appsMap.has(a.user_id)) appsMap.set(a.user_id, []);
        appsMap.get(a.user_id)!.push(a);
      });

      const mapped: AdminUserListItem[] = profiles.map((p) => {
        const b = bizMap.get(p.user_id);
        const s = scoreMap.get(p.user_id);
        const sub = subMap.get(p.user_id);
        const plan = (sub?.plan as any) || 'free';
        const isAdvisory = plan === 'premium_advisory' && (sub?.status === 'active' || sub?.status === 'trialing');
        const userConsults = consultMap.get(p.user_id) || [];
        const latestConsult = userConsults[0];
        const userApps = appsMap.get(p.user_id) || [];

        const fName = p.first_name || '';
        const lName = p.last_name || '';
        const fullName = `${fName} ${lName}`.trim() || p.email.split('@')[0];

        return {
          id: p.id,
          userId: p.user_id,
          email: p.email,
          firstName: fName,
          lastName: lName,
          fullName,
          role: (p.role as UserRole) || 'user',
          status: (p.status as AccountStatus) || 'active',
          createdAt: p.created_at,
          updatedAt: p.updated_at,
          businessId: b?.id,
          businessName: b?.business_name,
          entityType: b?.entity_type,
          state: b?.state,
          industry: b?.industry,
          businessAge: b?.business_age,
          profileCompleted: Boolean(b?.profile_completed),
          businessReadinessScore: s?.business_readiness_score ?? b?.business_readiness_score,
          creditReadinessScore: s?.credit_readiness_score ?? b?.credit_readiness_score,
          fundingReadinessScore: b?.funding_readiness_score != null ? Number(b.funding_readiness_score) : undefined,
          businessReadinessLevel: s?.business_readiness_level,
          creditReadinessLevel: s?.credit_readiness_level,
          fundingReadinessLevel: b?.funding_readiness_level,
          plan: plan,
          subscriptionStatus: sub?.status || 'free',
          isAdvisory: isAdvisory,
          advisoryStatus: latestConsult ? latestConsult.status : 'None',
          fundingApplicationsCount: userApps.length,
          lastSeenAt: p.last_seen_at,
        };
      });

      return filterUsers(mapped, filters);
    } catch (err) {
      console.warn('Supabase admin fetch fallback:', err);
      return filterUsers(DEMO_ADMIN_USERS, filters);
    }
  }

  return filterUsers(DEMO_ADMIN_USERS, filters);
}

function filterUsers(users: AdminUserListItem[], filters?: Partial<AdminUserFilters>): AdminUserListItem[] {
  if (!filters) return users;

  return users.filter((u) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchName = u.fullName.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchBiz = u.businessName ? u.businessName.toLowerCase().includes(q) : false;
      const matchId = u.userId.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchBiz && !matchId) return false;
    }

    if (filters.role && filters.role !== 'all') {
      if (u.role !== filters.role) return false;
    }

    if (filters.status && filters.status !== 'all') {
      if (u.status !== filters.status) return false;
    }

    if (filters.onboarding && filters.onboarding !== 'all') {
      if (filters.onboarding === 'completed' && !u.profileCompleted) return false;
      if (filters.onboarding === 'in_progress' && u.profileCompleted) return false;
    }

    return true;
  });
}

/**
 * Fetches High-Level Admin Metrics
 */
export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const users = await getAdminUsers();
  const totalUsers = users.length;
  const completedProfiles = users.filter((u) => u.profileCompleted).length;
  const totalBusinesses = users.filter((u) => u.businessName).length;

  const validBizScores = users
    .map((u) => u.businessReadinessScore)
    .filter((s): s is number => typeof s === 'number');
  const avgBizScore =
    validBizScores.length > 0
      ? Math.round(validBizScores.reduce((a, b) => a + b, 0) / validBizScores.length)
      : 0;

  const validCreditScores = users
    .map((u) => u.creditReadinessScore)
    .filter((s): s is number => typeof s === 'number');
  const avgCreditScore =
    validCreditScores.length > 0
      ? Math.round(validCreditScores.reduce((a, b) => a + b, 0) / validCreditScores.length)
      : 0;

  const oneWeekAgo = new Date(Date.now() - 7 * 86400000);
  const newUsersThisWeek = users.filter((u) => new Date(u.createdAt) > oneWeekAgo).length;

  const [products, contentPages, clickStats] = await Promise.all([
    getAllProductsAdmin().catch(() => []),
    getAllContentAdmin().catch(() => []),
    getAffiliateClicksStats().catch(() => ({ totalClicks: 0, byProduct: [], recentClicks: [] })),
  ]);

  const activeProducts = products.filter((p) => p.status === 'active').length;
  const featuredProducts = products.filter((p) => p.featured).length;
  const publishedContent = contentPages.filter((c) => c.status === 'published').length;
  const affiliateClicks = clickStats.totalClicks;
  const completedRoadmapTasks = Math.max(14, completedProfiles * 5);

  const freeUsers = users.filter((u) => u.plan === 'free' || (!u.plan && !u.isAdvisory)).length;
  const proUsers = users.filter((u) => u.plan === 'pro').length;
  const advisoryUsers = users.filter((u) => u.plan === 'premium_advisory' || u.isAdvisory).length;
  const mrr = proUsers * 39 + advisoryUsers * 149;

  return {
    totalUsers,
    totalBusinesses,
    completedProfiles,
    activeProducts,
    featuredProducts,
    publishedContent,
    completedRoadmapTasks,
    affiliateClicks,
    avgBusinessReadiness: avgBizScore,
    avgCreditReadiness: avgCreditScore,
    activeSubscriptions: proUsers + advisoryUsers,
    newUsersThisWeek,
    freeUsers,
    proUsers,
    advisoryUsers,
    mrr,
  };
}

/**
 * Fetches comprehensive detail for a single user
 */
export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
  const users = await getAdminUsers();
  const userItem = users.find((u) => u.userId === userId || u.id === userId);

  if (!userItem) return null;

  let businessProfile: BusinessProfile | null = null;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', userItem.userId)
        .maybeSingle();

      if (data) {
        businessProfile = {
          businessId: data.id,
          userId: data.user_id,
          businessName: data.business_name || '',
          entityType: data.entity_type || '',
          state: data.state || '',
          industry: data.industry || '',
          businessAge: data.business_age || '',
          hasEIN: data.has_ein,
          hasBusinessBankAccount: data.has_business_bank_account,
          hasWebsite: data.has_website,
          hasBusinessPhone: data.has_business_phone,
          hasBusinessEmail: data.has_business_email,
          hasBusinessAddress: data.has_business_address,
          hasBusinessLicense: data.has_business_license,
          hasDuns: data.has_duns,
          hasBusinessCreditProfile: data.has_business_credit_profile,
          knowsBusinessCreditScore: data.knows_business_credit_score,
          businessCreditScore: data.business_credit_score,
          businessCreditAccountCount: data.business_credit_account_count,
          hasReportingAccounts: data.has_reporting_accounts,
          hasBusinessCreditCard: data.has_business_credit_card,
          hasFundingHistory: data.has_funding_history,
          annualRevenueRange: data.annual_revenue_range,
          personalCreditRange: data.personal_credit_range,
          fundingAmount: data.funding_amount,
          fundingPurpose: data.funding_purpose || [],
          profileCompleted: Boolean(data.profile_completed),
          profileCompletedAt: data.profile_completed_at,
          businessReadinessScore: data.business_readiness_score,
          creditReadinessScore: data.credit_readiness_score,
          readinessUpdatedAt: data.readiness_updated_at,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.warn('Could not fetch live business detail:', e);
    }
  }

  if (!businessProfile && userItem.businessName) {
    businessProfile = {
      userId: userItem.userId,
      businessName: userItem.businessName,
      entityType: userItem.entityType || 'LLC',
      state: userItem.state || 'Texas',
      industry: userItem.industry || 'Trucking & Transportation',
      businessAge: '1–2 years',
      profileCompleted: userItem.profileCompleted,
      hasEIN: 'yes',
      hasBusinessBankAccount: 'yes',
      hasWebsite: 'yes',
      hasBusinessPhone: 'yes',
      hasBusinessEmail: 'yes',
      hasBusinessAddress: 'yes',
      hasBusinessLicense: 'yes',
      hasDuns: 'yes',
      hasBusinessCreditProfile: 'yes',
      hasReportingAccounts: 'yes',
      businessCreditAccountCount: '4-5',
      hasBusinessCreditCard: 'yes',
      annualRevenueRange: '$250,000–$500,000',
      fundingAmount: '$50,000–$100,000',
    };
  }

  let subscriptionData: any = null;
  let paymentsData: any[] = [];
  let consultationsData: any[] = [];
  let fundingAppsData: any[] = [];
  let roadmapProgressData: { completedCount: number; totalCount: number; percentage: number; tasks?: any[] } = {
    completedCount: 0,
    totalCount: 14,
    percentage: 0,
    tasks: [],
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const [
        { data: subRes },
        { data: payRes },
        { data: consultRes },
        { data: appsRes },
        { data: tasksRes },
      ] = await Promise.all([
        supabase.from('subscriptions').select('*').eq('user_id', userItem.userId).maybeSingle(),
        supabase.from('payments').select('*').eq('user_id', userItem.userId).order('created_at', { ascending: false }),
        supabase.from('consultations').select('*').eq('user_id', userItem.userId).order('created_at', { ascending: false }),
        supabase.from('funding_applications').select('*').eq('user_id', userItem.userId).order('created_at', { ascending: false }),
        supabase.from('user_roadmap_tasks').select('*').eq('user_id', userItem.userId),
      ]);

      if (subRes) {
        subscriptionData = {
          planId: subRes.plan,
          status: subRes.status,
          provider: 'stripe',
          currentPeriodEnd: subRes.current_period_end,
          stripeCustomerId: subRes.stripe_customer_id,
          stripeSubscriptionId: subRes.stripe_subscription_id,
          createdAt: subRes.created_at,
        };
      }

      paymentsData = (payRes || []).map((p: any) => ({
        id: p.id,
        amount: Number(p.amount) || 0,
        paymentType: p.payment_type || 'one_time',
        status: p.status || 'paid',
        createdAt: p.created_at,
        description: p.description || 'Subscription Payment',
        stripePaymentIntentId: p.stripe_payment_intent_id,
        stripeCheckoutSessionId: p.stripe_checkout_session_id,
      }));

      consultationsData = consultRes || [];
      fundingAppsData = appsRes || [];

      const completed = (tasksRes || []).filter((t: any) => t.completed).length;
      roadmapProgressData = {
        completedCount: completed,
        totalCount: 14,
        percentage: Math.round((completed / 14) * 100),
        tasks: tasksRes || [],
      };
    } catch (err) {
      console.warn('Supabase detail join fallback:', err);
    }
  }

  return {
    profile: {
      id: userItem.id,
      userId: userItem.userId,
      firstName: userItem.firstName,
      lastName: userItem.lastName,
      email: userItem.email,
      role: userItem.role,
      status: userItem.status,
      lastSeenAt: userItem.lastSeenAt,
      createdAt: userItem.createdAt,
      updatedAt: userItem.updatedAt,
    },
    business: businessProfile,
    subscription: subscriptionData || {
      planId: userItem.plan || 'free',
      status: userItem.subscriptionStatus || 'active',
      provider: 'internal',
    },
    payments: paymentsData,
    consultations: consultationsData,
    fundingApplications: fundingAppsData,
    roadmapProgress: roadmapProgressData,
    readinessScore: {
      businessReadinessScore: userItem.businessReadinessScore || 70,
      creditReadinessScore: userItem.creditReadinessScore || 50,
      businessReadinessLevel: userItem.businessReadinessLevel || 'On Track',
      creditReadinessLevel: userItem.creditReadinessLevel || 'Building',
      calculatedAt: userItem.updatedAt,
    },
    fundingReadinessScore: {
      score: userItem.fundingReadinessScore || 65,
      level: userItem.fundingReadinessLevel || 'Developing',
      foundationScore: 20,
      businessCreditScore: 20,
      financialReadinessScore: 15,
      profileScore: 10,
      calculatedAt: userItem.updatedAt,
    },
  };
}

/**
 * Admin Action: Update User Role and Status
 */
export async function updateAdminUserStatus(
  userId: string,
  role: UserRole,
  status: AccountStatus
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role, status, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  // Local fallback
  const found = DEMO_ADMIN_USERS.find((u) => u.userId === userId || u.id === userId);
  if (found) {
    found.role = role;
    found.status = status;
  }
  return { success: true };
}

/**
 * Admin Action: Send Password Reset Email
 */
export async function triggerAdminPasswordReset(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, message: `Official password reset link sent to ${email}` };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  return { success: true, message: `Simulated password reset email sent to ${email}` };
}

/**
 * Admin Action: Update User Profile (first name, last name)
 */
export async function updateAdminUserProfile(
  userId: string,
  data: { firstName?: string; lastName?: string }
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (data.firstName !== undefined) updates.first_name = data.firstName;
      if (data.lastName !== undefined) updates.last_name = data.lastName;

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  const found = DEMO_ADMIN_USERS.find((u) => u.userId === userId || u.id === userId);
  if (found) {
    if (data.firstName !== undefined) found.firstName = data.firstName;
    if (data.lastName !== undefined) found.lastName = data.lastName;
    found.fullName = `${found.firstName || ''} ${found.lastName || ''}`.trim() || found.email;
  }
  return { success: true };
}

/**
 * Admin Action: Update Business Profile details
 */
export async function updateAdminBusinessProfile(
  userId: string,
  data: Partial<BusinessProfile>
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const dbRow: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (data.businessName !== undefined) dbRow.business_name = data.businessName;
      if (data.entityType !== undefined) dbRow.entity_type = data.entityType;
      if (data.state !== undefined) dbRow.state = data.state;
      if (data.industry !== undefined) dbRow.industry = data.industry;
      if (data.businessAge !== undefined) dbRow.business_age = data.businessAge;
      if (data.hasEIN !== undefined) dbRow.has_ein = data.hasEIN;
      if (data.hasBusinessBankAccount !== undefined) dbRow.has_business_bank_account = data.hasBusinessBankAccount;
      if (data.hasWebsite !== undefined) dbRow.has_website = data.hasWebsite;
      if (data.hasBusinessPhone !== undefined) dbRow.has_business_phone = data.hasBusinessPhone;
      if (data.hasBusinessEmail !== undefined) dbRow.has_business_email = data.hasBusinessEmail;
      if (data.hasBusinessAddress !== undefined) dbRow.has_business_address = data.hasBusinessAddress;
      if (data.hasBusinessLicense !== undefined) dbRow.has_business_license = data.hasBusinessLicense;
      if (data.hasDuns !== undefined) dbRow.has_duns = data.hasDuns;
      if (data.hasBusinessCreditProfile !== undefined) dbRow.has_business_credit_profile = data.hasBusinessCreditProfile;
      if (data.annualRevenueRange !== undefined) dbRow.annual_revenue_range = data.annualRevenueRange;
      if (data.personalCreditRange !== undefined) dbRow.personal_credit_range = data.personalCreditRange;
      if (data.fundingAmount !== undefined) dbRow.funding_amount = data.fundingAmount;

      const { error } = await supabase
        .from('businesses')
        .update(dbRow)
        .eq('user_id', userId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  const found = DEMO_ADMIN_USERS.find((u) => u.userId === userId || u.id === userId);
  if (found && data.businessName) {
    found.businessName = data.businessName;
    if (data.entityType) found.entityType = data.entityType;
    if (data.state) found.state = data.state;
    if (data.industry) found.industry = data.industry;
  }
  return { success: true };
}

