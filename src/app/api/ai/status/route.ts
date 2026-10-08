import { NextResponse } from 'next/server';
import { getAIProviderStatus, testAIConnection } from '@/lib/ai/aiProviderService';

export async function GET() {
  try {
    const status = getAIProviderStatus();
    return NextResponse.json(status);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to retrieve AI provider status' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await testAIConnection();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        latencyMs: 0,
        provider: 'unknown',
        model: 'unknown',
        message: err?.message || 'Test connection failed',
      },
      { status: 500 }
    );
  }
}
