import { NextRequest, NextResponse } from 'next/server';

// Import the answer function from the Financial Insights Engine
async function getFinancialAnswer(question: string) {
  try {
    // Dynamic import to ensure this only runs on server
    const { answer } = await import('../../../Financial_Insights_Engine/answer.js');
    const result = await answer(question);
    return result;
  } catch (error) {
    console.error('Error calling Financial Insights Engine:', error);
    
    // Provide fallback responses for common questions
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('investment') && lowerQuestion.includes('beginner')) {
      return `For beginners, I recommend:

1. **Start with SIPs**: Systematic Investment Plans in diversified mutual funds
2. **Emergency Fund**: 6 months of expenses in liquid funds
3. **Tax-saving**: ELSS funds under Section 80C
4. **Long-term**: Large-cap and mid-cap equity funds

Key principles:
- Start small but start now
- Diversify across asset classes  
- Review annually
- Stay invested for long term

Would you like specific fund recommendations?`;
    }
    
    if (lowerQuestion.includes('tax') || lowerQuestion.includes('save')) {
      return `Tax-saving options under Section 80C (₹1.5L limit):

1. **ELSS Mutual Funds** - Best returns, 3-year lock-in
2. **PPF** - Safe, 15-year lock-in, tax-free returns
3. **EPF** - Employer contribution
4. **NSC/Tax-saving FDs** - Fixed returns

Additional deductions:
- Health Insurance (80D): ₹25K-50K
- NPS (80CCD1B): ₹50K extra

Start with ELSS for growth + tax benefits!`;
    }
    
    if (lowerQuestion.includes('retirement')) {
      return `Retirement Planning Basics:

1. **Start Early**: Compounding works best over time
2. **Target**: 25-30x your annual expenses
3. **Asset Mix**: 
   - Young: 70% equity, 30% debt
   - Near retirement: 40% equity, 60% debt

4. **Vehicles**: EPF, PPF, NPS, Mutual Funds
5. **Save**: At least 20% of income

The earlier you start, the less you need to save monthly!`;
    }
    
    return `I'm currently experiencing high demand. Here's what I can help you with:

• Investment strategies for beginners
• Tax-saving under Section 80C
• Retirement planning basics  
• SIP calculations
• Expense management tips

Please try asking a specific question about any of these topics, or try again in a few minutes.`;
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

    // Validate question length
    if (question.length > 500) {
      return NextResponse.json(
        { error: 'Question is too long. Please keep it under 500 characters.' },
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
    
    // Return a helpful error message instead of generic error
    return NextResponse.json(
      { 
        response: `I'm currently experiencing high demand and cannot process your request right now. Please try again in a few minutes.

In the meantime, here are some quick tips:
• For investments: Start with SIP in diversified mutual funds
• For tax saving: Consider ELSS funds under Section 80C  
• For retirement: Aim to save 20% of your income
• For emergencies: Keep 6 months expenses in liquid funds

Try asking a simpler, more specific question when you retry!`,
        error: true,
        timestamp: new Date().toISOString()
      },
      { status: 200 } // Return 200 so the frontend can display the fallback message
    );
  }
}

export const dynamic = 'force-dynamic';