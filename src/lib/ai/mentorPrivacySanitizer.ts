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
  /(?:sk_live|sk_test|sb_secret|ghp_|eyJh)[a-zA-Z0-9_\-]{16,}/gi,
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

  return {
    businessName: ctx.businessName ? String(ctx.businessName).slice(0, 80) : undefined,
    entityType: ctx.entityType ? String(ctx.entityType).slice(0, 30) : undefined,
    businessAge: ctx.businessAge ? String(ctx.businessAge).slice(0, 30) : undefined,
    state: ctx.state ? String(ctx.state).slice(0, 30) : undefined,
    industry: ctx.industry ? String(ctx.industry).slice(0, 50) : undefined,

    annualRevenue: ctx.annualRevenue ? String(ctx.annualRevenue).slice(0, 40) : undefined,
    revenueRange: ctx.revenueRange ? String(ctx.revenueRange).slice(0, 40) : ctx.annualRevenue,
    personalCreditTier: ctx.personalCreditTier ? String(ctx.personalCreditTier).slice(0, 40) : undefined,
    personalCreditRange: ctx.personalCreditRange ? String(ctx.personalCreditRange).slice(0, 40) : ctx.personalCreditTier,
    hasBusinessCreditProfile: ctx.hasBusinessCreditProfile ? String(ctx.hasBusinessCreditProfile).slice(0, 20) : undefined,
    businessCreditStatus: ctx.businessCreditStatus ? String(ctx.businessCreditStatus).slice(0, 30) : ctx.hasBusinessCreditProfile,
    existingTradelines: Array.isArray(ctx.existingTradelines)
      ? ctx.existingTradelines.slice(0, 10).map((t) => ({
          name: String(t.name).slice(0, 50),
          type: String(t.type).slice(0, 30),
          status: String(t.status).slice(0, 30),
        }))
      : [],

    fundingReadinessScore: Math.min(100, Math.max(0, Number(ctx.fundingReadinessScore) || 0)),
    readinessLevel: ctx.readinessLevel ? String(ctx.readinessLevel).slice(0, 50) : 'Getting Started',
    businessReadinessScore: Math.min(100, Math.max(0, Number(ctx.businessReadinessScore) || 0)),
    creditReadinessScore: Math.min(100, Math.max(0, Number(ctx.creditReadinessScore) || 0)),
    profileCompleted: Boolean(ctx.profileCompleted),
    profileCompletionPercentage: Math.min(100, Math.max(0, Number(ctx.profileCompletionPercentage) || 0)),
    currentJourneyStage: ctx.currentJourneyStage ? String(ctx.currentJourneyStage).slice(0, 50) : '01 — ESTABLISH',

    completedMilestones: Array.isArray(ctx.completedMilestones)
      ? ctx.completedMilestones.slice(0, 14).map((m) => String(m).slice(0, 80))
      : [],
    incompleteMilestones: Array.isArray(ctx.incompleteMilestones)
      ? ctx.incompleteMilestones.slice(0, 14).map((m) => String(m).slice(0, 80))
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

    fundingGoal: ctx.fundingGoal ? String(ctx.fundingGoal).slice(0, 60) : undefined,
    requestedFundingAmount: ctx.requestedFundingAmount ? String(ctx.requestedFundingAmount).slice(0, 40) : undefined,
    fundingPurpose: Array.isArray(ctx.fundingPurpose)
      ? ctx.fundingPurpose.slice(0, 6).map((p) => String(p).slice(0, 40))
      : [],
    recommendedProducts: Array.isArray(ctx.recommendedProducts)
      ? ctx.recommendedProducts.slice(0, 6).map((p) => ({
          name: String(p.name).slice(0, 60),
          category: String(p.category).slice(0, 40),
          matchTier: String(p.matchTier).slice(0, 30),
        }))
      : [],
    fundingMatches: Array.isArray(ctx.fundingMatches)
      ? ctx.fundingMatches.slice(0, 5).map((m) => ({
          tier: String(m.tier).slice(0, 30),
          category: String(m.category).slice(0, 50),
          range: String(m.range).slice(0, 30),
        }))
      : [],

    previousCustomerActions: Array.isArray(ctx.previousCustomerActions)
      ? ctx.previousCustomerActions.slice(0, 6).map((a) => String(a).slice(0, 80))
      : [],
    customerConfirmedActivities: Array.isArray(ctx.customerConfirmedActivities)
      ? ctx.customerConfirmedActivities.slice(0, 6).map((a) => String(a).slice(0, 80))
      : [],

    dataClassification: classifications,
  };
}

/**
 * Builds a clean, secure system prompt for the Gemini AI model.
 */
export function buildAIMentorSystemPrompt(context: SafeCustomerAIContext): string {
  return `You are the Crediqly AI Mentor, a data-aware business credit and commercial funding readiness advisor built into the Crediqly platform.

YOUR ROLE:
- Help the customer understand their specific Crediqly profile, readiness scores, roadmap progress, and funding matches.
- You are NOT a generic conversational chatbot. Stay strictly focused on commercial credit, business readiness, and funding preparation.
- Base your advice ONLY on the real customer context provided below. NEVER invent, hallucinate, or assume missing data.
- The AI must NEVER override deterministic readiness calculations. The AI should explain and guide the customer, not manufacture scores.
- Distinguish between data that is [Known], [Customer-reported], [Estimated], [Recommended], or [Needs verification].

STRICT COMPLIANCE RULES:
1. NEVER guarantee funding approval, loan approval, credit score increases, or specific dollar amounts.
2. ALWAYS use conditional, educational wording: "may", "could", "based on the information provided", "eligibility varies by provider".
3. Keep responses SHORT, practical, specific, and action-oriented (strictly 2 to 4 sentences).
4. Do NOT output markdown headers, giant lists, or conversational filler like "Hello there!". Give a direct, punchy answer.

CUSTOMER CONTEXT:
- Business: ${context.businessName || 'Business Owner'} [${context.dataClassification?.businessName || 'Known'}]
- Entity Type: ${context.entityType || 'Not specified'} [${context.dataClassification?.entityType || 'Customer-reported'}]
- Operating Longevity: ${context.businessAge || 'Not specified'} [${context.dataClassification?.businessAge || 'Customer-reported'}]
- State / Jurisdiction: ${context.state || 'Not specified'}
- Industry: ${context.industry || 'Not specified'}
- Funding Readiness Score: ${context.fundingReadinessScore}/100 (${context.readinessLevel}) [Deterministic Estimate]
- Profile Completion: ${context.profileCompletionPercentage}% (${context.profileCompleted ? 'Complete' : 'Incomplete'})
- Current Journey Stage: ${context.currentJourneyStage} [Deterministic Roadmap]
- Reported Revenue: ${context.annualRevenue || 'Not specified'} [Customer-reported]
- Personal Credit Tier: ${context.personalCreditTier || 'Not specified'} [Customer-reported]
- Commercial Credit Status: ${context.hasBusinessCreditProfile || 'Not specified'} [Customer-reported]
- Funding Focus: ${context.fundingGoal || 'General working capital'} [Customer-reported]
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
