import { NextResponse } from 'next/server';
import { generateGeminiContent } from '@/lib/gemini/client';

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { message: 'Gemini integration is prepared, but GEMINI_API_KEY is not set yet.' },
        { status: 503 }
      );
    }

    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    const aiResponse = await generateGeminiContent(prompt);
    return NextResponse.json({ result: aiResponse });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error processing AI readiness analysis' },
      { status: 500 }
    );
  }
}
