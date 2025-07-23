// import { GoogleGenerativeAI } from "@google/generative-ai";
// import dotenv from 'dotenv'; 
// dotenv.config(); 
// import {
//   getFinancialData,
//   getBankTransactions,
//   getCreditReport,
//   getEPFDetails,
//   getMFTransactions,
//   getStockTransactions,
//   getNetWorth
// } from "./testClient.js"; // assuming you're importing these from a module

// // Initialize Gemini
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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
} from "./testClient.js"; // assuming you're importing these from a module

// Initialize Gemini with gemini-1.5-flash model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Main function to handle the user's financial question
async function analyzeAndRespond(userQuestion) {
  try {
    const analysis = await analyzeQuestion(userQuestion);
    const data = {};

    // Conditionally fetch data based on the analysis
    if (analysis.needsBankData) {
      data.bankTransactions = await getBankTransactions();
      // console.log("HELLO")
      // console.log(data)
    }

    if (analysis.needsCreditData) {
      data.creditReport = await getCreditReport();
    }

    if (analysis.needsEPFData) {
      data.epfDetails = await getEPFDetails();
    }

    if (analysis.needsMFData) {
      data.mfTransactions = await getMFTransactions();
    }

    if (analysis.needsStockData) {
      data.stockTransactions = await getStockTransactions();
    }

    if (analysis.needsNetWorth) {
      data.netWorth = await getNetWorth();
    }
    // console.log(data);
    // Route the request based on the detected intent
    switch (analysis.intent) {
      case 'expense':
        if (!data.bankTransactions) {
          return "I couldn't retrieve the necessary bank data to answer your expense question.";
        }
        return await getExpense({
          transactions: data.bankTransactions,
          question: userQuestion,
          timePeriod: analysis.timePeriod,
          merchant: analysis.merchant,
          category: analysis.category
        });

      case 'investment':
        return await getInvestmentAdvice({
          question: userQuestion,
          netWorth: data.netWorth,
          creditScore: data.creditReport?.score,
          epfData: data.epfDetails,
          mfTransactions: data.mfTransactions,
          stockTransactions: data.stockTransactions
        });

      case 'chart':
        if (!data.bankTransactions) {
          return "I couldn't retrieve the necessary transaction data to generate a chart.";
        }
        return await getChart({
          transactions: data.bankTransactions,
          question: userQuestion,
          timePeriod: analysis.timePeriod,
          category: analysis.category
        });

      case 'credit':
        if (!data.creditReport) {
          return "I couldn't retrieve your credit report to answer your question.";
        }
        return await getCreditAnalysis({
          creditReport: data.creditReport,
          question: userQuestion
        });

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
        // For general questions, directly use the model

        const result = await model.generateContent(userQuestion);
        console.log(result.response.text())
        return result.response.text();
    }
  } catch (error) {
    console.error("Error processing question:", error);
    return "Sorry, I encountered an error processing your request. Please try again later.";
  }
}

/**
 * Analyzes the user's question to determine intent and required data.
 * @param {string} question - The user's financial question.
 * @returns {object} - An object containing intent, time period, merchant, category, and data needs.
 */
async function analyzeQuestion(question) {
  const prompt = `
  Analyze this financial question and return a JSON response with:
  - intent: 'expense', 'investment', 'credit', 'chart','net_worth'
  - timePeriod if mentioned (e.g., 'last week', 'this month')
  - merchant if mentioned (e.g., 'Amazon')
  - category if mentioned (e.g., 'food', 'shopping')
  - which data sources are needed (bank, credit, EPF, MF, stocks, net worth)

  Question: "${question}"

  Example response for "how much I spend on Amazon last month":
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

  Return ONLY the JSON object, no other text. Ensure the response is a raw JSON string, without any markdown formatting or extra characters outside the JSON itself.
  `;

  try {
    const result = await model.generateContent(prompt);
    let responseText = result.response.text(); // Get the raw text response from the model
    console.log("HI"+responseText);
    // Regex to extract JSON from a markdown code block (e.g., ```json{...}```)
    // The 's' flag allows '.' to match newlines
    const jsonMatch = responseText.match(/^```json\n(.*)\n```$/s);

    if (jsonMatch && jsonMatch[1]) {
      // If the markdown wrapper is found, use the captured group (the actual JSON part)
      responseText = jsonMatch[1].trim();
    } else {
      // If no markdown wrapper, assume it might still have leading/trailing whitespace
      // and attempt to trim it. Log a warning for debugging.
      console.warn("Gemini response did not contain expected markdown JSON block. Attempting raw parse.");
      responseText = responseText.trim();
    }

    // Parse the cleaned string into a JSON object
    return JSON.parse(responseText);

  } catch (error) {
    console.error("Error analyzing question and parsing JSON:", error);
    // Return a default analysis in case of error
    return {
      intent: 'general',
      needsBankData: false,
      needsCreditData: false,
      needsEPFData: false,
      needsMFData: false,
      needsStockData: false,
      needsNetWorth: false
    };
  }
}

/**
 * Generates an expense report based on bank transactions.
 * @param {object} params - Parameters including transactions, question, time period, merchant, and category.
 * @returns {Promise<string>} - A detailed expense report.
 */
async function getExpense({ transactions, question, timePeriod, merchant, category }) {
  //   let parsedData;
  //   // console.log("HELLO2"+transactions) 
  // try {
  //   // console.log("HELLO"+transactions);
  //   parsedData = JSON.parse(transactions);
  // } catch (e) {
  //   console.error("Failed to parse JSON:", e.message);
  //   return;
  // }
  // console.log("HI");
  // console.log(parsedData);
  // const txns = transactions.bankTransactions?.[0]?.txns;
  // // console.log(  "HI");
  // // console.log(txns);
  // const formatted = txns
  // .slice(0, 100)
  // .map(t => `${t[2]} | ₹${t[0]} | ${t[1]} | ${(t[3])}`)
  // .join('\n');
  // print(formatted);
  // console.log(formatted);
  const prompt = `
  Analyze these bank transactions transactionType (1 for CREDIT, 2 for DEBIT, 3 for OPENING, 4 for INTEREST, 5 for TDS, 6 for INSTALLMENT, 7 for CLOSING and 8 for OTHERS) to answer the user's question.
  Question: "${question}"

  ${timePeriod ? `Time Period: ${timePeriod}` : ''}
  ${merchant ? `Merchant: ${merchant}` : ''}
  ${category ? `Category: ${category}` : ''}

  

  Transactions (date, amount, merchant, category):
  ${transactions}

  Provide a detailed response answering the question, including:
  - Total amount spent
  - Breakdown by category if relevant
  - Any interesting patterns or observations
  - Suggestions for saving money if applicable

  Format the response in clear, human-readable text with appropriate headings.
  `;

  // console.log("HI")
  try{
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    console.log(responseText);
    return responseText;
  }catch(e){
     console.error("Failed to generate response", e.message);
  }
  return responseText;
}

/**
 * Generates a visualization description and data summary for transactions.
 * @param {object} params - Parameters including transactions, question, time period, and category.
 * @returns {Promise<string>} - A description of the chart, data points, insights, and recommendations.
 */
async function getChart({ transactions, question, timePeriod, category }) {
  const prompt = `
  Create a visualization description and data summary for these transactions based on the user's question.
  Question: "${question}"

  ${timePeriod ? `Time Period: ${timePeriod}` : ''}
  ${category ? `Category: ${category}` : ''}

  Transactions (date, amount, merchant, category):
  ${transactions}

  Provide:
  1. A description of the best chart type to visualize this data (pie, bar, line, etc.)
  2. The data points that should be plotted (formatted as labels and values)
  3. Key insights from the data
  4. Any recommendations based on the patterns

  Format the response with clear sections for each component.
  `;

  const result = await model.generateContent(prompt);
  console.log(result.response.text())
  return result.response.text();
}

/**
 * Provides personalized investment advice.
 * @param {object} params - Parameters including question, net worth, credit score, EPF data, MF transactions, and stock transactions.
 * @returns {Promise<string>} - Personalized investment advice.
 */
async function getInvestmentAdvice({ question, netWorth, mfTransactions, stockTransactions}){
  // console.log("Hello");
  // console.log(netWorth)
  const prompt = `
  Provide personalized investment advice based on the user's financial situation and question.

  Question: "${question}"

  User's financial profile:
  ${netWorth ? `- Net Worth: ₹${netWorth}` : ''}
  ${mfTransactions ? `- Mutual Fund Transactions: ${mfTransactions}` : ''}
  ${stockTransactions ? `- Stock Transactions: ${stockTransactions} stocks` : ''}

  Provide:
  1. Assessment of current financial health
  2. Recommended investment strategy based on the question
  3. Specific asset allocation suggestions
  4. Any risks or considerations
  5. Actionable steps the user can take

  Format the response with clear sections and professional advice.
  `;
  console.log(prompt);
  const result = await model.generateContent(prompt);
  console.log(result.response.text())
  return result.response.text();
}

/**
 * Analyzes a credit report to answer user questions.
 * @param {object} params - Parameters including credit report and question.
 * @returns {Promise<string>} - A credit analysis with answers, explanations, and suggestions.
 */
async function getCreditAnalysis({ creditReport, question }) {
  const prompt = `
  Analyze this credit report to answer the user's question.
  Question: "${question}"

  Credit Report Data:
  ${creditReport}

  Provide:
  1. A clear answer to the user's question based upon the given information
  2. Explanation of any relevant credit factors
  3. Suggestions for improvement if applicable
  4. Any important warnings or considerations
  5. Quote your suggestions or advises with proper data and stats

  Format the response with clear sections and professional advice.
  `;

  const result = await model.generateContent(prompt);
  console.log(result.response.text());
  return result.response.text();
}

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

console.log(analyzeAndRespond("What is my Networth ?"));

