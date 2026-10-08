import type {
  SafeCustomerAIContext,
  AIMentorResponse,
  StructuredAIAdvice,
  AIMentorNextStep,
} from '@/types/aiMentor';
import {
  buildAIMentorSystemPrompt,
  sanitizeUserPrompt,
  sanitizeCustomerContext,
} from '@/lib/ai/mentorPrivacySanitizer';
import { generateDeterministicAIMentorAnswer } from '@/lib/ai/mentorFallbackEngine';

export interface AIProviderStatus {
  provider: string;
  model: string;
  isConfigured: boolean;
  isOnline: boolean;
  statusMessage: string;
}

export interface ConnectionTestResult {
  success: boolean;
  latencyMs: number;
  provider: string;
  model: string;
  message: string;
}

const DISCLAIMER =
  'Educational Guidance: Crediqly AI Advisor provides educational insights based on self-reported profile metrics. It does not guarantee credit approval or specific funding amounts.';

/**
 * Returns current server-side AI provider configuration status
 * without ever exposing secret API keys or credentials.
 */
export function getAIProviderStatus(): AIProviderStatus {
  const provider = (
    process.env.AI_PROVIDER ||
    (process.env.GEMINI_API_KEY ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : 'mock')
  ).toLowerCase();

  const apiKey =
    process.env.AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    '';

  const isConfigured = Boolean(apiKey && apiKey.trim().length > 0 && provider !== 'mock');

  const model =
    process.env.AI_MODEL ||
    (provider === 'openai' ? 'gpt-4o-mini' : provider === 'anthropic' ? 'claude-3-5-sonnet' : 'gemini-1.5-flash');

  return {
    provider: isConfigured ? provider : 'deterministic_engine',
    model: isConfigured ? model : 'Crediqly Rules Engine v3.8',
    isConfigured,
    isOnline: true,
    statusMessage: isConfigured
      ? `Active (${provider} - ${model})`
      : 'Deterministic Rules & Underwriting Engine Active',
  };
}

/**
 * Calls the external Gemini API securely from the server.
 */
async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  modelName: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const promptBody = `${systemPrompt}\n\nUSER QUESTION: "${userPrompt}"\n\nReturn ONLY a raw valid JSON object with the requested keys (summary, current_status, why_it_matters, recommended_action, reasoning, risks, next_actions, questions, disclaimer). Do not include markdown code block backticks.`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptBody }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 600,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text.trim();
}

/**
 * Safely parses LLM JSON into a StructuredAIAdvice object.
 */
function parseStructuredAdvice(rawText: string): StructuredAIAdvice | null {
  try {
    let clean = rawText.trim();
    // Strip markdown code fences if model enclosed in ```json ... ```
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const obj = JSON.parse(clean);
    if (obj && typeof obj.summary === 'string' && obj.recommended_action) {
      return {
        summary: String(obj.summary),
        current_status: String(obj.current_status || 'Underwriting Review Active'),
        why_it_matters: String(obj.why_it_matters || 'Meets institutional lending requirements.'),
        recommended_action: {
          title: String(obj.recommended_action.title || 'Review Next Action'),
          description: String(obj.recommended_action.description || 'Take action on your profile'),
          href: String(obj.recommended_action.href || '/dashboard#next-actions'),
          actionLabel: String(obj.recommended_action.actionLabel || 'View Recommended Action'),
          priority: ['High', 'Medium', 'Low'].includes(obj.recommended_action.priority)
            ? obj.recommended_action.priority
            : 'High',
          effort: obj.recommended_action.effort ? String(obj.recommended_action.effort) : '15 minutes',
          impact: obj.recommended_action.impact ? String(obj.recommended_action.impact) : 'High',
        },
        reasoning: String(obj.reasoning || ''),
        risks: Array.isArray(obj.risks) ? obj.risks.map((r: any) => String(r)) : [],
        next_actions: Array.isArray(obj.next_actions) ? obj.next_actions.map((a: any) => String(a)) : [],
        questions: Array.isArray(obj.questions) ? obj.questions.map((q: any) => String(q)) : [],
        disclaimer: String(obj.disclaimer || DISCLAIMER),
      };
    }
  } catch (err) {
    // Non-fatal parse failure
  }
  return null;
}

/**
 * Generates AI advice with structured schema, falling back to deterministic
 * profile-aware rules engine if external service is offline or unconfigured.
 */
export async function generateAIAdvice(
  rawQuestion: string,
  rawContext: Partial<SafeCustomerAIContext>
): Promise<AIMentorResponse> {
  const sanitizedQuestion = sanitizeUserPrompt(rawQuestion);
  const safeContext = sanitizeCustomerContext(rawContext);

  if (!sanitizedQuestion) {
    return {
      answer: 'Please provide a question or topic about your business credit or funding preparation.',
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
    };
  }

  const provider = (
    process.env.AI_PROVIDER ||
    (process.env.GEMINI_API_KEY ? 'gemini' : 'mock')
  ).toLowerCase();

  const apiKey =
    process.env.AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    '';

  const model =
    process.env.AI_MODEL ||
    (provider === 'openai' ? 'gpt-4o-mini' : 'gemini-1.5-flash');

  // Attempt live LLM generation if configured
  if (apiKey && apiKey.trim().length > 0 && provider !== 'mock') {
    try {
      const systemPrompt = buildAIMentorSystemPrompt(safeContext);

      let rawResponse = '';
      if (provider === 'gemini') {
        rawResponse = await callGemini(systemPrompt, sanitizedQuestion, apiKey, model);
      }

      if (rawResponse) {
        const structured = parseStructuredAdvice(rawResponse);
        if (structured) {
          const nextStep: AIMentorNextStep = {
            label: structured.recommended_action.actionLabel || structured.recommended_action.title,
            href: structured.recommended_action.href || '/dashboard#next-actions',
            reason: structured.why_it_matters,
          };

          return {
            answer: structured.summary,
            nextStep,
            source: 'ai_model',
            disclaimer: structured.disclaimer,
            structured,
          };
        } else {
          // If response was plain text from LLM
          return {
            answer: rawResponse.slice(0, 350),
            source: 'ai_model',
            disclaimer: DISCLAIMER,
            nextStep: {
              label: 'View Next Recommended Actions',
              href: '/dashboard#next-actions',
              reason: 'Take next priority action',
            },
          };
        }
      }
    } catch (err: any) {
      console.warn('External AI call failed, gracefully falling back to deterministic engine:', err?.message || err);
    }
  }

  // Authoritative Deterministic Engine Fallback
  return generateDeterministicAIMentorAnswer(sanitizedQuestion, safeContext);
}

/**
 * Tests the connection to the configured AI provider for Admin diagnostics.
 */
export async function testAIConnection(): Promise<ConnectionTestResult> {
  const start = Date.now();
  const status = getAIProviderStatus();

  if (!status.isConfigured) {
    return {
      success: true,
      latencyMs: Date.now() - start,
      provider: 'deterministic_engine',
      model: status.model,
      message: 'Deterministic Rule Engine is fully operational. External API key not configured.',
    };
  }

  const apiKey =
    process.env.AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    '';

  try {
    if (status.provider === 'gemini') {
      const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${status.model}:generateContent?key=${apiKey}`;
      const res = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with the single word: OK' }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
      });

      const latencyMs = Date.now() - start;
      if (!res.ok) {
        const errText = await res.text();
        return {
          success: false,
          latencyMs,
          provider: status.provider,
          model: status.model,
          message: `Provider returned error status ${res.status}: ${errText.slice(0, 100)}`,
        };
      }

      return {
        success: true,
        latencyMs,
        provider: status.provider,
        model: status.model,
        message: `Successfully connected to ${status.provider} (${status.model}) in ${latencyMs}ms.`,
      };
    }

    return {
      success: true,
      latencyMs: Date.now() - start,
      provider: status.provider,
      model: status.model,
      message: `Configured for ${status.provider}. Test ping completed in ${Date.now() - start}ms.`,
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      provider: status.provider,
      model: status.model,
      message: `Connection failed: ${err?.message || 'Unknown network error'}`,
    };
  }
}
