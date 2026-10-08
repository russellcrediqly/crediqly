import type {
  SafeCustomerAIContext,
  AIMentorResponse,
  AIMentorNextStep,
} from '@/types/aiMentor';

const DISCLAIMER =
  'Educational Guidance: Crediqly AI Mentor provides educational insights based on self-reported profile metrics. It does not guarantee credit approval or specific funding amounts.';

/**
 * Deterministic fallback engine that generates high-precision, data-aware
 * answers from the customer's real metrics if Gemini is offline or unconfigured.
 * Handles all 12 core guidance questions contextually based on live profile data.
 */
export function generateDeterministicAIMentorAnswer(
  question: string,
  context: SafeCustomerAIContext
): AIMentorResponse {
  const q = (question || '').toLowerCase().trim();

  // If customer profile is incomplete, nudge profile completion first
  if (!context.profileCompleted || context.profileCompletionPercentage < 50) {
    return {
      answer: `Your business profile is currently ${context.profileCompletionPercentage}% complete. I recommend answering your remaining foundational questions first so we can accurately evaluate your funding readiness and activate tailored milestones.`,
      nextStep: {
        label: 'Complete Business Profile',
        href: '/onboarding',
        reason: 'Unlock accurate readiness scoring and roadmap',
      },
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
    };
  }

  // --------------------------------------------------------------------------
  // 1. "Explain business credit to me"
  // --------------------------------------------------------------------------
  if (
    q.includes('explain business credit') ||
    q.includes('what is business credit') ||
    q.includes('how does business credit work')
  ) {
    return {
      answer: `Business credit is tied strictly to your company's EIN rather than your personal SSN, reported to commercial bureaus like Dun & Bradstreet, Experian Business, and Equifax. Building separate business credit protects your personal assets and unlocks higher credit limits without relying exclusively on personal guarantees.`,
      nextStep: {
        label: 'Explore Credit Learning Library',
        href: '/learn',
        reason: 'Understand commercial credit bureaus and scoring',
      },
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
    };
  }

  // --------------------------------------------------------------------------
  // 2. "Why should I do this?" / "why this action"
  // --------------------------------------------------------------------------
  if (
    q.includes('why should i do this') ||
    q.includes('why does this matter') ||
    q.includes('why do this')
  ) {
    const topAction = context.topNextActions[0];
    const actionName = topAction ? `"${topAction.title}"` : 'your priority milestone';
    return {
      answer: `Completing ${actionName} satisfies institutional underwriting verification standards. When commercial lenders review an application, having this baseline verified on file significantly reduces underwriting risk and strengthens your readiness score.`,
      nextStep: {
        label: 'View Current Action Details',
        href: '/dashboard#next-actions',
        reason: 'Review underwriter rationale and guidance',
      },
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
    };
  }

  // --------------------------------------------------------------------------
  // 3. "What should I open next?"
  // --------------------------------------------------------------------------
  if (
    q.includes('what should i open next') ||
    q.includes('what to open') ||
    q.includes('open next')
  ) {
    const isNewBusiness =
      context.businessAge === 'Under 6 months' ||
      context.businessAge === '6–12 months' ||
      context.fundingReadinessScore < 40;

    if (isNewBusiness) {
      return {
        answer: `At your current stage, open 2 to 3 Tier-1 Net-30 vendor accounts that report to D&B and Experian (such as Crown Office Supplies or Nav Prime). These starter accounts establish payment history on your EIN with zero personal credit risk.`,
        nextStep: {
          label: 'Browse Tier-1 Tradelines',
          href: '/products?category=net-30',
          reason: 'Open beginner-friendly reporting vendor accounts',
        },
        source: 'deterministic_fallback',
        disclaimer: DISCLAIMER,
      };
    }

    return {
      answer: `With your current foundation, look into Tier-2 revolving business store cards or commercial fuel accounts. These reporting lines demonstrate revolving credit management on your business file without heavy personal credit utilization.`,
      nextStep: {
        label: 'Browse Revolving Credit Lines',
        href: '/products?category=revolving',
        reason: 'Expand commercial credit depth with Tier-2 accounts',
      },
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
    };
  }

  // --------------------------------------------------------------------------
  // 4. "Which tradelines may fit my business?" / "tradelines"
  // --------------------------------------------------------------------------
  if (
    q.includes('tradelines') ||
    q.includes('vendor accounts') ||
    q.includes('which tradeline')
  ) {
    const age = context.businessAge || 'early stage';
    return {
      answer: `For a business with ${age} operating history, prioritize Tier-1 vendor tradelines with low purchase minimums that report monthly to commercial bureaus. Consistent 10-day early invoice payments on these accounts establish an 80+ PAYDEX score.`,
      nextStep: {
        label: 'View Recommended Tradelines',
        href: '/products',
        reason: 'Filter by vendor reporting bureau and terms',
      },
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
    };
  }

  // --------------------------------------------------------------------------
  // 5. "Which business bank account may make sense?" / "bank account"
  // --------------------------------------------------------------------------
  if (
    q.includes('bank account') ||
    q.includes('banking') ||
    q.includes('checking account')
  ) {
    return {
      answer: `Select a dedicated business checking account with zero monthly maintenance fees, sub-accounts for tax reserves, and accounting software integration. Underwriters examine at least 3 consecutive months of clean operating deposits with zero NSF or overdraft incidents.`,
      nextStep: {
        label: 'Review Business Banking Guidance',
        href: '/readiness?tab=business',
        reason: 'Review commercial account underwriting criteria',
      },
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
    };
  }

  // --------------------------------------------------------------------------
  // 6. "What should I avoid right now?" / "avoid" / "mistakes"
  // --------------------------------------------------------------------------
  if (
    q.includes('avoid') ||
    q.includes('mistakes') ||
    q.includes('what not to do')
  ) {
    return {
      answer: `Avoid applying for multiple hard-inquiry personal loans, stacking high-cost merchant cash advances, or co-mingling personal and business funds. Keep your business checking balance consistently above $1,000 and avoid any overdrafts, which underwriters view as an immediate red flag.`,
      nextStep: {
        label: 'Check Underwriting Factors',
        href: '/readiness?tab=funding',
        reason: 'View key factors evaluated by institutional lenders',
      },
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
    };
  }

  // --------------------------------------------------------------------------
  // 7. "Am I ready to look for funding?" / "before applying" / "ready to apply"
  // --------------------------------------------------------------------------
  if (
    q.includes('before applying') ||
    q.includes('ready to apply') ||
    q.includes('ready for funding') ||
    q.includes('ready to look for funding') ||
    q.includes('apply for funding')
  ) {
    const strongMatch = context.fundingMatches.find((m) => m.tier.toLowerCase().includes('strong'));
    const targetCat = strongMatch ? strongMatch.category : 'Business Line of Credit';

    if (context.fundingReadinessScore < 50) {
      return {
        answer: `At ${context.fundingReadinessScore}/100 readiness, focusing on building 3 to 5 reporting tradelines and establishing 3 consistent bank statements will produce much stronger terms than applying prematurely. When ready, a ${targetCat} appears most aligned with your profile.`,
        nextStep: {
          label: 'View Funding Preparation Roadmap',
          href: '/funding',
          reason: 'Review baseline provider requirements',
        },
        source: 'deterministic_fallback',
        disclaimer: DISCLAIMER,
      };
    }

    return {
      answer: `Before applying, ensure your business checking account shows at least 3 months of consistent operating deposits and that you have at least 3 reporting tradelines. Based on your current profile, a ${targetCat} represents your most suitable starting category.`,
      nextStep: {
        label: 'View Funding Matches',
        href: '/funding',
        reason: 'Review baseline provider requirements',
      },
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
    };
  }

  // --------------------------------------------------------------------------
  // 8. "What funding options appear relevant?" / "funding options"
  // --------------------------------------------------------------------------
  if (
    q.includes('funding options') ||
    q.includes('relevant funding') ||
    q.includes('matches') ||
    q.includes('what funding')
  ) {
    const topMatches = context.fundingMatches.slice(0, 2);
    const matchText = topMatches.length > 0
      ? topMatches.map((m) => `${m.category} (${m.tier})`).join(' and ')
      : 'starter working capital lines';

    return {
      answer: `Based on your profile, preliminary evaluation suggests potential fit for ${matchText}. Review provider eligibility guidelines and documentation requirements to verify suitability for your specific business.`,
      nextStep: {
        label: 'Explore Matched Funding Options',
        href: '/funding',
        reason: 'Inspect personalized eligibility tiers',
      },
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
    };
  }

  // --------------------------------------------------------------------------
  // 9. "What is my biggest opportunity?" / "opportunity"
  // --------------------------------------------------------------------------
  if (
    q.includes('biggest opportunity') ||
    q.includes('opportunity')
  ) {
    return {
      answer: `Your greatest leverage right now is advancing to the next stage in your credit roadmap. Every seasoned tradeline that reports positive payment history increases your commercial borrowing capacity and moves your business closer to unsecured funding.`,
      nextStep: {
        label: 'View Growth Milestones',
        href: '/roadmap',
        reason: 'Accelerate commercial milestone completion',
      },
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
    };
  }

  // --------------------------------------------------------------------------
  // 10. "What should I focus on this month?" / "monthly focus"
  // --------------------------------------------------------------------------
  if (
    q.includes('focus on this month') ||
    q.includes('this month') ||
    q.includes('monthly focus')
  ) {
    return {
      answer: `This month, focus on paying all active vendor invoices early before statement closing, and maintain a stable positive balance in your business checking account. Consistent operating deposits over 30 days build the cash-flow track record lenders examine.`,
      nextStep: {
        label: 'Start Monthly Check-In',
        href: '/check-in',
        reason: 'Track 30-day deposit consistency and updates',
      },
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
    };
  }

  // --------------------------------------------------------------------------
  // 11. "What should I improve first?" / "next action" / "what should i do next"
  // --------------------------------------------------------------------------
  if (
    q.includes('improve first') ||
    q.includes('what should i do next') ||
    q.includes('what should i do first') ||
    (q.includes('what should i do') && !q.includes('roadmap')) ||
    q.includes('next action') ||
    q.includes('start with')
  ) {
    const topAction = context.topNextActions[0];
    const lowestFactor = [...context.readinessFactors].sort((a, b) => a.score - b.score)[0];

    const actionText = topAction
      ? `"${topAction.title}"`
      : lowestFactor
      ? `improving your ${lowestFactor.area.toLowerCase()}`
      : 'verifying your commercial bureau profiles';

    return {
      answer: `Based on your profile, your primary focus should be on ${actionText}. Addressing this high-impact milestone will directly strengthen your standing before underwriters evaluate your business.`,
      nextStep: {
        label: 'View Next Recommended Actions',
        href: '/dashboard#next-actions',
        reason: 'Focus on highest priority items first',
      },
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
    };
  }

  // --------------------------------------------------------------------------
  // 12. "What is lowering my funding readiness?" / "holding back" / "weak"
  // --------------------------------------------------------------------------
  if (
    q.includes('lowering') ||
    q.includes('holding me back') ||
    q.includes('weakness') ||
    q.includes('drag') ||
    q.includes('improve my funding readiness')
  ) {
    const laggingFactors = context.readinessFactors.filter(
      (f) => f.status === 'needs_improvement' || f.score < 60
    );

    if (laggingFactors.length > 0) {
      const areas = laggingFactors
        .slice(0, 2)
        .map((f) => f.area)
        .join(' and ');
      return {
        answer: `Your funding readiness is currently most constrained by ${areas}. Commercial providers require established bureau depth and consistent cash flow. Strengthening these areas could significantly boost your readiness score.`,
        nextStep: {
          label: 'View Readiness Audit',
          href: '/readiness?tab=funding',
          reason: 'See detailed gap analysis breakdown',
        },
        source: 'deterministic_fallback',
        disclaimer: DISCLAIMER,
      };
    }

    return {
      answer: `Your readiness metrics are generally in good shape (${context.fundingReadinessScore}/100). To reach the top tier, continue adding seasoned commercial tradelines and maintaining consistent operating account balances.`,
      nextStep: {
        label: 'Review Readiness Breakdown',
        href: '/readiness?tab=funding',
      },
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
    };
  }

  // --------------------------------------------------------------------------
  // 13. "Why is my readiness score X?" / "explain score"
  // --------------------------------------------------------------------------
  if (
    q.includes('why is my readiness') ||
    q.includes('score') ||
    q.includes('readiness score')
  ) {
    const strongFactor = context.readinessFactors.find((f) => f.status === 'strong' || f.score >= 75);
    const weakFactor = context.readinessFactors.find((f) => f.status === 'needs_improvement');

    let breakdown = `Your Funding Readiness is ${context.fundingReadinessScore}/100 (${context.readinessLevel}).`;
    if (strongFactor && weakFactor) {
      breakdown += ` You have solid foundation in ${strongFactor.area}, but your score is reduced due to ${weakFactor.area}.`;
    } else if (weakFactor) {
      breakdown += ` Points are primarily lowered in ${weakFactor.area}.`;
    } else {
      breakdown += ` Your profile reflects consistent operating parameters across evaluated areas.`;
    }

    return {
      answer: breakdown,
      nextStep: {
        label: 'Explore Readiness Factors',
        href: '/readiness?tab=funding',
        reason: 'Inspect all 5 core scoring pillars',
      },
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
    };
  }

  // --------------------------------------------------------------------------
  // 14. "Roadmap" / "milestones" / "stages"
  // --------------------------------------------------------------------------
  if (q.includes('roadmap') || q.includes('milestone') || q.includes('stage')) {
    return {
      answer: `You are currently in stage ${context.currentJourneyStage}. Working through your active milestones systematically ensures your commercial credit profile is verified before applying for institutional capital.`,
      nextStep: {
        label: 'Open Roadmap',
        href: '/roadmap',
        reason: 'View current active stage milestones',
      },
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
    };
  }

  // --------------------------------------------------------------------------
  // 15. Default Fallback
  // --------------------------------------------------------------------------
  return {
    answer: `Your Crediqly readiness score is ${context.fundingReadinessScore}/100 in ${context.currentJourneyStage}. Based on the information provided, focusing on your high-priority roadmap tasks will help you build stronger commercial credit standing.`,
    nextStep: {
      label: 'View Recommendations',
      href: '/dashboard#next-actions',
      reason: 'Take next recommended action',
    },
    source: 'deterministic_fallback',
    disclaimer: DISCLAIMER,
  };
}
