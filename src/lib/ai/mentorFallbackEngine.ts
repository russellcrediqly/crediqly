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
 */
export function generateDeterministicAIMentorAnswer(
  question: string,
  context: SafeCustomerAIContext
): AIMentorResponse {
  const q = (question || '').toLowerCase().trim();

  // If customer profile is incomplete, nudge profile completion
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

  // 1. "What should I do before applying for funding?" / "before applying"
  if (
    q.includes('before applying') ||
    q.includes('ready to apply') ||
    q.includes('apply for funding')
  ) {
    const strongMatch = context.fundingMatches.find((m) => m.tier.toLowerCase().includes('strong'));
    const targetCat = strongMatch ? strongMatch.category : 'Business Line of Credit';

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

  // 2. "What should I improve first?" / "next action" / "priority"
  if (
    q.includes('improve first') ||
    q.includes('what should i do next') ||
    q.includes('what should i do first') ||
    q.includes('what should i do') ||
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

  // 2. "What is lowering my funding readiness?" / "holding back" / "weak"
  if (
    q.includes('lowering') ||
    q.includes('holding me back') ||
    q.includes('weakness') ||
    q.includes('drag')
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

  // 3. "Why is my readiness score X?" / "explain score"
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

  // 4. "Roadmap" / "milestones" / "stages"
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

  // 6. Generic / Fallback question
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
