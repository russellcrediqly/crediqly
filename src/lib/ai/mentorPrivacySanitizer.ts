import type { SafeCustomerAIContext } from '@/types/aiMentor';

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

  return {
    businessName: ctx.businessName ? String(ctx.businessName).slice(0, 80) : undefined,
    fundingReadinessScore: Math.min(100, Math.max(0, Number(ctx.fundingReadinessScore) || 0)),
    readinessLevel: ctx.readinessLevel ? String(ctx.readinessLevel).slice(0, 50) : 'Getting Started',
    businessReadinessScore: Math.min(100, Math.max(0, Number(ctx.businessReadinessScore) || 0)),
    creditReadinessScore: Math.min(100, Math.max(0, Number(ctx.creditReadinessScore) || 0)),
    profileCompleted: Boolean(ctx.profileCompleted),
    profileCompletionPercentage: Math.min(100, Math.max(0, Number(ctx.profileCompletionPercentage) || 0)),
    businessAge: ctx.businessAge ? String(ctx.businessAge).slice(0, 30) : undefined,
    annualRevenue: ctx.annualRevenue ? String(ctx.annualRevenue).slice(0, 40) : undefined,
    personalCreditTier: ctx.personalCreditTier ? String(ctx.personalCreditTier).slice(0, 40) : undefined,
    hasBusinessCreditProfile: ctx.hasBusinessCreditProfile ? String(ctx.hasBusinessCreditProfile).slice(0, 20) : undefined,
    entityType: ctx.entityType ? String(ctx.entityType).slice(0, 30) : undefined,
    fundingGoal: ctx.fundingGoal ? String(ctx.fundingGoal).slice(0, 60) : undefined,
    currentJourneyStage: ctx.currentJourneyStage ? String(ctx.currentJourneyStage).slice(0, 50) : '01 — ESTABLISH',
    readinessFactors: Array.isArray(ctx.readinessFactors)
      ? ctx.readinessFactors.slice(0, 8).map((f) => ({
          area: String(f.area).slice(0, 50),
          status: ['strong', 'good', 'needs_improvement'].includes(f.status) ? f.status : 'needs_improvement',
          score: Math.min(100, Math.max(0, Number(f.score) || 0)),
        }))
      : [],
    topNextActions: Array.isArray(ctx.topNextActions)
      ? ctx.topNextActions.slice(0, 3).map((a) => ({
          title: String(a.title).slice(0, 100),
          priority: ['High', 'Medium', 'Low'].includes(a.priority) ? a.priority : 'Medium',
          category: String(a.category).slice(0, 40),
        }))
      : [],
    fundingMatches: Array.isArray(ctx.fundingMatches)
      ? ctx.fundingMatches.slice(0, 3).map((m) => ({
          tier: String(m.tier).slice(0, 30),
          category: String(m.category).slice(0, 50),
          range: String(m.range).slice(0, 30),
        }))
      : [],
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
- If an area is not provided or incomplete, recommend that the customer update their business profile to receive accurate guidance.

STRICT COMPLIANCE RULES:
1. NEVER guarantee funding approval, loan approval, credit score increases, or specific dollar amounts.
2. ALWAYS use conditional, educational wording: "may", "could", "based on the information provided", "eligibility varies by provider".
3. Keep responses SHORT, practical, specific, and action-oriented (strictly 2 to 4 sentences).
4. Do NOT output markdown headers, giant lists, or conversational filler like "Hello there!". Give a direct, punchy answer.

CUSTOMER CONTEXT:
- Business: ${context.businessName || 'Business Owner'}
- Funding Readiness Score: ${context.fundingReadinessScore}/100 (${context.readinessLevel})
- Profile Completion: ${context.profileCompletionPercentage}% (${context.profileCompleted ? 'Complete' : 'Incomplete'})
- Current Journey Stage: ${context.currentJourneyStage}
- Operating Longevity: ${context.businessAge || 'Not specified'}
- Reported Revenue: ${context.annualRevenue || 'Not specified'}
- Commercial Credit Status: ${context.hasBusinessCreditProfile || 'Not specified'}
- Funding Focus: ${context.fundingGoal || 'General working capital'}
- Readiness Factor Breakdown:
${context.readinessFactors.map((f) => `  * ${f.area}: ${f.status.toUpperCase()} (${f.score}%)`).join('\n') || '  * None provided'}
- Top Priority Next Actions:
${context.topNextActions.map((a, i) => `  ${i + 1}. ${a.title} [Priority: ${a.priority}]`).join('\n') || '  * None pending'}
- Matched Funding Categories:
${context.fundingMatches.map((m) => `  * ${m.tier}: ${m.category} (${m.range})`).join('\n') || '  * In progress'}
`;
}
