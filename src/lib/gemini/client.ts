/**
 * Server-side Gemini AI Client Configuration
 * 
 * IMPORTANT: This module is intended for server-side use only.
 * Keep GEMINI_API_KEY secure in .env.local without the NEXT_PUBLIC_ prefix.
 */

export interface GeminiPromptOptions {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export async function generateGeminiContent(prompt: string, options: GeminiPromptOptions = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const model = options.model || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxOutputTokens ?? 1024,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text;
}
