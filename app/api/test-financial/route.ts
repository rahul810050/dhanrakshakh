import { NextRequest, NextResponse } from 'next/server';

// Test endpoint to verify the Financial Insights Engine works
export async function GET() {
  try {
    // Dynamic import to ensure this only runs on server
    const { answer } = await import('../../../Financial_Insights_Engine/answer.js');
    
    const testQuestion = "What are some good investment options for beginners?";
    const result = await answer(testQuestion);
    
    return NextResponse.json({ 
      success: true,
      question: testQuestion,
      response: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';