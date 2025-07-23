import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();
import {
  getFinancialData,
  getBankTransactions,
  getCreditReport,
  getEPFDetails,
  getMFTransactions,
  getStockTransactions,
  getNetWorth
} from "./testClient.js";

// Initialize Gemini with gemini-1.5-flash model (has higher rate limits)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Rate limiting variables
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests
let requestCount = 0;
const MAX_REQUESTS_PER_MINUTE = 15;
const requestTimes = [];

// Helper function to wait between requests
async function rateLimitedRequest(requestFn) {
  const now = Date.now();
  
  // Clean old request times (older than 1 minute)
  while (requestTimes.length > 0 && now - requestTimes[0] > 60000) {
    requestTimes.shift();
  }
  
  // Check if we've exceeded rate limit
  if (requestTimes.length >= MAX_REQUESTS_PER_MINUTE) {
    const waitTime = 60000 - (now - requestTimes[0]) + 1000; // Wait until oldest request is > 1 minute old
    console.log(`Rate limit reached. Waiting ${waitTime}ms...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  // Ensure minimum interval between requests
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  try {
    requestTimes.push(Date.now());
    lastRequestTime = Date.now();
    return await requestFn();
  } catch (error) {
    if (error.status === 429) {
      // Extract retry delay from error if available
      const retryDelay = error.errorDetails?.find(detail => 
        detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
      )?.retryDelay;
      
      let waitTime = 30000; // Default 30 seconds
      if (retryDelay) {
        const seconds = parseInt(retryDelay.replace('s', ''));
        waitTime = (seconds + 5) * 1000; // Add 5 seconds buffer
      }
      
      console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Retry once
      requestTimes.push(Date.now());
      lastRequestTime = Date.now();
      return await requestFn();
    }
    throw error;
  }
}

// Main function to handle the user's financial question
async function analyzeAndRespond(userQuestion) {
  try {
    // First try to analyze the question
    let analysis;
    try {
      analysis = await rateLimitedRequest(() => analyzeQuestion(userQuestion));
    } catch (error) {
      console.error("Error analyzing question:", error);
      // Fallback to simple keyword-based analysis
      analysis = fallbackAnalyzeQuestion(userQuestion);
    }
    
    const data = {};

    // Conditionally fetch data based on the analysis
    if (analysis.needsBankData) {
      try {
        data.bankTransactions = await getBankTransactions();
      } catch (error) {
        console.error("Error fetching bank data:", error);
      }
    }

    if (analysis.needsCreditData) {
      try {
        data.creditReport = await getCreditReport();
      } catch (error) {
        console.error("Error fetching credit data:", error);
      }
    }

    if (analysis.needsEPFData) {
      try {
        data.epfDetails = await getEPFDetails();
      } catch (error) {
        console.error("Error fetching EPF data:", error);
      }
    }

    if (analysis.needsMFData) {
      try {
        data.mfTransactions = await getMFTransactions();
      } catch (error) {
        console.error("Error fetching MF data:", error);
      }
    }

    if (analysis.needsStockData) {
      try {
        data.stockTransactions = await getStockTransactions();
      } catch (error) {
        console.error("Error fetching stock data:", error);
      }
    }

    if (analysis.needsNetWorth) {
      try {
        data.netWorth = await getNetWorth();
      } catch (error) {
        console.error("Error fetching net worth data:", error);
      }
    }

    // Route the request based on the detected intent
    switch (analysis.intent) {
      case 'expense':
        if (!data.bankTransactions) {
          return "I couldn't retrieve the necessary bank data to answer your expense question. Please try again later.";
        }
        return await rateLimitedRequest(() => getExpense({
          transactions: data.bankTransactions,
          question: userQuestion,
          timePeriod: analysis.timePeriod,
          merchant: analysis.merchant,
          category: analysis.category
        }));

      case 'investment':
        return await rateLimitedRequest(() => getInvestmentAdvice({
          question: userQuestion,
          netWorth: data.netWorth,
          creditScore: data.creditReport?.score,
          epfData: data.epfDetails,
          mfTransactions: data.mfTransactions,
          stockTransactions: data.stockTransactions
        }));

      case 'chart':
        if (!data.bankTransactions) {
          return "I couldn't retrieve the necessary transaction data to generate a chart. Please try again later.";
        }
        return await rateLimitedRequest(() => getChart({
          transactions: data.bankTransactions,
          question: userQuestion,
          timePeriod: analysis.timePeriod,
          category: analysis.category
        }));

      case 'credit':
        if (!data.creditReport) {
          return "I couldn't retrieve your credit report to answer your question. Please try again later.";
        }
        return await rateLimitedRequest(() => getCreditAnalysis({
          creditReport: data.creditReport,
          question: userQuestion
        }));

        case 'net_worth':
          // console.log("HELLO")
          if (!data.netWorth || !data.mfTransactions || !data.stockTransactions) {
            // console.log("HELLO");
            return "I couldn't retrieve your necessary information to answer your question.";
          }
          return await getAssets({
            
            question: userQuestion,
            netWorth: data.netWorth,
            mfTransactions:data.mfTransactions,
            stockTransactions:data.stockTransactions,
          });

      default:
        // For general questions, use fallback responses or simple AI
        return await handleGeneralQuestion(userQuestion);
    }
  } catch (error) {
    console.error("Error processing question:", error);
    return "I'm experiencing high demand right now. Please try asking your question again in a few moments, or try rephrasing it more simply.";
  }
}

// Fallback question analysis using keywords
function fallbackAnalyzeQuestion(question) {
  const lowerQuestion = question.toLowerCase();
  
  let intent = 'general';
  let needsBankData = false;
  let needsCreditData = false;
  let needsEPFData = false;
  let needsMFData = false;
  let needsStockData = false;
  let needsNetWorth = false;
  
  // Expense keywords
  if (lowerQuestion.includes('spend') || lowerQuestion.includes('expense') || 
      lowerQuestion.includes('transaction') || lowerQuestion.includes('payment')) {
    intent = 'expense';
    needsBankData = true;
  }
  
  // Investment keywords
  else if (lowerQuestion.includes('invest') || lowerQuestion.includes('portfolio') || 
           lowerQuestion.includes('mutual fund') || lowerQuestion.includes('stock')) {
    intent = 'investment';
    needsNetWorth = true;
    needsMFData = true;
    needsStockData = true;
  }
  
  // Credit keywords
  else if (lowerQuestion.includes('credit') || lowerQuestion.includes('score') || 
           lowerQuestion.includes('loan')) {
    intent = 'credit';
    needsCreditData = true;
  }
  
  // Net worth keywords
  else if (lowerQuestion.includes('net worth') || lowerQuestion.includes('assets') || 
           lowerQuestion.includes('wealth')) {
    intent = 'net_worth';
    needsNetWorth = true;
  }
  
  // Chart keywords
  else if (lowerQuestion.includes('chart') || lowerQuestion.includes('graph') || 
           lowerQuestion.includes('visualize')) {
    intent = 'chart';
    needsBankData = true;
  }
  
  return {
    intent,
    needsBankData,
    needsCreditData,
    needsEPFData,
    needsMFData,
    needsStockData,
    needsNetWorth
  };
}

// Handle general questions with fallback responses
async function handleGeneralQuestion(question) {
  const lowerQuestion = question.toLowerCase();
  
  // Common financial questions with predefined answers
  if (lowerQuestion.includes('investment') && lowerQuestion.includes('beginner')) {
    return `For beginners, I recommend starting with:

1. **Emergency Fund**: Build 6 months of expenses in a savings account
2. **SIP in Mutual Funds**: Start with diversified equity funds (₹1000-5000/month)
3. **PPF**: Tax-saving investment with 15-year lock-in
4. **ELSS Funds**: Tax-saving mutual funds under Section 80C

Key principles:
- Start early to benefit from compounding
- Diversify across asset classes
- Invest regularly through SIPs
- Review and rebalance annually

Would you like specific fund recommendations or help calculating SIP amounts?`;
  }
  
  if (lowerQuestion.includes('tax') && lowerQuestion.includes('save')) {
    return `Here are the main tax-saving options under Section 80C:

1. **ELSS Mutual Funds** (₹1.5L limit)
   - 3-year lock-in, potential for high returns
   
2. **PPF** (₹1.5L limit)
   - 15-year lock-in, tax-free returns
   
3. **EPF** - Employer contribution
4. **NSC** - 5-year fixed deposits
5. **Tax-saving FDs** - 5-year lock-in

Additional deductions:
- Section 80D: Health insurance (₹25K-50K)
- Section 80CCD(1B): NPS (₹50K additional)

Would you like help calculating your potential tax savings?`;
  }
  
  if (lowerQuestion.includes('retirement') || lowerQuestion.includes('pension')) {
    return `Retirement planning essentials:

1. **Start Early**: Time is your biggest advantage
2. **Calculate Corpus**: Aim for 25-30x annual expenses
3. **Investment Mix**:
   - Equity (60-70% when young)
   - Debt (30-40%)
   - Gradually shift to debt as you age

4. **Retirement Accounts**:
   - EPF/PPF for tax benefits
   - NPS for additional tax savings
   - Mutual funds for growth

5. **Rule of Thumb**: Save at least 20% of income for retirement

Would you like help calculating your retirement corpus or creating a personalized plan?`;
  }
  
  // Try to use AI for other questions with error handling
  try {
    return await rateLimitedRequest(async () => {
      const result = await model.generateContent(question);
      return result.response.text();
    });
  } catch (error) {
    console.error("Error with AI response:", error);
    return `I'm currently experiencing high demand and cannot process complex questions. Here are some things I can help you with:

• Investment advice for beginners
• Tax-saving strategies
• Retirement planning basics
• SIP calculations
• Expense tracking tips

Please try asking a more specific question about any of these topics, or try again in a few minutes.`;
  }
}

/**
 * Analyzes the user's question to determine intent and required data.
 */
async function analyzeQuestion(question) {
  const prompt = `
  Analyze this financial question and return a JSON response with:
  - intent: 'expense', 'investment', 'credit', 'chart','net_worth', 'general'
  - timePeriod if mentioned (e.g., 'last week', 'this month')
  - merchant if mentioned (e.g., 'Amazon')
  - category if mentioned (e.g., 'food', 'shopping')
  - which data sources are needed (bank, credit, EPF, MF, stocks, net worth)

  Question: "${question}"

  Return ONLY a JSON object, no markdown formatting:
  {
    "intent": "expense",
    "timePeriod": "last month",
    "merchant": "Amazon",
    "needsBankData": true,
    "needsCreditData": false,
    "needsEPFData": false,
    "needsMFData": false,
    "needsStockData": false,
    "needsNetWorth": false
  }
  `;

  try {
    const result = await model.generateContent(prompt);
    let responseText = result.response.text().trim();
    
    // Remove markdown formatting if present
    const jsonMatch = responseText.match(/^```json\n(.*)\n```$/s);
    if (jsonMatch && jsonMatch[1]) {
      responseText = jsonMatch[1].trim();
    }

    return JSON.parse(responseText);
  } catch (error) {
    console.error("Error analyzing question and parsing JSON:", error);
    throw error;
  }
}

/**
 * Generates an expense report based on bank transactions.
 */
async function getExpense({ transactions, question, timePeriod, merchant, category }) {
  const prompt = `
  Analyze these bank transactions to answer the user's question.
  Question: "${question}"

  ${timePeriod ? `Time Period: ${timePeriod}` : ''}
  ${merchant ? `Merchant: ${merchant}` : ''}
  ${category ? `Category: ${category}` : ''}

  Transactions (date, amount, merchant, category):
  ${transactions}

  Provide a detailed response including:
  - Total amount spent
  - Breakdown by category if relevant
  - Key patterns or observations
  - Money-saving suggestions if applicable

  Keep the response concise and actionable.
  `;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Failed to generate expense response:", error);
    throw error;
  }
}

/**
 * Generates a visualization description and data summary for transactions.
 */
async function getChart({ transactions, question, timePeriod, category }) {
  const prompt = `
  Create a visualization description for these transactions.
  Question: "${question}"

  ${timePeriod ? `Time Period: ${timePeriod}` : ''}
  ${category ? `Category: ${category}` : ''}

  Transactions: ${transactions}

  Provide:
  1. Best chart type (pie, bar, line)
  2. Data points to plot
  3. Key insights
  4. Recommendations

  Keep it concise and actionable.
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Provides personalized investment advice.
 */
async function getInvestmentAdvice({ question, netWorth, mfTransactions, stockTransactions }) {
  const prompt = `
  Provide investment advice based on the user's financial situation.

  Question: "${question}"

  Financial profile:
  ${netWorth ? `- Net Worth: ${netWorth}` : ''}
  ${mfTransactions ? `- Mutual Fund Transactions: ${mfTransactions}` : ''}
  ${stockTransactions ? `- Stock Transactions: ${stockTransactions}` : ''}

  Provide:
  1. Financial health assessment
  2. Investment strategy recommendations
  3. Asset allocation suggestions
  4. Risk considerations
  5. Actionable next steps

  Keep the advice practical and specific.
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Analyzes a credit report to answer user questions.
 */
async function getCreditAnalysis({ creditReport, question }) {
  const prompt = `
  Analyze this credit report to answer the user's question.
  Question: "${question}"

  Credit Report: ${creditReport}

  Provide:
  1. Clear answer to the question
  2. Relevant credit factor explanations
  3. Improvement suggestions
  4. Important warnings or considerations
  5. Data-backed recommendations

  Keep the response professional and actionable.
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Analyzes net worth and assets.
 */
async function getAssets({ question, netWorth, mfTransactions, stockTransactions }) {
  const prompt = `
 You are a smart and analytical financial assistant helping users understand their personal net worth, investments, and asset portfolio. 
 
 You will be provided with structured financial data including:
 - 📊 Net Worth breakdown
 - 📈 Mutual Fund transactions
 - 📉 Stock transactions
 
 Your task is to:
 1. Accurately interpret the data.
 2. Answer the user's question clearly and concisely.
 3. Provide helpful insights or summaries where applicable (like asset allocation, trends, growth, etc.).
 
 You must base your response **only** on the data provided. If something is not available or unclear, say so politely and do not guess.
 
 ---
 🔸 Net Worth Degtails:
 ${netWorth}
 
 🔸 Mutual Fund Transactions:
 ${mfTransactions}
 
 🔸 Stock Transactions:
 ${stockTransactions}
 
 ---
 
 Now answer the following user query using only the information provided above:
 "${question}"
 
 Be concise, accurate, and focus only on the relevant data. You can perform calculations or summaries based on the given data.
 `;
   // console.log(prompt);
   const result = await model.generateContent(prompt);
   const response = result.response;
   // console.log(response.text());
   return response.text();
 }

export { analyzeAndRespond as answer };

console.log(analyzeAndRespond("how much i spend on zomato?"));