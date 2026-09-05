import { NextResponse } from 'next/server';
import { generateGeminiContent } from '@/lib/gemini/client';
import {
  sanitizeUserPrompt,
  sanitizeCustomerContext,
  buildAIMentorSystemPrompt,
} from '@/lib/ai/mentorPrivacySanitizer';
import { generateDeterministicAIMentorAnswer } from '@/lib/ai/mentorFallbackEngine';
import type { AIMentorResponse, AIMentorNextStep } from '@/types/aiMentor';

const DISCLAIMER =
  'Educational Guidance: Crediqly AI Mentor provides educational insights based on self-reported profile metrics. It does not guarantee credit approval or specific funding amounts.';

function determineNextStep(question: string, context: any): AIMentorNextStep {
  const q = question.toLowerCase();
  if (q.includes('roadmap') || q.includes('stage') || q.includes('milestone')) {
    return { label: 'Open Roadmap', href: '/roadmap', reason: 'Review current active milestones' };
  }
  if (q.includes('funding') || q.includes('loan') || q.includes('apply') || q.includes('match')) {
    return { label: 'Explore Funding Matches', href: '/funding', reason: 'Review provider requirements' };
  }
  if (q.includes('readiness') || q.includes('score') || q.includes('lower') || q.includes('weak')) {
    return { label: 'View Readiness Audit', href: '/readiness?tab=funding', reason: 'See detailed gap analysis' };
  }
  return { label: 'View Next Actions', href: '/dashboard#next-actions', reason: 'Take next priority action' };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawQuestion = body?.question || '';
    const rawContext = body?.context || {};

    const sanitizedQuestion = sanitizeUserPrompt(rawQuestion);
    if (!sanitizedQuestion) {
      return NextResponse.json(
        { error: 'A question or topic is required to consult the AI Mentor.' },
        { status: 400 }
      );
    }

    const safeContext = sanitizeCustomerContext(rawContext);

    // If GEMINI_API_KEY is configured on the server, attempt live model generation
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
      try {
        const systemPrompt = buildAIMentorSystemPrompt(safeContext);
        const fullPrompt = `${systemPrompt}\n\nUser Question: "${sanitizedQuestion}"\n\nProvide your concise, practical response (2–3 sentences, action-oriented, zero approval guarantees):`;

        const aiText = await generateGeminiContent(fullPrompt, {
          temperature: 0.3,
          maxOutputTokens: 250,
        });

        if (aiText && aiText.trim().length > 0) {
          const responsePayload: AIMentorResponse = {
            answer: aiText.trim(),
            nextStep: determineNextStep(sanitizedQuestion, safeContext),
            source: 'ai_model',
            disclaimer: DISCLAIMER,
          };
          return NextResponse.json(responsePayload);
        }
      } catch (geminiError: any) {
        console.warn('Gemini AI call failed, gracefully activating deterministic fallback:', geminiError.message);
      }
    }

    // High-precision fallback when API key is unconfigured or provider is offline
    const fallbackResponse = generateDeterministicAIMentorAnswer(sanitizedQuestion, safeContext);
    return NextResponse.json(fallbackResponse);
  } catch (error: any) {
    console.error('Unhandled AI Mentor API exception:', error);
    // Even on error, return safe fallback instead of breaking the dashboard
    return NextResponse.json({
      answer: 'Crediqly AI Mentor is currently operating in offline mode. You can continue reviewing your live readiness scores and recommendations.',
      nextStep: {
        label: 'View Recommendations',
        href: '/dashboard',
      },
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
    });
  }
}
