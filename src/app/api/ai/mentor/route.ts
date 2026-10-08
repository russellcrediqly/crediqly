import { NextResponse } from 'next/server';
import {
  sanitizeUserPrompt,
  sanitizeCustomerContext,
} from '@/lib/ai/mentorPrivacySanitizer';
import { generateAIAdvice } from '@/lib/ai/aiProviderService';
import { generateDeterministicAdvisoryPrep } from '@/lib/ai/mentorFallbackEngine';
import type { AIMentorResponse } from '@/types/aiMentor';

const DISCLAIMER =
  'Educational Guidance: Crediqly AI Advisor provides educational insights based on self-reported profile metrics. It does not guarantee credit approval or specific funding amounts.';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body?.action;
    const rawQuestion = body?.question || '';
    const rawContext = body?.context || {};

    const safeContext = sanitizeCustomerContext(rawContext);

    // If requested action is Advisory Meeting Prep (for Premium Advisory users)
    if (action === 'advisory_prep') {
      const advisoryPrep = generateDeterministicAdvisoryPrep(safeContext);
      const prepPayload: AIMentorResponse = {
        answer: advisoryPrep.situationSummary,
        source: 'deterministic_fallback',
        disclaimer: DISCLAIMER,
        advisoryPrep,
        nextStep: {
          label: 'Request Consultation',
          href: '/consultation',
          reason: 'Review agenda with dedicated human advisor',
        },
      };
      return NextResponse.json(prepPayload);
    }

    const sanitizedQuestion = sanitizeUserPrompt(rawQuestion);
    if (!sanitizedQuestion) {
      return NextResponse.json(
        { error: 'A question or topic is required to consult the AI Advisor.' },
        { status: 400 }
      );
    }

    // Call unified AI provider service (Gemini / External with graceful deterministic fallback)
    const responsePayload = await generateAIAdvice(sanitizedQuestion, safeContext);
    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error('Unhandled AI Mentor API exception:', error);
    // Safe degradation: never crash or return raw stack traces
    return NextResponse.json({
      answer: 'Crediqly AI Advisor is currently operating in offline mode. You can continue reviewing your live readiness scores and recommendations.',
      nextStep: {
        label: 'View Recommendations',
        href: '/dashboard',
        reason: 'Review current profile status',
      },
      source: 'deterministic_fallback',
      disclaimer: DISCLAIMER,
    });
  }
}
