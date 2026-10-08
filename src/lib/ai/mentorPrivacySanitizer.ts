import type { SafeCustomerAIContext, AIDataClassification } from '@/types/aiMentor';

/**
 * Patterns of prohibited or sensitive data that must be scrubbed before
 * ever reaching an AI model.
 */
const SENSITIVE_PATTERNS = [
  // SSN / Tax ID strict patterns (e.g. 123-45-6789 or 9 continuous digits)
  /\b\d{3}-\d{2}-\d{4}\b/g,
  // 15-16 digit payment card patterns
  /\b(?:\d{4}[ -]?){3}\d{4}\b/g,
  // API Keys / Secrets / Tokens (sk_live, sb_secret, bearer tokens)
  /(?:sk_live|sk_test|sb_secret|ghp_|eyJh)[a-zA-Z0-9_\-]+/gi,
  // Password / credential strings in prompts
  /(?:password|pwd|secret|passphrase)\s*[:=]\s*\S+/gi,
  // Bank Account & Routing Number patterns
  /(?:account\s*number|routing\s*number|routing\s*#|acct\s*#)\s*[:=]?\s*\d{6,12}/gi,
];

/**
 * Sanitizes user prompt text, stripping any accidental sensitive credentials.
 */
export function sanitizeUserPrompt(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';
  let sanitized = rawText.trim();

  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED_SENSITIVE_DATA]');
  }

  // Cap maximum length to prevent prompt injection or buffer bloat
  return sanitized.slice(0, 500);
}

/**
 * Validates and safely whitelists customer context.
 * Strictly forbids sensitive account credentials, raw Stripe/Supabase secrets,
 * passwords, or personally identifiable data from ever being bundled.
 */
export function sanitizeCustomerContext(
  context: Partial<SafeCustomerAIContext> | null | undefined
): SafeCustomerAIContext {
  const ctx = context || {};

  const classifications: Record<string, AIDataClassification> = {
    businessName: 'Known',
    fundingReadinessScore: 'Estimated',
    readinessLevel: 'Estimated',
    businessReadinessScore: 'Estimated',
    creditReadinessScore: 'Estimated',
    profileCompleted: 'Known',
    profileCompletionPercentage: 'Known',
    currentJourneyStage: 'Estimated',
    businessAge: ctx.businessAge ? 'Customer-reported' : 'Needs verification',
    annualRevenue: ctx.annualRevenue ? 'Customer-reported' : 'Needs verification',
    personalCreditTier: ctx.personalCreditTier ? 'Customer-reported' : 'Needs verification',
    hasBusinessCreditProfile: ctx.hasBusinessCreditProfile ? 'Customer-reported' : 'Needs verification',
    entityType: ctx.entityType ? 'Customer-reported' : 'Needs verification',
    state: ctx.state ? 'Customer-reported' : 'Needs verification',
    industry: ctx.industry ? 'Customer-reported' : 'Needs verification',
    fundingGoal: ctx.fundingGoal ? 'Customer-reported' : 'Needs verification',
    topNextActions: 'Recommended',
    fundingMatches: 'Estimated',
    ...(ctx.dataClassification || {}),
  };

  const cleanScore = Math.min(100, Math.max(0, Number(ctx.fundingReadinessScore) || 0));

  return {
    // 1. Business
    businessName: ctx.businessName ? String(ctx.businessName).slice(0, 80) : undefined,
    entityType: ctx.entityType ? String(ctx.entityType).slice(0, 30) : undefined,
    businessAge: ctx.businessAge ? String(ctx.businessAge).slice(0, 30) : undefined,
    state: ctx.state ? String(ctx.state).slice(0, 30) : undefined,
    industry: ctx.industry ? String(ctx.industry).slice(0, 50) : undefined,
    businessFoundationStatus: ctx.businessFoundationStatus
      ? {
          hasEIN: ctx.businessFoundationStatus.hasEIN ? String(ctx.businessFoundationStatus.hasEIN).slice(0, 20) : undefined,
          hasBusinessBankAccount: ctx.businessFoundationStatus.hasBusinessBankAccount ? String(ctx.businessFoundationStatus.hasBusinessBankAccount).slice(0, 20) : undefined,
          hasWebsite: ctx.businessFoundationStatus.hasWebsite ? String(ctx.businessFoundationStatus.hasWebsite).slice(0, 20) : undefined,
          hasBusinessPhone: ctx.businessFoundationStatus.hasBusinessPhone ? String(ctx.businessFoundationStatus.hasBusinessPhone).slice(0, 20) : undefined,
          hasBusinessEmail: ctx.businessFoundationStatus.hasBusinessEmail ? String(ctx.businessFoundationStatus.hasBusinessEmail).slice(0, 20) : undefined,
          hasBusinessAddress: ctx.businessFoundationStatus.hasBusinessAddress ? String(ctx.businessFoundationStatus.hasBusinessAddress).slice(0, 20) : undefined,
          hasBusinessLicense: ctx.businessFoundationStatus.hasBusinessLicense ? String(ctx.businessFoundationStatus.hasBusinessLicense).slice(0, 20) : undefined,
          hasDuns: ctx.businessFoundationStatus.hasDuns ? String(ctx.businessFoundationStatus.hasDuns).slice(0, 20) : undefined,
          foundationScore: typeof ctx.businessFoundationStatus.foundationScore === 'number'
            ? Math.min(100, Math.max(0, ctx.businessFoundationStatus.foundationScore))
            : undefined,
        }
      : undefined,

    // 2. Financial & Credit
    annualRevenue: ctx.annualRevenue ? String(ctx.annualRevenue).slice(0, 40) : undefined,
    revenueRange: ctx.revenueRange ? String(ctx.revenueRange).slice(0, 40) : ctx.annualRevenue,
    personalCreditTier: ctx.personalCreditTier ? String(ctx.personalCreditTier).slice(0, 40) : undefined,
    personalCreditRange: ctx.personalCreditRange ? String(ctx.personalCreditRange).slice(0, 40) : ctx.personalCreditTier,
    hasBusinessCreditProfile: ctx.hasBusinessCreditProfile ? String(ctx.hasBusinessCreditProfile).slice(0, 20) : undefined,
    businessCreditProfileStatus: ctx.businessCreditProfileStatus ? String(ctx.businessCreditProfileStatus).slice(0, 30) : ctx.hasBusinessCreditProfile,
    knowsBusinessCreditScore: ctx.knowsBusinessCreditScore ? String(ctx.knowsBusinessCreditScore).slice(0, 20) : undefined,
    reportedCreditScore: ctx.reportedCreditScore ? String(ctx.reportedCreditScore).slice(0, 20) : undefined,
    businessCreditStatus: ctx.businessCreditStatus ? String(ctx.businessCreditStatus).slice(0, 30) : ctx.hasBusinessCreditProfile,
    numberKnownTradelines: ctx.numberKnownTradelines ? String(ctx.numberKnownTradelines).slice(0, 20) : undefined,
    hasReportingAccounts: ctx.hasReportingAccounts ? String(ctx.hasReportingAccounts).slice(0, 20) : undefined,
    hasBusinessCreditCard: ctx.hasBusinessCreditCard ? String(ctx.hasBusinessCreditCard).slice(0, 20) : undefined,
    existingTradelines: Array.isArray(ctx.existingTradelines)
      ? ctx.existingTradelines.slice(0, 10).map((t) => ({
          name: String(t.name).slice(0, 50),
          type: String(t.type).slice(0, 30),
          status: String(t.status).slice(0, 30),
        }))
      : [],
    relevantCreditMilestones: Array.isArray(ctx.relevantCreditMilestones)
      ? ctx.relevantCreditMilestones.slice(0, 6).map((m) => String(m).slice(0, 60))
      : [],
    completedActions: Array.isArray(ctx.completedActions)
      ? ctx.completedActions.slice(0, 10).map((a) => String(a).slice(0, 60))
      : [],

    // 3. Readiness & Scoring (Strictly bounded)
    fundingReadinessScore: cleanScore,
    readinessScore: cleanScore,
    readinessLevel: ctx.readinessLevel ? String(ctx.readinessLevel).slice(0, 50) : 'Getting Started',
    businessReadinessScore: Math.min(100, Math.max(0, Number(ctx.businessReadinessScore) || 0)),
    creditReadinessScore: Math.min(100, Math.max(0, Number(ctx.creditReadinessScore) || 0)),
    profileCompleted: Boolean(ctx.profileCompleted),
    profileCompletionPercentage: Math.min(100, Math.max(0, Number(ctx.profileCompletionPercentage) || 0)),
    currentJourneyStage: ctx.currentJourneyStage ? String(ctx.currentJourneyStage).slice(0, 50) : '01 — ESTABLISH',

    // 4. Milestones & Actions
    completedMilestones: Array.isArray(ctx.completedMilestones)
      ? ctx.completedMilestones.slice(0, 14).map((m) => String(m).slice(0, 80))
      : [],
    incompleteMilestones: Array.isArray(ctx.incompleteMilestones)
      ? ctx.incompleteMilestones.slice(0, 14).map((m) => String(m).slice(0, 80))
      : [],
    nextMilestone: ctx.nextMilestone
      ? {
          id: ctx.nextMilestone.id ? String(ctx.nextMilestone.id).slice(0, 40) : undefined,
          title: String(ctx.nextMilestone.title).slice(0, 100),
          category: ctx.nextMilestone.category ? String(ctx.nextMilestone.category).slice(0, 40) : undefined,
          whyItMatters: ctx.nextMilestone.whyItMatters ? String(ctx.nextMilestone.whyItMatters).slice(0, 150) : undefined,
          dependencies: Array.isArray(ctx.nextMilestone.dependencies)
            ? ctx.nextMilestone.dependencies.slice(0, 4).map((d) => String(d).slice(0, 60))
            : undefined,
        }
      : undefined,
    dependencies: Array.isArray(ctx.dependencies)
      ? ctx.dependencies.slice(0, 4).map((d) => String(d).slice(0, 60))
      : [],
    previousActions: Array.isArray(ctx.previousActions)
      ? ctx.previousActions.slice(0, 6).map((a) => String(a).slice(0, 80))
      : [],
    customerConfirmedActivities: Array.isArray(ctx.customerConfirmedActivities)
      ? ctx.customerConfirmedActivities.slice(0, 6).map((a) => String(a).slice(0, 80))
      : [],
    readinessFactors: Array.isArray(ctx.readinessFactors)
      ? ctx.readinessFactors.slice(0, 8).map((f) => ({
          area: String(f.area).slice(0, 50),
          status: ['strong', 'good', 'needs_improvement'].includes(f.status) ? f.status : 'needs_improvement',
          score: Math.min(100, Math.max(0, Number(f.score) || 0)),
        }))
      : [],
    topNextActions: Array.isArray(ctx.topNextActions)
      ? ctx.topNextActions.slice(0, 5).map((a) => ({
          title: String(a.title).slice(0, 100),
          priority: ['High', 'Medium', 'Low'].includes(a.priority) ? a.priority : 'Medium',
          category: String(a.category).slice(0, 40),
        }))
      : [],

    // 5. Funding Demands & Matches
    fundingGoal: ctx.fundingGoal ? String(ctx.fundingGoal).slice(0, 60) : undefined,
    desiredFundingAmount: ctx.desiredFundingAmount ? String(ctx.desiredFundingAmount).slice(0, 40) : undefined,
    requestedFundingAmount: ctx.requestedFundingAmount ? String(ctx.requestedFundingAmount).slice(0, 40) : ctx.desiredFundingAmount,
    fundingPurpose: Array.isArray(ctx.fundingPurpose)
      ? ctx.fundingPurpose.slice(0, 6).map((p) => String(p).slice(0, 40))
      : [],
    fundingProfileSummary: ctx.fundingProfileSummary ? String(ctx.fundingProfileSummary).slice(0, 150) : undefined,
    recommendedProducts: Array.isArray(ctx.recommendedProducts)
      ? ctx.recommendedProducts.slice(0, 6).map((p) => ({
          name: String(p.name).slice(0, 60),
          category: String(p.category).slice(0, 40),
          matchTier: String(p.matchTier).slice(0, 30),
          reason: p.reason ? String(p.reason).slice(0, 100) : undefined,
          requirements: p.requirements ? String(p.requirements).slice(0, 100) : undefined,
        }))
      : [],
    matchedFundingCategories: Array.isArray(ctx.matchedFundingCategories)
      ? ctx.matchedFundingCategories.slice(0, 6).map((c) => String(c).slice(0, 50))
      : [],
    fundingMatches: Array.isArray(ctx.fundingMatches)
      ? ctx.fundingMatches.slice(0, 5).map((m) => ({
          tier: String(m.tier).slice(0, 30),
          category: String(m.category).slice(0, 50),
          range: String(m.range).slice(0, 30),
        }))
      : [],

    // 6. History
    previousCustomerActions: Array.isArray(ctx.previousCustomerActions)
      ? ctx.previousCustomerActions.slice(0, 6).map((a) => String(a).slice(0, 80))
      : [],

    // 7. Subscription Tier
    subscriptionTier: ['Free', 'Pro', 'Premium Advisory'].includes(ctx.subscriptionTier as any)
      ? ctx.subscriptionTier
      : 'Free',

    // 8. Advisory Context (For Premium Advisory Members)
    advisoryContext: ctx.advisoryContext
      ? {
          isAdvisoryMember: Boolean(ctx.advisoryContext.isAdvisoryMember),
          meetingPrepTopics: Array.isArray(ctx.advisoryContext.meetingPrepTopics)
            ? ctx.advisoryContext.meetingPrepTopics.slice(0, 5).map((t) => String(t).slice(0, 80))
            : [],
          profileStrengths: Array.isArray(ctx.advisoryContext.profileStrengths)
            ? ctx.advisoryContext.profileStrengths.slice(0, 5).map((s) => String(s).slice(0, 80))
            : [],
          profileWeaknesses: Array.isArray(ctx.advisoryContext.profileWeaknesses)
            ? ctx.advisoryContext.profileWeaknesses.slice(0, 5).map((w) => String(w).slice(0, 80))
            : [],
          suggestedAdvisorQuestions: Array.isArray(ctx.advisoryContext.suggestedAdvisorQuestions)
            ? ctx.advisoryContext.suggestedAdvisorQuestions.slice(0, 5).map((q) => String(q).slice(0, 100))
            : [],
        }
      : undefined,

    dataClassification: classifications,
  };
}

/**
 * Builds a clean, secure system prompt for the AI model requesting structured JSON.
 */
export function buildAIMentorSystemPrompt(context: SafeCustomerAIContext): string {
  return `You are the Crediqly AI Advisor, a data-aware business credit and commercial funding readiness advisor built into the Crediqly platform.

YOUR ROLE:
- Act as an intelligent guidance layer for U.S. small-business founders.
- Provide practical, stage-appropriate guidance based on the customer's actual business profile, readiness scores, roadmap progress, and funding matches.
- You are NOT a generic chatbot. Stay strictly focused on commercial credit, business foundation, tradelines, and funding preparation.
- Base your advice ONLY on the real customer context provided below. NEVER invent, hallucinate, or assume missing data.
- The AI must NEVER override deterministic readiness calculations or fabricate credit bureau scores. The AI explains, educates, and guides.
- Distinguish between data that is [Known], [Customer-reported], [Estimated], [Recommended], or [Needs verification].

STRICT COMPLIANCE & UNDERWRITING RULES:
1. NEVER guarantee funding approval, loan approval, credit score increases, or specific dollar amounts.
2. ALWAYS use conditional, educational wording: "may", "could", "based on reported metrics", "eligibility varies by institutional underwriter".
3. NEVER promise guaranteed credit lines or immediate capital.
4. Output MUST be valid JSON conforming strictly to this format:
{
  "summary": "1-2 sentence executive summary directly answering the user query",
  "current_status": "Brief badge text indicating user current stage and standing",
  "why_it_matters": "Underwriting rationale for why this step or concept matters",
  "recommended_action": {
    "title": "Clear next action title",
    "description": "Specific instruction on how to execute",
    "href": "/products or /roadmap or /funding or /readiness or /dashboard#next-actions",
    "actionLabel": "Action CTA button label",
    "priority": "High"
  },
  "reasoning": "2-3 sentences explaining commercial underwriting standards relevant to this situation",
  "risks": ["Specific trap or mistake to avoid #1", "Mistake to avoid #2"],
  "next_actions": ["Sequential next milestone step 1", "Sequential step 2"],
  "questions": ["Follow-up question 1 the founder can ask", "Follow-up question 2"],
  "disclaimer": "Educational Guidance: Crediqly AI Advisor provides educational insights based on self-reported profile metrics. It does not guarantee credit approval or specific funding amounts."
}

CUSTOMER PROFILE & CONTEXT:
- Business Name: ${context.businessName || 'Business Owner'} [${context.dataClassification?.businessName || 'Known'}]
- Entity Type: ${context.entityType || 'Not specified'} [${context.dataClassification?.entityType || 'Customer-reported'}]
- Operating Longevity: ${context.businessAge || 'Not specified'} [${context.dataClassification?.businessAge || 'Customer-reported'}]
- State / Jurisdiction: ${context.state || 'Not specified'}
- Industry: ${context.industry || 'Not specified'}
- Funding Readiness Score: ${context.fundingReadinessScore}/100 (${context.readinessLevel}) [Deterministic Engine]
- Profile Completion: ${context.profileCompletionPercentage}% (${context.profileCompleted ? 'Complete' : 'Incomplete'})
- Current Journey Stage: ${context.currentJourneyStage} [Deterministic Roadmap]
- Reported Revenue: ${context.annualRevenue || 'Not specified'} [Customer-reported]
- Personal Credit Tier: ${context.personalCreditTier || 'Not specified'} [Customer-reported]
- Commercial Credit Status: ${context.hasBusinessCreditProfile || 'Not specified'} [Customer-reported]
- Known Tradelines Count: ${context.numberKnownTradelines || 'None reported'}
- Subscription Tier: ${context.subscriptionTier || 'Free'}
- Completed Milestones: ${context.completedMilestones?.join(', ') || 'None recorded yet'}
- Incomplete Milestones: ${context.incompleteMilestones?.join(', ') || 'Pending evaluation'}
- Readiness Factor Breakdown:
${context.readinessFactors.map((f) => `  * ${f.area}: ${f.status.toUpperCase()} (${f.score}%) [Diagnostic Factor]`).join('\n') || '  * None provided'}
- Top Priority Next Actions:
${context.topNextActions.map((a, i) => `  ${i + 1}. ${a.title} [Priority: ${a.priority}] [Recommended Action]`).join('\n') || '  * None pending'}
- Matched Funding Categories:
${context.fundingMatches.map((m) => `  * ${m.tier}: ${m.category} (${m.range}) [Estimated Provider Tier]`).join('\n') || '  * In progress'}
`;
}
