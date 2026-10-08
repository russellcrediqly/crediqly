import type { BusinessProfile } from '@/types/business';
import type { FundingProduct } from '@/types/fundingProduct';
import type { SafeCustomerAIContext } from '@/types/aiMentor';
import { calculateReadiness, calculateProfileCompletion } from '@/lib/scoring';
import { calculateFundingReadiness } from '@/lib/readiness/fundingEngine';
import { calculateMilestoneReadiness } from '@/lib/readiness/readinessMilestoneEngine';
import { calculateCustomerJourney } from '@/lib/roadmap/customerJourney';
import { getTopRecommendedActions } from '@/lib/recommendations/nextActionsEngine';
import { getPersonalizedFundingMatches } from '@/lib/funding/personalizedMatchesEngine';
import { evaluateMajorReadinessAreas } from '@/lib/readiness/fundingFactors';
import { sanitizeCustomerContext } from '@/lib/ai/mentorPrivacySanitizer';
import { generateDeterministicAdvisoryPrep } from '@/lib/ai/mentorFallbackEngine';

export interface BuildContextOptions {
  business: BusinessProfile | null | undefined;
  completedTasks?: string[];
  fundingProducts?: FundingProduct[];
  subscriptionTier?: 'Free' | 'Pro' | 'Premium Advisory';
  isAdvisory?: boolean;
  roadmap?: any;
}

/**
 * Server-Side Customer AI Context Builder
 * 
 * Safely assembles all six dimensions (Business, Credit, Funding, Progress, Recommendations, Subscription)
 * directly from authoritative database records and deterministic engines.
 * 
 * Strict Redaction:
 * - NEVER sends passwords, auth tokens, Stripe secrets, or session keys
 * - NEVER sends Social Security Numbers (SSNs) or personal payment cards
 * - NEVER sends bank account numbers or routing credentials
 * - NEVER sends full raw financial document scans
 */
export function buildSafeCustomerAIContext(options: BuildContextOptions): SafeCustomerAIContext {
  const {
    business,
    completedTasks = business?.completedDbTasks || [],
    fundingProducts = [],
    subscriptionTier = options.isAdvisory ? 'Premium Advisory' : 'Free',
    isAdvisory = subscriptionTier === 'Premium Advisory',
    roadmap,
  } = options;

  const safeBusiness = business || null;

  // 1. Authoritative Deterministic Calculations
  const readiness = calculateReadiness(safeBusiness);
  const fundingReadiness = calculateFundingReadiness(safeBusiness);
  const milestoneReadiness = calculateMilestoneReadiness(safeBusiness, completedTasks);
  const majorAreas = evaluateMajorReadinessAreas(safeBusiness || {});
  const profileCompletion = calculateProfileCompletion(safeBusiness);

  // Calculate journey stage
  const customerJourney = calculateCustomerJourney(
    safeBusiness,
    readiness.businessReadiness,
    readiness.creditReadiness,
    fundingReadiness,
    0
  );

  // Calculate top recommended next actions
  const topActions = getTopRecommendedActions(safeBusiness, roadmap, fundingReadiness);

  // Calculate personalized funding matches
  const personalizedMatches = getPersonalizedFundingMatches(
    safeBusiness,
    fundingReadiness.score,
    fundingProducts
  );

  const matchesList = [];
  if (personalizedMatches.strongMatch) {
    matchesList.push({
      tier: personalizedMatches.strongMatch.badgeLabel,
      category: personalizedMatches.strongMatch.category,
      range: personalizedMatches.strongMatch.estimatedRange,
    });
  }
  if (personalizedMatches.possibleMatch) {
    matchesList.push({
      tier: personalizedMatches.possibleMatch.badgeLabel,
      category: personalizedMatches.possibleMatch.category,
      range: personalizedMatches.possibleMatch.estimatedRange,
    });
  }
  if (personalizedMatches.improveReadinessMatch) {
    matchesList.push({
      tier: personalizedMatches.improveReadinessMatch.badgeLabel,
      category: personalizedMatches.improveReadinessMatch.category,
      range: personalizedMatches.improveReadinessMatch.estimatedRange,
    });
  }

  // Format funding purpose safely
  const rawPurpose = Array.isArray(business?.fundingPurpose)
    ? business.fundingPurpose.join(', ')
    : business?.fundingPurpose || '';

  // Extract Foundation Score
  let foundationScore = 0;
  if (business) {
    let fCount = 0;
    if (business.hasEIN === 'yes') fCount++;
    if (business.hasBusinessBankAccount === 'yes') fCount++;
    if (business.hasWebsite === 'yes') fCount++;
    if (business.hasBusinessPhone === 'yes') fCount++;
    if (business.hasBusinessEmail === 'yes') fCount++;
    if (business.hasBusinessAddress === 'yes') fCount++;
    if (business.hasDuns === 'yes') fCount++;
    foundationScore = Math.round((fCount / 7) * 100);
  }

  // Unprocessed safe structure
  const rawSafeContext: SafeCustomerAIContext = {
    // 1. BUSINESS
    businessName: business?.businessName,
    entityType: business?.entityType,
    state: business?.state,
    industry: business?.industry,
    businessAge: business?.businessAge,
    businessFoundationStatus: {
      hasEIN: business?.hasEIN,
      hasBusinessBankAccount: business?.hasBusinessBankAccount,
      hasWebsite: business?.hasWebsite,
      hasBusinessPhone: business?.hasBusinessPhone,
      hasBusinessEmail: business?.hasBusinessEmail,
      hasBusinessAddress: business?.hasBusinessAddress,
      hasBusinessLicense: business?.hasBusinessLicense,
      hasDuns: business?.hasDuns,
      foundationScore,
    },

    // 2. CREDIT
    businessCreditProfileStatus: business?.hasBusinessCreditProfile,
    hasBusinessCreditProfile: business?.hasBusinessCreditProfile,
    knowsBusinessCreditScore: business?.knowsBusinessCreditScore,
    reportedCreditScore: business?.businessCreditScore,
    businessCreditStatus: business?.hasBusinessCreditProfile,
    numberKnownTradelines: business?.businessCreditAccountCount,
    hasReportingAccounts: business?.hasReportingAccounts,
    hasBusinessCreditCard: business?.hasBusinessCreditCard,
    existingTradelines: [],
    relevantCreditMilestones: milestoneReadiness.items.map((i) => i.definition.title).slice(0, 6),
    completedActions: completedTasks,

    // 3. FUNDING
    annualRevenue: business?.annualRevenueRange,
    revenueRange: business?.annualRevenueRange,
    personalCreditTier: business?.personalCreditRange,
    personalCreditRange: business?.personalCreditRange,
    fundingGoal: rawPurpose,
    desiredFundingAmount: business?.fundingAmount,
    requestedFundingAmount: business?.fundingAmount,
    fundingPurpose: Array.isArray(business?.fundingPurpose) ? business.fundingPurpose : [],
    fundingReadinessScore: milestoneReadiness.score,
    readinessScore: milestoneReadiness.score,
    readinessLevel: milestoneReadiness.currentStage,
    fundingProfileSummary: `${milestoneReadiness.currentStage} stage with ${milestoneReadiness.score}/100 readiness score. Primary category focus: ${matchesList[0]?.category || 'Working Capital'}.`,
    matchedFundingCategories: matchesList.map((m) => m.category),
    fundingMatches: matchesList,

    // 4. PROGRESS
    businessReadinessScore: readiness.businessReadiness.score,
    creditReadinessScore: readiness.creditReadiness.score,
    profileCompleted: Boolean(business?.profileCompleted),
    profileCompletionPercentage: profileCompletion,
    currentJourneyStage: customerJourney.currentStageLabel || '01 — ESTABLISH',
    completedMilestones: completedTasks,
    incompleteMilestones: milestoneReadiness.items.filter((i) => !i.isCompleted).map((i) => i.definition.title),
    nextMilestone: milestoneReadiness.nextMilestone
      ? {
          id: milestoneReadiness.nextMilestone.id,
          title: milestoneReadiness.nextMilestone.title,
          category: milestoneReadiness.nextMilestone.category,
          whyItMatters: milestoneReadiness.nextMilestone.whyItMatters,
        }
      : undefined,
    dependencies: [],
    previousActions: completedTasks.slice(0, 5),
    customerConfirmedActivities: business?.completedDbTasks || [],
    readinessFactors: majorAreas.map((a) => ({
      area: a.name,
      status: a.indicator === 'green' ? 'strong' : a.indicator === 'amber' ? 'good' : 'needs_improvement',
      score: a.indicator === 'green' ? 90 : a.indicator === 'amber' ? 70 : 45,
    })),
    topNextActions: topActions.map((a) => ({
      title: a.title,
      priority: a.priority,
      category: a.category,
    })),

    // 5. RECOMMENDATIONS
    recommendedProducts: (fundingProducts || []).slice(0, 4).map((p) => {
      const reqs = [
        p.minAnnualRevenue ? `Min Rev: ${p.minAnnualRevenue}` : '',
        p.minPersonalCredit ? `Min Credit: ${p.minPersonalCredit}` : '',
      ].filter(Boolean).join(', ');

      return {
        name: p.name,
        category: p.category,
        matchTier: 'Recommended',
        reason: p.description,
        requirements: reqs || 'Standard application requirements',
      };
    }),

    // 6. SUBSCRIPTION
    subscriptionTier,
  };

  // Add Advisory Meeting Prep Context if Premium Advisory
  if (isAdvisory) {
    const advisoryPrep = generateDeterministicAdvisoryPrep(rawSafeContext);
    rawSafeContext.advisoryContext = {
      isAdvisoryMember: true,
      meetingPrepTopics: advisoryPrep.discussionTopics,
      profileStrengths: advisoryPrep.profileStrengths,
      profileWeaknesses: advisoryPrep.profileWeaknesses,
      suggestedAdvisorQuestions: advisoryPrep.suggestedAdvisorQuestions,
    };
  }

  // Pass through strict data sanitizer before returning
  return sanitizeCustomerContext(rawSafeContext);
}
