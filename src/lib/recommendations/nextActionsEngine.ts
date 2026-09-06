import type { BusinessProfile } from '@/types/business';
import type { RoadmapResult, RoadmapTask } from '@/lib/roadmap/types';
import type { FundingReadinessResult } from '@/types/funding';

export type ActionPriority = 'High' | 'Medium' | 'Low';

export interface RecommendedAction {
  id: string;
  order: number; // 1, 2, 3
  title: string;
  priority: ActionPriority;
  explanation: string;
  whyItMatters: string;
  potentialImpact: string;
  actionLabel: string;
  actionHref: string;
  roadmapTaskKey: string;
  isCompleted: boolean;
  category: 'information' | 'banking' | 'credit' | 'funding' | 'roadmap';
}

/**
 * Generates the top 3 personalized recommended next actions for the customer.
 * Prioritizes:
 * 1. Missing critical information
 * 2. Readiness weaknesses (banking & cash flow)
 * 3. Business credit weaknesses
 * 4. Funding preparation
 * 5. Existing roadmap steps
 *
 * Automatically excludes completed actions and dynamically surfaces the next actions.
 */
export function getTopRecommendedActions(
  profile: Partial<BusinessProfile> | null,
  roadmap: RoadmapResult,
  fundingReadiness?: FundingReadinessResult | null,
  actionCompletions?: Record<string, any>
): RecommendedAction[] {
  const p = profile || {};
  const completions: Record<string, any> = {
    ...((roadmap as any)?.userCompletions || {}),
    ...(actionCompletions || {}),
  };

  // Helper to check if a specific task key or action ID is marked completed
  const isTaskCompleted = (taskKey: string, actionId?: string): boolean => {
    if (completions[taskKey]) return true;
    if (actionId && completions[actionId]) return true;
    const task = roadmap?.allTasks?.find((t) => t.key === taskKey);
    if (!task) return false;
    return task.status === 'completed' || Boolean(task.completedAt) || task.satisfiedByProfile;
  };

  // Candidate pool of potential recommendations in strict priority order
  const candidates: Array<Omit<RecommendedAction, 'order' | 'isCompleted'>> = [];

  // ==========================================================================
  // 1. MISSING CRITICAL INFORMATION
  // ==========================================================================

  // 1A. Incomplete Business Profile
  if (!p.profileCompleted || !p.entityType || p.entityType.trim() === '') {
    candidates.push({
      id: 'rec_complete_profile',
      title: 'Complete Business Profile',
      priority: 'High',
      explanation: 'Your profile is missing foundational business details needed to calculate your live credit scores.',
      whyItMatters: 'Commercial bureaus and automated underwriting systems require verified legal entity details to establish corporate credit files.',
      potentialImpact: 'Could improve your readiness assessment.',
      actionLabel: 'Complete Profile',
      actionHref: '/onboarding',
      roadmapTaskKey: 'task_entity',
      category: 'information',
    });
  }

  // 1B. Missing Federal EIN
  if (p.hasEIN !== 'yes') {
    candidates.push({
      id: 'rec_ein',
      title: 'Establish Federal EIN',
      priority: 'High',
      explanation: p.hasEIN === 'not_sure'
        ? 'Confirm whether your business has a Federal Employer Identification Number assigned.'
        : 'Obtain an official Federal EIN from the IRS for your business entity.',
      whyItMatters: 'An EIN is the fundamental corporate tax identifier required to separate commercial credit reporting from your personal SSN.',
      potentialImpact: 'Essential for commercial bureau credit building.',
      actionLabel: 'View EIN Step',
      actionHref: '/roadmap?filter=foundation',
      roadmapTaskKey: 'task_ein',
      category: 'information',
    });
  }

  // ==========================================================================
  // 2. READINESS WEAKNESSES (BANKING & CASH FLOW)
  // ==========================================================================

  // 2A. Business Bank Account Missing or Unsure
  if (p.hasBusinessBankAccount !== 'yes') {
    candidates.push({
      id: 'rec_bank_account',
      title: 'Establish Business Banking',
      priority: 'High',
      explanation: p.hasBusinessBankAccount === 'not_sure'
        ? 'Confirm complete separation of your commercial business account from personal accounts.'
        : 'Open a dedicated commercial checking account in your legal business name.',
      whyItMatters: 'Underwriters require clear verification that business operations and cash flow are cleanly separated from personal finances.',
      potentialImpact: 'Could improve your funding readiness.',
      actionLabel: 'View Banking Step',
      actionHref: '/roadmap?filter=foundation',
      roadmapTaskKey: 'task_bank_account',
      category: 'banking',
    });
  }

  // 2B. Deposit Volume & Cash Flow Consistency
  if (p.annualRevenueRange === 'Pre-revenue' || p.annualRevenueRange === 'Under $10,000') {
    candidates.push({
      id: 'rec_consistent_deposits',
      title: 'Maintain Consistent Business Deposits',
      priority: 'Medium',
      explanation: 'Your current profile indicates early-stage commercial cash flow or pre-revenue operations.',
      whyItMatters: 'Lenders review 3–6 months of steady business bank deposits to establish baseline debt-service coverage before approving loans.',
      potentialImpact: 'Could improve your funding readiness.',
      actionLabel: 'View Deposit Guidance',
      actionHref: '/roadmap?filter=financial',
      roadmapTaskKey: 'task_banking_separation',
      category: 'banking',
    });
  }

  // ==========================================================================
  // 3. BUSINESS CREDIT WEAKNESSES
  // ==========================================================================

  // 3A. Business Credit Profile
  if (p.hasBusinessCreditProfile !== 'yes') {
    candidates.push({
      id: 'rec_credit_profile',
      title: 'Work on Building Business Credit',
      priority: 'High',
      explanation: 'Your business does not yet have an active commercial credit file with Dun & Bradstreet, Experian, or Equifax.',
      whyItMatters: 'Without an active commercial file, automated lender underwriting algorithms cannot verify your creditworthiness.',
      potentialImpact: 'Activates commercial credit reporting.',
      actionLabel: 'Establish Credit File',
      actionHref: '/roadmap?filter=credit_foundation',
      roadmapTaskKey: 'task_profile_bureau',
      category: 'credit',
    });
  }

  // 3B. Business Credit Depth / Reporting Accounts
  if (p.hasReportingAccounts !== 'yes' || p.businessCreditAccountCount === '1-3' || !p.businessCreditAccountCount) {
    candidates.push({
      id: 'rec_credit_depth',
      title: 'Add a Reporting Business Tradeline',
      priority: 'High',
      explanation: 'Your current profile indicates limited business credit depth and few active reporting vendor tradelines.',
      whyItMatters:
        'Reporting tradelines can contribute business credit payment information to business credit files. Not every vendor reports, so customers should verify the provider\'s current reporting terms.',
      potentialImpact: 'May strengthen your business credit profile.',
      actionLabel: 'View Recommended Tradelines',
      actionHref: '/products?category=net_30',
      roadmapTaskKey: 'task_reporting_accounts',
      category: 'credit',
    });
  }

  // 3C. Business Credit Card
  if (p.hasBusinessCreditCard !== 'yes') {
    candidates.push({
      id: 'rec_credit_card',
      title: 'Establish Revolving Business Credit Line',
      priority: 'Medium',
      explanation: 'Your business does not currently utilize a dedicated revolving commercial credit card.',
      whyItMatters: 'A revolving credit line demonstrates ongoing credit management and adds positive tradeline depth to your commercial bureau files.',
      potentialImpact: 'Could improve your credit depth.',
      actionLabel: 'Explore Business Cards',
      actionHref: '/products?category=business_credit_cards',
      roadmapTaskKey: 'task_build_business_card',
      category: 'credit',
    });
  }

  // 3D. Credit Utilization / Personal Standing Review
  if (
    p.personalCreditRange === 'Under 600' ||
    p.personalCreditRange === '600–639' ||
    p.personalCreditRange === 'Fair (640–679)'
  ) {
    candidates.push({
      id: 'rec_utilization_review',
      title: 'Review Credit Utilization',
      priority: 'Medium',
      explanation: 'Your personal credit tier indicates an opportunity to optimize revolving utilization ratios.',
      whyItMatters: 'Many small business credit providers evaluate owner credit scores as a personal guarantee factor during early growth stages.',
      potentialImpact: 'Could improve underwriting approval flexibility.',
      actionLabel: 'View Credit Strategy',
      actionHref: '/roadmap?filter=credit_building',
      roadmapTaskKey: 'task_monitor_scores',
      category: 'credit',
    });
  }

  // 3E. Commercial Contact Foundation (Address / Phone / Website)
  if (p.hasWebsite !== 'yes' || p.hasBusinessPhone !== 'yes' || p.hasBusinessAddress !== 'yes') {
    candidates.push({
      id: 'rec_commercial_presence',
      title: 'Verify Commercial Presence',
      priority: 'Medium',
      explanation: 'Your commercial contact footprint (website, phone, or physical address) has pending verification items.',
      whyItMatters: 'Underwriters check 411 directory assistance and verify web domains to confirm operational legitimacy.',
      potentialImpact: 'Strengthens foundational compliance.',
      actionLabel: 'Verify Presence',
      actionHref: '/roadmap?filter=foundation',
      roadmapTaskKey: 'task_website',
      category: 'information',
    });
  }

  // ==========================================================================
  // 4. FUNDING PREPARATION
  // ==========================================================================

  const score = fundingReadiness?.score ?? 0;

  // 4A. Low or Developing Funding Readiness
  if (score < 70) {
    candidates.push({
      id: 'rec_funding_readiness',
      title: 'Improve Readiness Before Applying',
      priority: 'Medium',
      explanation: 'Your current commercial profile is developing toward optimal lender underwriting criteria.',
      whyItMatters: 'Applying for capital before reaching target readiness thresholds increases the likelihood of strict terms or initial declines.',
      potentialImpact: 'Could improve your readiness.',
      actionLabel: 'Review Readiness Breakdown',
      actionHref: '/readiness',
      roadmapTaskKey: 'task_funding_prep',
      category: 'funding',
    });
  } else {
    // 4B. High Funding Readiness (>= 70)
    candidates.push({
      id: 'rec_review_funding_options',
      title: 'Review Funding Options',
      priority: 'Medium',
      explanation: 'Your business has established a solid commercial credit and compliance baseline.',
      whyItMatters: 'Comparing qualified financing products, commercial lines of credit, and partner options ensures the best borrowing terms.',
      potentialImpact: 'Unlocks tailored funding matches.',
      actionLabel: 'Explore Funding Options',
      actionHref: '/funding',
      roadmapTaskKey: 'task_explore_financing',
      category: 'funding',
    });
  }

  // 4C. Funding Target Articulation
  if (!p.fundingAmount || p.fundingAmount.trim() === '') {
    candidates.push({
      id: 'rec_funding_target',
      title: 'Define Target Funding Goals',
      priority: 'Low',
      explanation: 'Your profile has not yet articulated a specific capital amount or commercial use-case.',
      whyItMatters: 'Lenders evaluate debt service capacity against clear, documented capital allocation plans.',
      potentialImpact: 'Refines personalized funding recommendations.',
      actionLabel: 'Set Funding Goal',
      actionHref: '/business',
      roadmapTaskKey: 'task_funding_target',
      category: 'funding',
    });
  }

  // ==========================================================================
  // 5. EXISTING ROADMAP STEPS (FALLBACK / SUPPLEMENT)
  // ==========================================================================
  if (roadmap?.allTasks) {
    for (const task of roadmap.allTasks) {
      if (task.status !== 'completed' && !isTaskCompleted(task.key)) {
        // Ensure no duplicates with existing candidate IDs or roadmap keys
        const exists = candidates.some(
          (c) => c.roadmapTaskKey === task.key || c.id === task.key
        );
        if (!exists) {
          candidates.push({
            id: `task_${task.key}`,
            title: task.title,
            priority: (task.priority.charAt(0).toUpperCase() + task.priority.slice(1)) as ActionPriority,
            explanation: task.whatToDo?.[0] || 'Next logical milestone in your personalized 6-stage roadmap.',
            whyItMatters: task.whyItMatters || 'Completing this step strengthens your commercial business credit standing.',
            potentialImpact: 'Could improve your readiness.',
            actionLabel: task.actionLabel || 'View Step',
            actionHref: task.actionHref || '/roadmap',
            roadmapTaskKey: task.key,
            category: 'roadmap',
          });
        }
      }
    }
  }

  // ==========================================================================
  // FILTER OUT COMPLETED ACTIONS & SLICE TOP 3
  // ==========================================================================
  const uncompleted = candidates.filter((action) => !isTaskCompleted(action.roadmapTaskKey, action.id));

  // Take top 3 and assign order
  const top3 = uncompleted.slice(0, 3).map((action, index) => ({
    ...action,
    order: index + 1,
    isCompleted: false,
  }));

  return top3;
}
