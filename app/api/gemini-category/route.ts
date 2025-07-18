// app/api/gemini-category/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  const prompt = `
    Given this receipt text:
    "${text}"

    What is the most appropriate expense category from this list?
    [Food & Dining, Groceries, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Education, Travel, Other]

    Respond ONLY with the best category.
  `;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  const result = await res.json();
  const suggestedCategory = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  return NextResponse.json({ suggestedCategory });
}
