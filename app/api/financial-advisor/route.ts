import { NextRequest, NextResponse } from 'next/server';

// Import the answer function from the Financial Insights Engine
// This will only run on the server side
async function getFinancialAnswer(question: string) {
  try {
    // Dynamic import to ensure this only runs on server
    const { answer } = await import('../../../Financial_Insights_Engine/answer.js');
    const result = await answer(question);
    return result;
  } catch (error) {
    console.error('Error calling Financial Insights Engine:', error);
    throw new Error('Failed to get financial advice');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required and must be a string' },
        { status: 400 }
      );
    }

    // Get the AI response from the Financial Insights Engine
    const aiResponse = await getFinancialAnswer(question);

    return NextResponse.json({ 
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process financial advice request' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';