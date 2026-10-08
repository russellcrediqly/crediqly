import type {
  SafeCustomerAIContext,
  AIMentorResponse,
  AIMentorNextStep,
  StructuredAIAdvice,
  AdvisoryMeetingPrep,
} from '@/types/aiMentor';

const DISCLAIMER =
  'Educational Guidance: Crediqly AI Advisor provides educational insights based on self-reported profile metrics. It does not guarantee credit approval or specific funding amounts.';

/**
 * Generates an advisory meeting preparation dossier for Premium Advisory members.
 */
export function generateDeterministicAdvisoryPrep(context: SafeCustomerAIContext): AdvisoryMeetingPrep {
  const businessName = context.businessName || 'Your Business';
  const score = context.fundingReadinessScore || 0;
  const stage = context.currentJourneyStage || '01 — ESTABLISH';
  const age = context.businessAge || 'Early Stage';
  const rev = context.annualRevenue || 'Self-reported Revenue';

  const strongAreas = (context.readinessFactors || [])
    .filter((f) => f.status === 'strong' || f.score >= 75)
    .map((f) => f.area);

  const weakAreas = (context.readinessFactors || [])
    .filter((f) => f.status === 'needs_improvement' || f.score < 60)
    .map((f) => f.area);

  const situationSummary = `${businessName} is currently operating in ${stage} with a Crediqly Funding Readiness score of ${score}/100. Operating history reflects ${age} with reported revenue of ${rev}. The primary growth objective is commercial credit depth and institutional capital positioning.`;

  const discussionTopics = [
    `Targeting next-tier commercial tradelines suitable for ${age} operating history`,
    `Reviewing current bureau indexing across Dun & Bradstreet, Experian Business, and Equifax`,
    `Optimizing business checking deposit consistency to satisfy institutional underwriter cash-flow models`,
  ];

  const profileStrengths = strongAreas.length > 0
    ? strongAreas.map((a) => `Verified strength in ${a}`)
    : ['Completed basic business registration and foundational structure'];

  const profileWeaknesses = weakAreas.length > 0
    ? weakAreas.map((a) => `Underwriting constraint in ${a}`)
    : ['Needs additional reporting vendor tradelines to expand commercial depth'];

  const suggestedAdvisorQuestions = [
    `Which tier-2 revolving store cards or fleet accounts best fit our ${age} operating timeline?`,
    `How many reporting tradelines should we season before submitting our first bank line application?`,
    `What specific monthly deposit threshold should our business checking maintain for prime lender matching?`,
    `Can we review our commercial bureau files to confirm our D&B Paydex score is actively indexing?`,
  ];

  return {
    situationSummary,
    discussionTopics,
    profileStrengths,
    profileWeaknesses,
    suggestedAdvisorQuestions,
  };
}

/**
 * Deterministic fallback engine that generates high-precision, data-aware
 * structured advice from the customer's real metrics.
 * Handles all core guidance questions contextually based on live profile data.
 */
export function generateDeterministicAIMentorAnswer(
  question: string,
  context: SafeCustomerAIContext
): AIMentorResponse {
  const q = (question || '').toLowerCase().trim();
  const score = context.fundingReadinessScore || 0;
  const stage = context.currentJourneyStage || '01 — ESTABLISH';

  // --------------------------------------------------------------------------
  // 0. Incomplete Profile Guard
  // --------------------------------------------------------------------------
  if (!context.profileCompleted || context.profileCompletionPercentage < 50) {
    const pct = context.profileCompletionPercentage || 0;
    const answer = `Your business profile is currently ${pct}% complete. I recommend answering your remaining foundational questions first so we can accurately evaluate your funding readiness and activate tailored milestones.`;
    const nextStep: AIMentorNextStep = {
      label: 'Complete Business Profile',
      href: '/onboarding',
      reason: 'Unlock accurate readiness scoring and roadmap',
    };
    const structured: StructuredAIAdvice = {
      summary: answer,
      current_status: `${pct}% Profile Complete — Setup Required`,
      why_it_matters: 'Underwriters require complete entity, banking, and revenue details before evaluating creditworthiness.',
      recommended_action: {
        title: 'Complete Profile Setup',
        description: 'Finish answering the 4 foundational onboarding sections to unlock your custom roadmap.',
        href: '/onboarding',
        actionLabel: 'Complete Profile',
        priority: 'High',
        effort: '5–10 minutes',
        impact: 'High',
      },
      reasoning: 'Missing foundational data prevents accurate commercial scoring and blocks access to personalized funding matches.',
      risks: [
        'Incomplete information produces inaccurate readiness scores',
        'Lenders reject applications missing essential business entity numbers',
      ],
      next_actions: [
        'Complete Step 1: Business Demographics',
        'Complete Step 2: Foundation (EIN, Bank, D&B)',
        'Complete Step 3: Credit Profile Details',
      ],
      questions: [
        'What is required in the business foundation step?',
        'Why does Crediqly need my entity type?',
        'How does profile completion affect my funding score?',
      ],
      disclaimer: DISCLAIMER,
    };

    return {
      answer,
      nextStep,
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
      structured,
    };
  }

  // --------------------------------------------------------------------------
  // 1. "Explain business credit to me"
  // --------------------------------------------------------------------------
  if (
    q.includes('explain business credit') ||
    q.includes('what is business credit') ||
    q.includes('how does business credit work') ||
    q.includes('concept')
  ) {
    const answer = `Business credit is tied strictly to your company's EIN rather than your personal SSN, reported to commercial bureaus like Dun & Bradstreet, Experian Business, and Equifax. Building separate business credit protects your personal assets and unlocks higher credit limits without relying exclusively on personal guarantees.`;
    const nextStep: AIMentorNextStep = {
      label: 'Explore Credit Learning Library',
      href: '/learn',
      reason: 'Understand commercial credit bureaus and scoring',
    };
    const structured: StructuredAIAdvice = {
      summary: answer,
      current_status: `Stage: ${stage} • Business Credit Education`,
      why_it_matters: 'Separating business and personal credit insulates your personal credit score and unlocks 10x-50x larger commercial credit facilities.',
      recommended_action: {
        title: 'Establish Reporting Commercial Accounts',
        description: 'Open 2–3 vendor tradelines reporting to D&B and Experian Business under your EIN.',
        href: '/products?category=net-30',
        actionLabel: 'Browse Tier-1 Tradelines',
        priority: 'High',
        effort: '15–20 minutes',
        impact: 'High',
      },
      reasoning: 'Commercial credit bureaus evaluate trade experiences and invoice payment timing. Paying early generates an 80+ Paydex score.',
      risks: [
        'Using personal credit cards for business expenses risks personal credit utilization penalties',
        'Not having a DUNS number leaves commercial accounts unindexed',
      ],
      next_actions: [
        'Confirm EIN and Secretary of State good standing',
        'Open business checking account in legal business name',
        'Acquire starter Tier-1 Net-30 accounts that report monthly',
      ],
      questions: [
        'Which commercial credit bureau is most important?',
        'How long does it take to establish an 80 Paydex score?',
        'Can I get business credit without a personal guarantee?',
      ],
      disclaimer: DISCLAIMER,
    };

    return {
      answer,
      nextStep,
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
      structured,
    };
  }

  // --------------------------------------------------------------------------
  // 2. "Why should I do this?" / "Why should I do it?"
  // --------------------------------------------------------------------------
  if (
    q.includes('why should i do this') ||
    q.includes('why should i do it') ||
    q.includes('why does this matter') ||
    q.includes('why do this')
  ) {
    const topAction = context.topNextActions[0];
    const actionName = topAction ? `"${topAction.title}"` : 'your priority milestone';
    const answer = `Completing ${actionName} satisfies institutional underwriting verification standards. When commercial lenders review an application, having this baseline verified on file significantly reduces underwriting risk and strengthens your readiness score.`;
    const nextStep: AIMentorNextStep = {
      label: 'View Current Action Details',
      href: '/dashboard#next-actions',
      reason: 'Review underwriter rationale and guidance',
    };
    const structured: StructuredAIAdvice = {
      summary: answer,
      current_status: `Priority Action: ${actionName}`,
      why_it_matters: 'Institutional underwriting algorithms follow automated milestone dependency checks. Skipping foundational requirements triggers automatic underwriting declines.',
      recommended_action: {
        title: topAction?.title || 'Complete Priority Roadmap Milestone',
        description: 'Complete the steps specified in your command center hero card.',
        href: '/dashboard#next-actions',
        actionLabel: 'Open Next Step',
        priority: topAction?.priority || 'High',
        effort: '15–30 minutes',
        impact: 'High',
      },
      reasoning: 'Lenders evaluate risk hierarchically: entity compliance -> operating banking -> commercial bureau depth -> revenue capacity.',
      risks: [
        'Applying for capital before this prerequisite is verified causes automated rejections',
        'Inconsistent profile data across state and bureau files flags fraud filters',
      ],
      next_actions: [
        'Complete the recommended task steps',
        'Verify documentation is in order',
        'Mark milestone complete to refresh readiness calculation',
      ],
      questions: [
        'What happens after I complete this action?',
        'How much will my readiness score increase?',
        'What documents do I need to complete this?',
      ],
      disclaimer: DISCLAIMER,
    };

    return {
      answer,
      nextStep,
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
      structured,
    };
  }

  // --------------------------------------------------------------------------
  // 3. "What should I open next?" / "Which tradelines should I consider?"
  // --------------------------------------------------------------------------
  if (
    q.includes('what should i open next') ||
    q.includes('which tradelines should i consider') ||
    q.includes('which tradelines') ||
    q.includes('tradelines') ||
    q.includes('vendor accounts')
  ) {
    const isNewBusiness =
      context.businessAge === 'Under 6 months' ||
      context.businessAge === '6–12 months' ||
      context.fundingReadinessScore < 40;

    if (isNewBusiness) {
      const answer = `At your current stage, open 2 to 3 Tier-1 Net-30 vendor accounts that report to D&B and Experian (such as Crown Office Supplies or Nav Prime). These starter accounts establish payment history on your EIN with zero personal credit risk.`;
      const nextStep: AIMentorNextStep = {
        label: 'Browse Tier-1 Tradelines',
        href: '/products?category=net-30',
        reason: 'Open beginner-friendly reporting vendor accounts',
      };
      const structured: StructuredAIAdvice = {
        summary: answer,
        current_status: `${context.businessAge || 'Early Stage'} • Starter Credit Phase`,
        why_it_matters: 'Tier-1 vendor accounts do not require established commercial credit or personal guarantee and begin reporting positive tradelines to D&B and Experian.',
        recommended_action: {
          title: 'Open 2–3 Tier-1 Vendor Accounts',
          description: 'Apply with vendor accounts that report to at least 2 major commercial bureaus monthly.',
          href: '/products?category=net-30',
          actionLabel: 'View Tier-1 Tradelines',
          priority: 'High',
          effort: '20 minutes',
          impact: 'High',
        },
        reasoning: 'To generate an official D&B Paydex score, commercial bureaus require a minimum of 3 reporting trade lines with confirmed payment experiences.',
        risks: [
          'Do not order items and pay late; late Net-30 payments severely harm Paydex scores',
          'Avoid vendors that do not report to commercial bureaus',
        ],
        next_actions: [
          'Select 2 Net-30 vendor accounts',
          'Make an initial qualifying purchase ($50–$100)',
          'Pay invoice within 10–14 days of issue',
        ],
        questions: [
          'Which Tier-1 vendors report the fastest?',
          'Do Net-30 accounts check personal credit?',
          'When can I upgrade to store credit cards?',
        ],
        disclaimer: DISCLAIMER,
      };

      return {
        answer,
        nextStep,
        source: 'deterministic_fallback',
        disclaimer: DISCLAIMER,
        structured,
      };
    }

    const answer = `With your current foundation, look into Tier-2 revolving business store cards or commercial fuel accounts. These reporting lines demonstrate revolving credit management on your business file without heavy personal credit utilization.`;
    const nextStep: AIMentorNextStep = {
      label: 'Browse Revolving Credit Lines',
      href: '/products?category=revolving',
      reason: 'Expand commercial credit depth with Tier-2 accounts',
    };
    const structured: StructuredAIAdvice = {
      summary: answer,
      current_status: `${stage} • Revolving Credit Expansion`,
      why_it_matters: 'Revolving lines demonstrate ongoing credit management ability beyond fixed Net-30 trade invoices.',
      recommended_action: {
        title: 'Apply for Tier-2 Revolving Business Card',
        description: 'Explore store cards or fuel accounts with established commercial reporting.',
        href: '/products?category=revolving',
        actionLabel: 'View Revolving Products',
        priority: 'High',
        effort: '15 minutes',
        impact: 'High',
      },
      reasoning: 'Lenders look for diversified credit types: trade credit, revolving credit lines, and installment accounts.',
      risks: [
        'Keep revolving credit utilization under 25% of the approved credit limit',
        'Avoid submitting multiple applications in the same 30-day window',
      ],
      next_actions: [
        'Review current Tier-1 tradeline reporting status',
        'Select 1–2 Tier-2 store cards matching your supply needs',
        'Set up automatic on-time full balance payments',
      ],
      questions: [
        'What store cards report without a personal guarantee?',
        'How many tradelines do I need for Tier-3 cards?',
        'How does credit utilization affect business scores?',
      ],
      disclaimer: DISCLAIMER,
    };

    return {
      answer,
      nextStep,
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
      structured,
    };
  }

  // --------------------------------------------------------------------------
  // 4. "How do I build business credit?"
  // --------------------------------------------------------------------------
  if (
    q.includes('how do i build business credit') ||
    q.includes('how to build business credit') ||
    q.includes('how can i build my business credit')
  ) {
    const answer = `To build business credit systematically: 1) Verify your business is registered with the state and has an EIN and dedicated business bank account; 2) Obtain your D&B D-U-N-S number; 3) Open 3–5 Tier-1 Net-30 vendor accounts that report monthly; 4) Pay every invoice early; 5) Graduate to Tier-2 revolving accounts.`;
    const nextStep: AIMentorNextStep = {
      label: 'Follow 5-Stage Roadmap',
      href: '/roadmap',
      reason: 'Work through sequential credit-building stages',
    };
    const structured: StructuredAIAdvice = {
      summary: answer,
      current_status: `Current Stage: ${stage}`,
      why_it_matters: 'Business credit is built sequentially. Jumping straight to tier-3 or bank loans without starter tradelines leads to auto-declines.',
      recommended_action: {
        title: 'Execute Current Stage Roadmap Tasks',
        description: 'Follow the step-by-step milestones defined in your Crediqly roadmap.',
        href: '/roadmap',
        actionLabel: 'Open Credit Roadmap',
        priority: 'High',
        effort: 'Ongoing',
        impact: 'High',
      },
      reasoning: 'Commercial underwriting scoring models require verified identity, positive trade lines, and seasoned bank statements.',
      risks: [
        'Do not apply for business credit with personal email or home address without commercial registration',
        'Do not skip Net-30 vendor seasoning',
      ],
      next_actions: [
        'Confirm active commercial bank checking account',
        'Maintain 3+ active reporting vendor accounts',
        'Pay all vendor bills 10 days before due date',
      ],
      questions: [
        'What is the fastest way to get an 80 Paydex score?',
        'Which vendors report to Equifax and Experian?',
        'Can I build credit without revenue?',
      ],
      disclaimer: DISCLAIMER,
    };

    return {
      answer,
      nextStep,
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
      structured,
    };
  }

  // --------------------------------------------------------------------------
  // 5. "Which business banking options make sense?"
  // --------------------------------------------------------------------------
  if (
    q.includes('business banking') ||
    q.includes('bank account') ||
    q.includes('banking') ||
    q.includes('checking account')
  ) {
    const isHigherRev =
      context.annualRevenue?.includes('$250,000') ||
      context.annualRevenue?.includes('$500,000') ||
      context.annualRevenue?.includes('$1,000,000');

    const answer = isHigherRev
      ? `With your revenue profile, relationship banking with an institutional commercial bank or regional credit union makes the most sense. Maintaining active treasury and operating balances unblocks relationship credit lines and SBA-backed financing.`
      : `Select a dedicated business checking account with zero monthly maintenance fees, sub-accounts for tax reserves, and accounting software integration. Underwriters examine at least 3 consecutive months of clean operating deposits with zero NSF or overdraft incidents.`;

    const nextStep: AIMentorNextStep = {
      label: 'Review Business Banking Guidance',
      href: '/readiness?tab=business',
      reason: 'Review commercial account underwriting criteria',
    };
    const structured: StructuredAIAdvice = {
      summary: answer,
      current_status: `Banking Health • Stage: ${stage}`,
      why_it_matters: 'Lenders verify at least 3–6 months of consistent business bank statements. Overdrafts or co-mingling funds are the #1 reason for automatic rejections.',
      recommended_action: {
        title: 'Maintain Clean Operating Bank Statements',
        description: 'Keep all business revenues flowing through dedicated commercial checking with a stable minimum daily balance.',
        href: '/readiness?tab=business',
        actionLabel: 'View Banking Checklist',
        priority: 'High',
        effort: 'Ongoing',
        impact: 'High',
      },
      reasoning: 'Automated bank data underwriting (Plaid/decisioning engines) calculates average daily balance, monthly deposit frequency, and cash-flow margin.',
      risks: [
        'Never allow NSF (Non-Sufficient Funds) or negative ending balances',
        'Never deposit personal funds directly into business checking without documenting as owner contribution',
      ],
      next_actions: [
        'Keep minimum average daily balance above $1,000',
        'Maintain at least 4–8 business revenue deposits each month',
        'Connect accounting integration for automated reconciliation',
      ],
      questions: [
        'How many months of bank statements do lenders require?',
        'Does my bank account age affect my credit score?',
        'Which banks offer the best lines of credit for small businesses?',
      ],
      disclaimer: DISCLAIMER,
    };

    return {
      answer,
      nextStep,
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
      structured,
    };
  }

  // --------------------------------------------------------------------------
  // 6. "What should I avoid right now?" / "avoid" / "mistakes"
  // --------------------------------------------------------------------------
  if (
    q.includes('avoid') ||
    q.includes('mistakes') ||
    q.includes('what not to do') ||
    q.includes('what should i avoid')
  ) {
    const answer = `Avoid applying for multiple hard-inquiry personal loans, stacking high-cost merchant cash advances, or co-mingling personal and business funds. Keep your business checking balance consistently above $1,000 and avoid any overdrafts, which underwriters view as an immediate red flag.`;
    const nextStep: AIMentorNextStep = {
      label: 'Check Underwriting Factors',
      href: '/readiness?tab=funding',
      reason: 'View key factors evaluated by institutional lenders',
    };
    const structured: StructuredAIAdvice = {
      summary: answer,
      current_status: 'Risk Mitigation Active',
      why_it_matters: 'Underwriting traps can drop your readiness score by 20–30 points and lock your business out of prime institutional funding for 6–12 months.',
      recommended_action: {
        title: 'Review Risk Factors Audit',
        description: 'Audit your current bank account behavior and credit inquiries against underwriter red flags.',
        href: '/readiness?tab=funding',
        actionLabel: 'Audit Risk Factors',
        priority: 'High',
        effort: '10 minutes',
        impact: 'High',
      },
      reasoning: 'Underwriters check negative flags first: recent personal inquiries, daily merchant cash advance debiting, and overdraft fee frequency.',
      risks: [
        'Taking high-interest MCA loans traps operating cash flow',
        'Applying with 3+ lenders in one week generates inquiry clusters that signal desperation',
        'Inconsistent business addresses across D&B and state records triggers fraud holds',
      ],
      next_actions: [
        'Freeze unnecessary hard inquiries',
        'Maintain clean business bank balance buffer',
        'Ensure exact spelling match across IRS, Secretary of State, and bank accounts',
      ],
      questions: [
        'How do hard inquiries affect business credit?',
        'What is considered a safe credit utilization ratio?',
        'How can I remove an incorrect address on D&B?',
      ],
      disclaimer: DISCLAIMER,
    };

    return {
      answer,
      nextStep,
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
      structured,
    };
  }

  // --------------------------------------------------------------------------
  // 7. "When will my business be funding ready?" / "Am I ready for funding?"
  // --------------------------------------------------------------------------
  if (
    q.includes('when will my business be funding ready') ||
    q.includes('funding ready') ||
    q.includes('ready for funding') ||
    q.includes('ready to look for funding') ||
    q.includes('ready to look') ||
    q.includes('ready to apply') ||
    q.includes('before applying') ||
    q.includes('apply for funding')
  ) {
    const strongMatch = context.fundingMatches.find((m) => m.tier.toLowerCase().includes('strong'));
    const targetCat = strongMatch ? strongMatch.category : 'Business Line of Credit';

    if (context.fundingReadinessScore < 50) {
      const answer = `At ${context.fundingReadinessScore}/100 readiness, focusing on building 3 to 5 reporting tradelines and establishing 3 consistent bank statements will produce much stronger terms than applying prematurely. When ready, a ${targetCat} appears most aligned with your profile.`;
      const nextStep: AIMentorNextStep = {
        label: 'View Funding Preparation Roadmap',
        href: '/funding',
        reason: 'Review baseline provider requirements',
      };
      const structured: StructuredAIAdvice = {
        summary: answer,
        current_status: `${context.fundingReadinessScore}/100 — Building Foundation`,
        why_it_matters: 'Premature applications result in high rejection rates and unnecessary hard inquiries that lower personal and commercial credit standing.',
        recommended_action: {
          title: 'Build 3–5 Reporting Tradelines First',
          description: 'Establish foundational trade accounts and accumulate 3 months of bank statements before applying for institutional loans.',
          href: '/products?category=net-30',
          actionLabel: 'Open Net-30 Tradelines',
          priority: 'High',
          effort: '30–60 days',
          impact: 'High',
        },
        reasoning: 'Lenders require verifiable trade payment history and cash-flow stability before issuing unsecured capital.',
        risks: [
          'Applying prematurely causes hard inquiry penalties without approvals',
          'Predatory lenders prey on early-stage founders with 40%+ APR products',
        ],
        next_actions: [
          'Reach at least 65+ Funding Readiness score',
          'Season at least 3 active tradelines for 60–90 days',
          'Verify at least $5,000+ in monthly bank deposits',
        ],
        questions: [
          'What is the minimum score required for a business line of credit?',
          'Can I get revenue-based funding with a low score?',
          'How do I calculate my debt service coverage ratio?',
        ],
        disclaimer: DISCLAIMER,
      };

      return {
        answer,
        nextStep,
        source: 'deterministic_fallback',
        disclaimer: DISCLAIMER,
        structured,
      };
    }

    const answer = `Before applying, ensure your business checking account shows at least 3 months of consistent operating deposits and that you have at least 3 reporting tradelines. Based on your current profile, a ${targetCat} represents your most suitable starting category.`;
    const nextStep: AIMentorNextStep = {
      label: 'View Funding Matches',
      href: '/funding',
      reason: 'Review baseline provider requirements',
    };
    const structured: StructuredAIAdvice = {
      summary: answer,
      current_status: `${context.fundingReadinessScore}/100 (${context.readinessLevel}) • Funding Qualified`,
      why_it_matters: 'You have established the requisite credit foundation. Preparing documentation in advance guarantees the fastest approval timelines and lowest interest rates.',
      recommended_action: {
        title: 'Review Matched Funding Guidelines',
        description: `Explore requirements for ${targetCat} and prepare your 3 most recent bank statements.`,
        href: '/funding',
        actionLabel: 'Explore Funding Matches',
        priority: 'High',
        effort: '15 minutes',
        impact: 'High',
      },
      reasoning: 'Your profile satisfies baseline eligibility criteria for matched categories, with positive foundation indicators.',
      risks: [
        'Do not apply for multiple different products simultaneously',
        'Review APR, origination fees, and repayment frequency before signing',
      ],
      next_actions: [
        'Gather last 3 months of business bank statements (PDFs)',
        'Verify revenue figures match bank deposits',
        'Review terms on your highest-ranked matched provider',
      ],
      questions: [
        'What documents will the underwriter request?',
        'How fast is funding deposited after approval?',
        'What is the difference between a line of credit and a term loan?',
      ],
      disclaimer: DISCLAIMER,
    };

    return {
      answer,
      nextStep,
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
      structured,
    };
  }

  // --------------------------------------------------------------------------
  // 8. "What funding options appear relevant?"
  // --------------------------------------------------------------------------
  if (
    q.includes('funding options') ||
    q.includes('relevant funding') ||
    q.includes('what funding options appear relevant') ||
    q.includes('matches') ||
    q.includes('what funding')
  ) {
    const topMatches = context.fundingMatches.slice(0, 2);
    const matchText = topMatches.length > 0
      ? topMatches.map((m) => `${m.category} (${m.tier})`).join(' and ')
      : 'starter working capital lines';

    const answer = `Based on your profile, preliminary evaluation suggests potential fit for ${matchText}. Review provider eligibility guidelines and documentation requirements to verify suitability for your specific business.`;
    const nextStep: AIMentorNextStep = {
      label: 'Explore Matched Funding Options',
      href: '/funding',
      reason: 'Inspect personalized eligibility tiers',
    };
    const structured: StructuredAIAdvice = {
      summary: answer,
      current_status: `Stage: ${stage} • Funding Matches Active`,
      why_it_matters: 'Pre-matched funding categories prevent blind applications that waste time and damage credit profiles.',
      recommended_action: {
        title: 'Review Matched Provider Requirements',
        description: 'Examine borrower minimums, interest ranges, and documentation needs.',
        href: '/funding',
        actionLabel: 'View Funding Matches',
        priority: 'High',
        effort: '10 minutes',
        impact: 'High',
      },
      reasoning: 'Eligibility tiers are calculated by comparing your reported revenue, time in business, and credit tier against commercial provider underwriting grids.',
      risks: [
        'Carefully examine whether a product requires a Personal Guarantee (PG)',
        'Check for prepayment penalties or high daily origination deductions',
      ],
      next_actions: [
        'Compare loan vs line of credit options',
        'Calculate required monthly cash flow coverage',
        'Prepare clean business bank statements',
      ],
      questions: [
        'Can I qualify for an unsecured line of credit?',
        'What are the minimum revenue requirements?',
        'How does funding affect my commercial score?',
      ],
      disclaimer: DISCLAIMER,
    };

    return {
      answer,
      nextStep,
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
      structured,
    };
  }

  // --------------------------------------------------------------------------
  // 9. "What is preventing me from being more funding-ready?" / "lowering" / "weak"
  // --------------------------------------------------------------------------
  if (
    q.includes('preventing me from being more funding-ready') ||
    q.includes('preventing') ||
    q.includes('lowering') ||
    q.includes('holding me back') ||
    q.includes('weakness') ||
    q.includes('drag') ||
    q.includes('improve my funding readiness')
  ) {
    const laggingFactors = (context.readinessFactors || []).filter(
      (f) => f.status === 'needs_improvement' || f.score < 60
    );

    if (laggingFactors.length > 0) {
      const areas = laggingFactors
        .slice(0, 2)
        .map((f) => f.area)
        .join(' and ');
      const answer = `Your funding readiness is currently most constrained by ${areas}. Commercial providers require established bureau depth and consistent cash flow. Strengthening these areas could significantly boost your readiness score.`;
      const nextStep: AIMentorNextStep = {
        label: 'View Readiness Audit',
        href: '/readiness?tab=funding',
        reason: 'See detailed gap analysis breakdown',
      };
      const structured: StructuredAIAdvice = {
        summary: answer,
        current_status: `Primary Underwriting Bottleneck: ${areas}`,
        why_it_matters: 'Lenders score candidates through a multi-factor matrix. A single severe gap in banking or credit depth drags down your entire aggregate borrowing capacity.',
        recommended_action: {
          title: `Address ${laggingFactors[0].area}`,
          description: 'Follow the specific corrective milestones detailed in your readiness gap analysis.',
          href: '/readiness?tab=funding',
          actionLabel: 'View Gap Analysis',
          priority: 'High',
          effort: '2–4 weeks',
          impact: 'High',
        },
        reasoning: 'Underwriters require consistency across all 4 pillars: Entity Structure, Banking Cash Flow, Bureau Tradelines, and Revenue Capacity.',
        risks: [
          'Ignoring lagging factors causes repeated loan application denials',
          'Applying with low credit depth flags profile as high-risk',
        ],
        next_actions: [
          `Prioritize tasks improving ${laggingFactors[0].area}`,
          'Season trade accounts with early payments',
          'Maintain clean operating deposit track record',
        ],
        questions: [
          'How fast will my score increase when this gap is resolved?',
          'What is the quickest way to fix commercial credit depth?',
          'Can revenue compensate for short time in business?',
        ],
        disclaimer: DISCLAIMER,
      };

      return {
        answer,
        nextStep,
        source: 'deterministic_fallback',
        disclaimer: DISCLAIMER,
        structured,
      };
    }

    const answer = `Your readiness metrics are generally in good shape (${context.fundingReadinessScore}/100). To reach the top tier, continue adding seasoned commercial tradelines and maintaining consistent operating account balances.`;
    const nextStep: AIMentorNextStep = {
      label: 'Review Readiness Breakdown',
      href: '/readiness?tab=funding',
      reason: 'See all diagnostic factors',
    };
    const structured: StructuredAIAdvice = {
      summary: answer,
      current_status: `${context.fundingReadinessScore}/100 • Strong Foundation`,
      why_it_matters: 'Maintaining consistent operating habits preserves your high score and qualifies you for Tier-3 unsecured lending.',
      recommended_action: {
        title: 'Maintain Account Seasoning',
        description: 'Keep accounts in good standing and let tradelines mature past the 6-month threshold.',
        href: '/readiness?tab=funding',
        actionLabel: 'Review Readiness Audit',
        priority: 'Medium',
        effort: 'Ongoing',
        impact: 'Moderate',
      },
      reasoning: 'Profile seasoning increases credit limits and decreases provider risk premiums.',
      risks: [
        'Avoid abrupt spikes in debt utilization',
        'Maintain zero overdrafts or returned payments',
      ],
      next_actions: [
        'Season active tradelines',
        'Review funding matches quarterly',
      ],
      questions: [
        'When should I request credit limit increases?',
        'How do I qualify for SBA 7(a) financing?',
      ],
      disclaimer: DISCLAIMER,
    };

    return {
      answer,
      nextStep,
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
      structured,
    };
  }

  // --------------------------------------------------------------------------
  // 10. "What should I focus on this month?"
  // --------------------------------------------------------------------------
  if (
    q.includes('focus on this month') ||
    q.includes('this month') ||
    q.includes('monthly focus')
  ) {
    const answer = `This month, focus on paying all active vendor invoices early before statement closing, and maintain a stable positive balance in your business checking account. Consistent operating deposits over 30 days build the cash-flow track record lenders examine.`;
    const nextStep: AIMentorNextStep = {
      label: 'Start Monthly Check-In',
      href: '/check-in',
      reason: 'Track 30-day deposit consistency and updates',
    };
    const structured: StructuredAIAdvice = {
      summary: answer,
      current_status: `Monthly Sprint • Stage: ${stage}`,
      why_it_matters: 'Commercial credit bureaus recalculate scores every 30 days based on statement cycles. 30 days of clean early payments directly moves the needle.',
      recommended_action: {
        title: 'Complete 30-Day Check-In',
        description: 'Log your deposit consistency and verify active reporting tradelines.',
        href: '/check-in',
        actionLabel: 'Open Monthly Check-In',
        priority: 'High',
        effort: '10 minutes',
        impact: 'High',
      },
      reasoning: 'Steady month-over-month operating habits demonstrate business predictability to credit algorithms.',
      risks: [
        'Do not wait until the exact invoice due date; pay 5–10 days early for maximum Paydex rating',
        'Avoid large end-of-month cash withdrawals that deplete average balances',
      ],
      next_actions: [
        'Review vendor payment due dates',
        'Log monthly checking account balance in Check-In',
        'Advance to next milestone on your roadmap',
      ],
      questions: [
        'How do early payments improve my score?',
        'What should my average daily bank balance be?',
        'How often does Crediqly update readiness?',
      ],
      disclaimer: DISCLAIMER,
    };

    return {
      answer,
      nextStep,
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
      structured,
    };
  }

  // --------------------------------------------------------------------------
  // 11. "What opportunity should I pursue?" / "Biggest opportunity"
  // --------------------------------------------------------------------------
  if (
    q.includes('biggest opportunity') ||
    q.includes('what opportunity should i pursue') ||
    q.includes('opportunity')
  ) {
    const answer = `Your greatest leverage right now is advancing to the next stage in your credit roadmap. Every seasoned tradeline that reports positive payment history increases your commercial borrowing capacity and moves your business closer to unsecured funding.`;
    const nextStep: AIMentorNextStep = {
      label: 'View Growth Milestones',
      href: '/roadmap',
      reason: 'Accelerate commercial milestone completion',
    };
    const structured: StructuredAIAdvice = {
      summary: answer,
      current_status: `Current Stage: ${stage} • Opportunity Unlocked`,
      why_it_matters: 'Completing each progressive milestone unlocks lower interest rates and access to unsecured commercial funding.',
      recommended_action: {
        title: 'Advance to Next Stage Milestone',
        description: 'Complete the priority action identified on your roadmap.',
        href: '/roadmap',
        actionLabel: 'Open Roadmap',
        priority: 'High',
        effort: '15–30 minutes',
        impact: 'High',
      },
      reasoning: 'Underwriting models award exponential score gains when a business transitions from starter trade lines to seasoned revolving facilities.',
      risks: [
        'Do not skip stages; unseasoned files get declined by higher-tier lenders',
      ],
      next_actions: [
        'Complete pending roadmap task',
        'Review updated borrowing power estimate',
      ],
      questions: [
        'What is my estimated borrowing capacity?',
        'When will I qualify for unsecured business cards?',
      ],
      disclaimer: DISCLAIMER,
    };

    return {
      answer,
      nextStep,
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
      structured,
    };
  }

  // --------------------------------------------------------------------------
  // 12. "Explain this recommendation" / "Why was this recommended?"
  // --------------------------------------------------------------------------
  if (
    q.includes('explain this recommendation') ||
    q.includes('explain recommendation') ||
    q.includes('why was this product recommended')
  ) {
    const topProd = context.recommendedProducts?.[0];
    const topAction = context.topNextActions?.[0];
    const itemTitle = topProd ? topProd.name : topAction ? topAction.title : 'this roadmap milestone';

    const answer = `We recommended ${itemTitle} because it directly aligns with your current ${stage} journey stage and operating parameters. It provides verified commercial bureau reporting while satisfying key underwriter prerequisites without excessive credit hurdles.`;
    const nextStep: AIMentorNextStep = {
      label: 'View Recommended Options',
      href: '/products',
      reason: 'Inspect underwriter criteria and application requirements',
    };
    const structured: StructuredAIAdvice = {
      summary: answer,
      current_status: `Recommended Focus: ${itemTitle}`,
      why_it_matters: 'Crediqly recommendation engine filters through hundreds of financial products to select only those matching your exact profile stage and bureau needs.',
      recommended_action: {
        title: `Review ${itemTitle}`,
        description: 'Check provider requirements and apply when ready.',
        href: '/products',
        actionLabel: 'View Details',
        priority: 'High',
        effort: '10–15 minutes',
        impact: 'High',
      },
      reasoning: 'Algorithm matches your business age, revenue, and tradeline count against provider approval rules.',
      risks: [
        'Verify your business information matches exactly before submitting provider forms',
      ],
      next_actions: [
        'Review provider application guidelines',
        'Ensure EIN and banking details are readily accessible',
      ],
      questions: [
        'What are the minimum requirements for this product?',
        'Which credit bureau does this provider report to?',
      ],
      disclaimer: DISCLAIMER,
    };

    return {
      answer,
      nextStep,
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
      structured,
    };
  }

  // --------------------------------------------------------------------------
  // 13. "Why was my readiness score updated?" / "Why is my readiness score X?"
  // --------------------------------------------------------------------------
  if (
    q.includes('why was my readiness score updated') ||
    q.includes('why is my readiness') ||
    q.includes('score') ||
    q.includes('readiness score')
  ) {
    const strongFactor = (context.readinessFactors || []).find((f) => f.status === 'strong' || f.score >= 75);
    const weakFactor = (context.readinessFactors || []).find((f) => f.status === 'needs_improvement');

    let breakdown = `Your Funding Readiness is ${context.fundingReadinessScore}/100 (${context.readinessLevel}).`;
    if (strongFactor && weakFactor) {
      breakdown += ` You have solid foundation in ${strongFactor.area}, but your score is reduced due to ${weakFactor.area}.`;
    } else if (weakFactor) {
      breakdown += ` Points are primarily lowered in ${weakFactor.area}.`;
    } else {
      breakdown += ` Your profile reflects consistent operating parameters across evaluated areas.`;
    }
    const answer = breakdown;

    const nextStep: AIMentorNextStep = {
      label: 'Explore Readiness Factors',
      href: '/readiness?tab=funding',
      reason: 'Inspect all 5 core scoring pillars',
    };
    const structured: StructuredAIAdvice = {
      summary: breakdown,
      current_status: `Score: ${context.fundingReadinessScore}/100 (${context.readinessLevel})`,
      why_it_matters: 'Your Crediqly score synthesizes 14 verified roadmap milestones and 4 underwriter pillars into an authoritative readiness index.',
      recommended_action: {
        title: 'Review 4 Pillar Diagnostic',
        description: 'Inspect detailed breakdown across Business Foundation, Credit Profile, Banking Health, and Capital Matching.',
        href: '/readiness?tab=funding',
        actionLabel: 'View Readiness Factors',
        priority: 'High',
        effort: '5 minutes',
        impact: 'High',
      },
      reasoning: 'Deterministic scoring updates immediately when profile data, bank records, or completed roadmap tasks change.',
      risks: [
        'Remember that Crediqly Readiness is an educational estimate, not an official bureau score',
      ],
      next_actions: [
        'Review factor breakdown for targeted improvements',
        'Complete pending next actions to raise score',
      ],
      questions: [
        'How often does my readiness score update?',
        'What score do I need for bank lines of credit?',
      ],
      disclaimer: DISCLAIMER,
    };

    return {
      answer,
      nextStep,
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
      structured,
    };
  }

  // --------------------------------------------------------------------------
  // 14. "What should I improve first?" / "next action" / "what should i do next"
  // --------------------------------------------------------------------------
  if (
    q.includes('improve first') ||
    q.includes('what should i do next') ||
    q.includes('what should i do first') ||
    (q.includes('what should i do') && !q.includes('roadmap')) ||
    q.includes('next action') ||
    q.includes('start with')
  ) {
    const topAction = context.topNextActions?.[0];
    const lowestFactor = [...(context.readinessFactors || [])].sort((a, b) => a.score - b.score)[0];

    const actionText = topAction
      ? `"${topAction.title}"`
      : lowestFactor
      ? `improving your ${lowestFactor.area.toLowerCase()}`
      : 'verifying your commercial bureau profiles';

    const answer = `Based on your profile, your primary focus should be on ${actionText}. Addressing this high-impact milestone will directly strengthen your standing before underwriters evaluate your business.`;
    const nextStep: AIMentorNextStep = {
      label: 'View Next Recommended Actions',
      href: '/dashboard#next-actions',
      reason: 'Focus on highest priority items first',
    };
    const structured: StructuredAIAdvice = {
      summary: answer,
      current_status: `Next Priority: ${actionText}`,
      why_it_matters: 'Sequencing actions correctly ensures that prerequisites are in place before underwriters inspect your commercial file.',
      recommended_action: {
        title: topAction?.title || 'Complete Priority Milestone',
        description: 'Execute the action outlined in your command center hero card.',
        href: '/dashboard#next-actions',
        actionLabel: 'Open Next Action',
        priority: topAction?.priority || 'High',
        effort: '15–30 minutes',
        impact: 'High',
      },
      reasoning: 'Next actions are ranked algorithmically by dependency order and underwriter impact.',
      risks: [
        'Avoid jumping ahead to funding before completing foundation accounts',
      ],
      next_actions: (context.topNextActions || []).slice(0, 3).map((a) => a.title),
      questions: [
        'Why was this action chosen as my next step?',
        'How long will this action take to complete?',
        'What comes after this step?',
      ],
      disclaimer: DISCLAIMER,
    };

    return {
      answer,
      nextStep,
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
      structured,
    };
  }

  // --------------------------------------------------------------------------
  // 15. Roadmap / Milestones
  // --------------------------------------------------------------------------
  if (q.includes('roadmap') || q.includes('milestone') || q.includes('stage')) {
    const answer = `You are currently in stage ${stage}. Working through your active milestones systematically ensures your commercial credit profile is verified before applying for institutional capital.`;
    const nextStep: AIMentorNextStep = {
      label: 'Open Roadmap',
      href: '/roadmap',
      reason: 'View current active stage milestones',
    };
    const structured: StructuredAIAdvice = {
      summary: answer,
      current_status: `Roadmap: ${stage}`,
      why_it_matters: 'The 5-stage roadmap mirrors institutional underwriting progression from compliance to multi-million commercial facilities.',
      recommended_action: {
        title: 'Review Active Stage Tasks',
        description: 'Complete unverified tasks in your current roadmap stage.',
        href: '/roadmap',
        actionLabel: 'View Roadmap',
        priority: 'High',
        effort: 'Ongoing',
        impact: 'High',
      },
      reasoning: 'Lenders verify each milestone before approving larger credit limits.',
      risks: [
        'Do not mark milestones complete without actually completing the provider verification',
      ],
      next_actions: [
        'Review current stage milestones',
        'Mark tasks complete as accounts are opened',
      ],
      questions: [
        'How do I graduate to the next stage?',
        'Can I complete milestones out of order?',
      ],
      disclaimer: DISCLAIMER,
    };

    return {
      answer,
      nextStep,
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
      structured,
    };
  }

  // --------------------------------------------------------------------------
  // 16. Default Fallback
  // --------------------------------------------------------------------------
  const defaultAnswer = `Your Crediqly readiness score is ${score}/100 in ${stage}. Based on the information provided, focusing on your high-priority roadmap tasks will help you build stronger commercial credit standing.`;
  const defaultNextStep: AIMentorNextStep = {
    label: 'View Recommendations',
    href: '/dashboard#next-actions',
    reason: 'Take next recommended action',
  };
  const defaultStructured: StructuredAIAdvice = {
    summary: defaultAnswer,
    current_status: `${score}/100 • Stage: ${stage}`,
    why_it_matters: 'Following sequential commercial credit milestones prepares your business for institutional funding.',
    recommended_action: {
      title: context.topNextActions?.[0]?.title || 'Review Priority Action',
      description: 'Focus on your highest priority milestone on your command center.',
      href: '/dashboard#next-actions',
      actionLabel: 'View Actions',
      priority: 'High',
      effort: '15 minutes',
      impact: 'High',
    },
    reasoning: 'Systematic credit profile development unlocks higher credit limits and lower interest rates.',
    risks: [
      'Avoid high credit utilization and late payments',
    ],
    next_actions: [
      'Review your current stage milestones',
      'Maintain positive operating bank balances',
    ],
    questions: [
      'What should I do next?',
      'How can I improve my score?',
      'Which tradelines fit my profile?',
    ],
    disclaimer: DISCLAIMER,
  };

  return {
    answer: defaultAnswer,
    nextStep: defaultNextStep,
    source: 'deterministic_fallback',
    disclaimer: DISCLAIMER,
    structured: defaultStructured,
  };
}
