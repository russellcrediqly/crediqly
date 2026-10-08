import type { BusinessProfile } from '../../types/business.ts';
import type { RoadmapResult } from '../roadmap/types.ts';
import type { Product, RecommendedProduct, MatchLabel, MatchIndicator, BankingFitInfo } from '../../types/product.ts';

/**
 * Normalizes provider name for robust deduplication across catalogs.
 * Ensures providers like Relay, Mercury, Chase, Bluevine, etc. never appear twice.
 */
export function getNormalizedProviderKey(name: string, category: string, slug?: string): string {
  const clean = `${name || ''} ${slug || ''}`.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.includes('relay')) return 'relay';
  if (clean.includes('mercury')) return 'mercury';
  if (clean.includes('bluevine')) return 'bluevine';
  if (clean.includes('chase')) return 'chase';
  if (clean.includes('brex')) return 'brex';
  if (clean.includes('nav')) return 'nav';
  if (clean.includes('grainger')) return 'grainger';
  if (clean.includes('quill')) return 'quill';
  if (clean.includes('uline')) return 'uline';
  if (clean.includes('crownoffice')) return 'crown_office';
  if (clean.includes('summa')) return 'summa';
  if (clean.includes('creativeoffice')) return 'creative_office';
  if (clean.includes('ceocreative')) return 'the_ceo_creative';
  if (clean.includes('shirtsy')) return 'shirtsy';
  if (clean.includes('divvy') || clean.includes('billcom') || clean.includes('billspend')) return 'bill_corp';
  return `${category}:${clean}`;
}

/**
 * Deterministic rule-based product recommendation engine.
 *
 * Evaluates the user's business profile (age, entity type, state, industry,
 * revenue, credit tier, tradelines), roadmap milestone progress, and readiness score.
 *
 * Strictly zero AI / zero machine learning dependency.
 * Compliance Note: All outputs are educational estimates based on user-reported data.
 */
export function getRecommendedProducts(
  business: Partial<BusinessProfile> | null,
  roadmap: RoadmapResult | null,
  products: Product[],
  fundingReadinessScore: number = 50
): RecommendedProduct[] {
  const p = business || {};
  const activeProducts = products.filter((prod) => prod.status === 'active');

  const hasEIN = p.hasEIN === 'yes';
  const hasBank = p.hasBusinessBankAccount === 'yes';
  const hasCreditProfile = p.hasBusinessCreditProfile === 'yes';
  const hasReportingAccounts = p.hasReportingAccounts === 'yes';
  const entityType = (p.entityType || '').toLowerCase();
  const isFormalEntity = entityType.includes('llc') || entityType.includes('corp') || entityType.includes('inc');

  const isNewBusiness =
    p.businessAge === 'less_than_6_months' ||
    p.businessAge === '6_to_12_months' ||
    p.businessAge === 'Less than 6 months' ||
    p.businessAge === 'Less than 3 months' ||
    !p.businessAge;

  const isEstablished =
    p.businessAge === '1_to_2_years' ||
    p.businessAge === '2_plus_years' ||
    p.businessAge === '1–2 years' ||
    p.businessAge === '2–5 years' ||
    p.businessAge === '3+ years' ||
    p.businessAge === '5+ years';

  const hasStrongPersonalCredit =
    p.personalCreditRange === '720_plus' ||
    p.personalCreditRange === '680_to_719' ||
    p.personalCreditRange === '720+' ||
    p.personalCreditRange === '680–719';

  const hasLimitedPersonalCredit =
    p.personalCreditRange === 'below_600' ||
    p.personalCreditRange === '600_to_679' ||
    p.personalCreditRange === 'Under 600' ||
    p.personalCreditRange === '600–639';

  const revenueStr = (p.annualRevenueRange || '').toLowerCase();
  const hasSubstantialRevenue =
    revenueStr.includes('100,000') ||
    revenueStr.includes('250,000') ||
    revenueStr.includes('500,000') ||
    revenueStr.includes('1m');

  const completedMilestones = new Set(
    roadmap?.allTasks?.filter((t) => t.status === 'completed').map((t) => t.key) || []
  );
  const currentStage = roadmap?.nextBestAction?.stage || 'foundation';

  const scored: RecommendedProduct[] = activeProducts.map((prod) => {
    let score = 50; // base score
    let whyThisMatches =
      'Based on the information in your Crediqly profile, this product fits your commercial credit development.';
    let recommendedForYou = 'Selected for your current commercial credit journey.';
    const whatYouMayNeed: string[] = [];
    const nextStepsToImprove: string[] = [];
    let relevantMilestoneId = '01';

    // -------------------------------------------------------------------------
    // 1. Build Prerequisites Checklist
    // -------------------------------------------------------------------------
    if (prod.einRequired) {
      whatYouMayNeed.push('Active Employer Identification Number (EIN)');
    }
    if (prod.businessBankAccountRequired) {
      whatYouMayNeed.push('Dedicated commercial business checking account');
    }
    if (prod.businessWebsiteRequired) {
      whatYouMayNeed.push('Active business website & matching email address');
    }
    if (prod.personalGuaranteeRequired === 'no') {
      whatYouMayNeed.push('No personal guarantee required (business qualification only)');
    } else if (prod.personalGuaranteeRequired === 'yes') {
      whatYouMayNeed.push(
        prod.personalCreditRequirement
          ? `Personal credit score: ${prod.personalCreditRequirement}`
          : 'Personal guarantee & credit evaluation required'
      );
    }
    if (prod.typicalBusinessAge && prod.typicalBusinessAge !== 'No minimum') {
      whatYouMayNeed.push(`Time in business: ${prod.typicalBusinessAge}`);
    }
    if (prod.minimumPurchase && prod.category === 'net_30') {
      whatYouMayNeed.push(`Initial qualifying order: ${prod.minimumPurchase}`);
    }
    if (whatYouMayNeed.length === 0) {
      whatYouMayNeed.push('Valid business formation documents (LLC or Corporation)');
      whatYouMayNeed.push('Valid commercial address (no residential PO boxes)');
    }

    // -------------------------------------------------------------------------
    // 2. Category Matching Rules
    // -------------------------------------------------------------------------
    if (prod.category === 'business_banking') {
      relevantMilestoneId = '02';
      if (!hasBank) {
        score += 45;
        recommendedForYou = 'High Priority: Foundational Business Banking';
        whyThisMatches =
          'Your profile indicates you need a dedicated commercial bank account. Separating business and personal finances is a strict underwriting requirement for lenders.';
      } else {
        score -= 20;
        recommendedForYou = 'Secondary Account: Cash Management & Reserves';
        whyThisMatches =
          'You already reported an active business checking account. You can use this for secondary cash management, tax reserves, or multi-entity budgeting.';
      }
    } else if (prod.category === 'business_services') {
      relevantMilestoneId = '01';
      if (!hasEIN || !isFormalEntity) {
        score += 45;
        recommendedForYou = 'Foundational Entity Setup';
        whyThisMatches =
          'Establishing your formal legal entity and obtaining a federal EIN is the first requirement before commercial credit bureaus track your business.';
      } else {
        score += 15;
        recommendedForYou = 'Operational Compliance Support';
        whyThisMatches =
          'Maintains state good standing and statutory compliance as your business scales towards commercial financing.';
      }
    } else if (prod.category === 'net_30') {
      relevantMilestoneId = '07';
      if (!hasReportingAccounts || !hasCreditProfile) {
        score += 40;
        recommendedForYou = 'Tier-1 Foundational Tradeline';
        whyThisMatches =
          'Vendor trade credit accounts report 30-day payment history directly to commercial bureaus without requiring prior credit history or a personal guarantee.';
      } else if (hasReportingAccounts && isNewBusiness) {
        score += 30;
        recommendedForYou = 'Expanding Tradeline Depth';
        whyThisMatches =
          'Adding active reporting vendor tradelines strengthens payment depth and builds composite score resilience across D&B and Experian.';
      } else {
        score += 20;
        recommendedForYou = 'Operating Expense Tradeline';
        whyThisMatches =
          'Provides flexible 30-day payment terms for everyday operating supplies while maintaining consistent monthly bureau reporting.';
      }
    } else if (prod.category === 'business_credit_builders') {
      relevantMilestoneId = '06';
      if (!hasCreditProfile) {
        score += 40;
        recommendedForYou = 'Bureau File Activation';
        whyThisMatches =
          'Reports commercial trade payment experiences directly to Dun & Bradstreet, Experian Commercial, and Equifax Business to establish your initial credit file.';
      } else if (!hasReportingAccounts) {
        score += 35;
        recommendedForYou = 'Commercial Credit History Builder';
        whyThisMatches =
          'Adds regular installment and recurring service payments to your commercial file to increase tradeline count.';
      } else {
        score += 15;
        recommendedForYou = 'Credit Depth Enhancement';
        whyThisMatches =
          'Augments your existing reporting tradelines to reach institutional credit depth targets (5+ reporting accounts).';
      }
    } else if (prod.category === 'business_credit_cards') {
      relevantMilestoneId = '10';
      if (!hasBank) {
        score -= 35;
        whyThisMatches =
          'Commercial card issuers require an active dedicated business bank account. Establish your business banking first.';
        nextStepsToImprove.push('Milestone #02: Establish dedicated commercial business checking');
      } else if (!hasCreditProfile && !hasStrongPersonalCredit && prod.personalGuaranteeRequired === 'yes') {
        score -= 25;
        whyThisMatches =
          'Revolving commercial cards requiring a personal guarantee look for established commercial history or a personal credit score above 680.';
        nextStepsToImprove.push('Milestone #07: Build 3+ Tier-1 Net-30 vendor tradelines first');
        nextStepsToImprove.push('Milestone #10: Maintain revolving utilization below 30%');
      } else if (prod.personalGuaranteeRequired === 'no') {
        if (isEstablished || fundingReadinessScore >= 65 || hasSubstantialRevenue) {
          score += 40;
          recommendedForYou = 'Corporate Charge Card (No PG)';
          whyThisMatches =
            'Your operating profile makes corporate cards evaluated on business cash balance and revenue rather than owner personal credit a strong match.';
        } else {
          score += 20;
          recommendedForYou = 'Cash-Flow Evaluated Card';
          whyThisMatches =
            'Corporate card that evaluates monthly business bank deposits rather than personal credit score.';
        }
      } else if (hasStrongPersonalCredit || fundingReadinessScore >= 70) {
        score += 35;
        recommendedForYou = 'Revolving Commercial Card';
        whyThisMatches =
          'Your reported credit standing and readiness progress position you well for revolving business rewards cards and cash-flow flexibility.';
      } else if (hasReportingAccounts) {
        score += 25;
        recommendedForYou = 'Tier-2 Commercial Credit Card';
        whyThisMatches =
          'Your active reporting tradelines provide verifiable commercial payment history that supports card approval.';
      }
    } else if (prod.category === 'net_60') {
      relevantMilestoneId = '08';
      if (hasReportingAccounts && (isEstablished || fundingReadinessScore >= 60)) {
        score += 35;
        recommendedForYou = 'Tier-2 Extended Payment Terms';
        whyThisMatches =
          'With established trade lines, your business can leverage extended 60-day vendor credit to preserve cash flow and expand credit limits.';
      } else {
        score -= 15;
        whyThisMatches =
          'Net-60 vendor terms usually require 6+ months in business and prior prompt payment history on Tier-1 Net-30 accounts.';
        nextStepsToImprove.push('Milestone #07: Build 3+ reporting Tier-1 Net-30 tradelines first');
        nextStepsToImprove.push('Milestone #08: Demonstrate 60+ days of prompt invoice payment');
      }
    }

    // -------------------------------------------------------------------------
    // 3. Time in Business, Entity Type & Personal Credit Adjustments
    // -------------------------------------------------------------------------
    if (isNewBusiness) {
      if (prod.typicalBusinessAge === 'No minimum') {
        score += 10;
      } else if (prod.typicalBusinessAge?.includes('6+') || prod.typicalBusinessAge?.includes('1+')) {
        score -= 20;
        nextStepsToImprove.push('Milestone #13: Reach 6+ months of operational entity age');
      }
    }

    if (hasLimitedPersonalCredit && prod.personalGuaranteeRequired === 'no') {
      score += 15;
    } else if (hasLimitedPersonalCredit && prod.personalGuaranteeRequired === 'yes') {
      score -= 20;
    }

    if (fundingReadinessScore >= 70) {
      if (prod.category === 'business_credit_cards' || prod.category === 'net_60') {
        score += 10;
      }
    } else if (fundingReadinessScore < 45) {
      if (prod.category === 'business_credit_cards') {
        score -= 15;
      }
    }

    // Roadmap synergy & priority
    if (prod.recommendedStage === currentStage) {
      score += 10;
    }
    if (prod.featured) {
      score += 5;
    }
    if (prod.priority === 1) {
      score += 15;
    } else if (prod.priority === 3) {
      score -= 15;
    }

    // -------------------------------------------------------------------------
    // 4. Match Label Classification (Never fake approval)
    // -------------------------------------------------------------------------
    let matchLabel: MatchLabel;
    let matchIndicator: MatchIndicator;

    if (score >= 75) {
      matchLabel = 'Strong Match';
      matchIndicator = 'strong';
    } else if (score >= 50) {
      // Use Preliminary Match if foundational items are unverified
      if (!hasBank || !hasCreditProfile || p.personalCreditRange === 'not_sure') {
        matchLabel = 'Preliminary Match';
      } else {
        matchLabel = 'Potential Match';
      }
      matchIndicator = 'possible';
    } else {
      matchLabel = 'Not Recommended Yet';
      matchIndicator = 'improve_readiness';
      if (nextStepsToImprove.length === 0) {
        nextStepsToImprove.push('Establish active commercial bureau file and tier-1 vendor lines');
        nextStepsToImprove.push('Verify commercial entity standing and dedicated business banking');
      }
    }

    // -------------------------------------------------------------------------
    // 5. What to Consider Narrative
    // -------------------------------------------------------------------------
    const reportingText =
      prod.reportingBureaus && prod.reportingBureaus.length > 0
        ? `Reports to ${prod.reportingBureaus.join(', ')}.`
        : 'Direct commercial relationship account.';
    const termsText = prod.terms ? `Terms: ${prod.terms}.` : '';
    const pgText =
      prod.personalGuaranteeRequired === 'no'
        ? 'No personal guarantee.'
        : 'Requires personal guarantee.';
    const whatToConsider = `${reportingText} ${termsText} ${pgText} Verify current provider eligibility guidelines and terms before submitting your application.`.trim();

    // -------------------------------------------------------------------------
    // 6. Banking Fit Specialization
    // -------------------------------------------------------------------------
    let bankingFit: BankingFitInfo | undefined;
    if (prod.category === 'business_banking') {
      const pName = (prod.name || '').toLowerCase();
      if (pName.includes('mercury')) {
        bankingFit = {
          whyFits:
            'Digital commercial banking designed for modern startups, tech companies, and online businesses. Zero monthly maintenance fees and no minimum deposit.',
          suitableStage: 'Foundation Stage (Day 1) through Growth & Scale',
          foundationSupport:
            'Instantly separates personal and business finances, provides physical & virtual debit cards, and validates commercial entity legitimacy.',
          fundingPrepSupport:
            'Provides automated PDF bank statements and Plaid accounting integrations required by venture debt and commercial working capital lenders.',
        };
      } else if (pName.includes('relay')) {
        bankingFit = {
          whyFits:
            'Multi-account cash budgeting platform built for small businesses (Profit First style) with up to 20 checking accounts and zero maintenance fees.',
          suitableStage: 'Foundation Stage (Day 1) to Funding Preparation',
          foundationSupport:
            'Enables dedicated sub-accounts for taxes, payroll, and reserves to keep business cash flow completely organized from day one.',
          fundingPrepSupport:
            'Generates clear, multi-account monthly statements that demonstrate prudent cash-flow reserves to institutional underwriters.',
        };
      } else if (pName.includes('bluevine')) {
        bankingFit = {
          whyFits:
            'High-yield commercial checking (up to 2.0% APY on operating balances) with direct pathway to revolving commercial lines of credit.',
          suitableStage: 'Foundation Stage to Working Capital Preparation',
          foundationSupport:
            'Builds active commercial deposit history and daily operating liquidity trails with zero monthly fees.',
          fundingPrepSupport:
            'Provides an integrated bridge into Bluevine commercial lines of credit as monthly business deposits season.',
        };
      } else if (pName.includes('chase')) {
        bankingFit = {
          whyFits:
            'Established national branch network with integrated merchant card acceptance (QuickAccept) and full Treasury management solutions.',
          suitableStage: 'Foundation through Institutional Capital',
          foundationSupport:
            'Provides in-person branch relationship banking, certified merchant processing, and full commercial deposit verification.',
          fundingPrepSupport:
            'Depository history with Chase significantly improves underwriting viability for Tier-3 Chase Ink credit cards and SBA 7(a) loan packages.',
        };
      } else {
        bankingFit = {
          whyFits:
            'Dedicated commercial checking account designed to separate business operations from personal owner finances.',
          suitableStage: 'Foundation Stage (Essential Day 1)',
          foundationSupport:
            'Eliminates commingling of personal and business funds, preserves corporate veil protection, and verifies state entity legitimacy.',
          fundingPrepSupport:
            'Generates 3+ months of verified commercial bank statements required by 95% of business lenders and financing providers.',
        };
      }
    }

    return {
      ...prod,
      matchScore: score,
      matchLabel,
      matchIndicator,
      recommendationReason: whyThisMatches,
      recommendedForYou,
      whyThisMatches,
      whatYouMayNeed,
      whatToConsider,
      bankingFit,
      nextStepsToImprove: nextStepsToImprove.length > 0 ? nextStepsToImprove : undefined,
      relevantMilestoneId,
    };
  });

  // ---------------------------------------------------------------------------
  // 7. Strict Provider Deduplication Pass
  // ---------------------------------------------------------------------------
  const seenProviders = new Set<string>();
  const deduplicated: RecommendedProduct[] = [];

  // Sort candidates first: highest score first, then priority
  const sorted = scored.sort((a, b) => b.matchScore - a.matchScore || (a.priority || 2) - (b.priority || 2));

  for (const item of sorted) {
    const key = getNormalizedProviderKey(item.name, item.category, item.slug);
    if (!seenProviders.has(key)) {
      seenProviders.add(key);
      deduplicated.push(item);
    }
  }

  return deduplicated;
}
