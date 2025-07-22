// import { loginToFiMCPDev, fetchFiMCPData, ToolNames } from './fiMcpClient.js';

// async function testClient() {
//     const phoneNumber = "2525252525";

//     const loginSuccess = await loginToFiMCPDev(phoneNumber);
//     if (!loginSuccess) {
//         console.error("Login failed");
//         return;
//     }

//     const toolsToTest = [
//         ToolNames.NET_WORTH,
//         ToolNames.CREDIT_REPORT,
//         ToolNames.EPF_DETAILS,
//         ToolNames.MUTUAL_FUND_TRANSACTIONS
//     ];

//     const combinedTextData = {};

//     for (const tool of toolsToTest) {
//         try {
//             const result = await fetchFiMCPData(tool);
//             const text = result?.result?.content?.[0]?.text || '{}';

//             // Clean carriage returns and parse the text if valid JSON
//             const cleanText = text.trim();
//             try {
//                 combinedTextData[tool] = JSON.parse(cleanText);
//             } catch (parseErr) {
//                 combinedTextData[tool] = cleanText; // fallback as raw string if not JSON
//             }

//         } catch (err) {
//             combinedTextData[tool] = { error: err.message };
//         }
//     }

//     console.log("\n=========== Combined Parsed Tool Data ===========\n");
//     console.dir(combinedTextData, { depth: null, colors: true });
// }

// testClient().catch(console.error);
import { loginToFiMCPDev, fetchFiMCPData, ToolNames } from './fiMcpClient.js';
// Helper function to parse the response text
async function fetchAndParseToolData(toolName) {
    try {
        const result = await fetchFiMCPData(toolName);
        const text = result?.result?.content?.[0]?.text || '{}';
        // let data;
        // try {
        // data = JSON.parse(text);
        // } catch (e) {
        // console.error("Invalid JSON:", e);
        // process.exit(1);
        // }
        // const cleanText = {
        // schemaDescription: data.schemaDescription,
        // bankTransactions: data.bankTransactions
        // };
        const cleanText=text;
        // console.log(cleanText)
        try {

            return cleanText;
        } catch (parseErr) {
            return cleanText; // fallback as raw string if not JSON
        }
    } catch (err) {
        console.error(`Error fetching ${toolName}:`, err);
        throw err;
    }
}

// Initialize login (you might want to call this once when your app starts)
let isLoggedIn = false;
async function ensureLoggedIn() {
    if (!isLoggedIn) {
        const phoneNumber = "4444444444"; // You might want to make this configurable
        isLoggedIn = await loginToFiMCPDev(phoneNumber);
        if (!isLoggedIn) {
            throw new Error("Login to FiMCP failed");
        }
    }
}

// Implement the declared functions
async function getFinancialData() {
    await ensureLoggedIn();
    
    const [
        bankTransactions,
        creditReport,
        epfDetails,
        mfTransactions,
        stockTransactions,
        netWorth
    ] = await Promise.all([
        getBankTransactions(),
        getCreditReport(),
        getEPFDetails(),
        getMFTransactions(),
        getStockTransactions(),
        getNetWorth()
    ]);

    return {
        bankTransactions,
        creditReport,
        epfDetails,
        mfTransactions,
        stockTransactions,
        netWorth
    };
}

//Formatting Bank Transactions
function formatTransactions(data){
    const allTxns = data.bankTransactions
    ?.flatMap(bank => bank.txns.map(txn => ({
        bank: bank.bank,
        txn
    }))) || [];

    const formatted = allTxns
    .slice(0, 100)
    .map(({ bank, txn }) => `${txn[2]} | ₹${txn[0]} | ${txn[1]} | Type: ${txn[3]} | Bank: ${bank}`)
    .join('\n');
    return formatted;
}

async function getBankTransactions() {
    await ensureLoggedIn();
    const raw = await fetchAndParseToolData(ToolNames.BANK_TRANSACTIONS);
    const data = JSON.parse(raw);

    const formatted_txns=formatTransactions(data);
    // console.log(data);
    // console.log(formatted_txns);
    // Transform the data to match Transaction interface if needed
    return formatted_txns;
}

//Formatting Credit Report
function formatCreditReport(data) {
  const report = data.creditReports[0].creditReportData;

  const formatDate = (yyyymmdd) => {
    if (!yyyymmdd) return '-';
    return `${yyyymmdd.slice(6)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(0, 4)}`;
  };

  const creditSummary = report.creditAccount.creditAccountSummary;
  const accounts = report.creditAccount.creditAccountDetails;

  const total = creditSummary.totalOutstandingBalance;

  const summary = `
🗓️ Report Date: ${formatDate(report.creditProfileHeader.reportDate)}
🕒 Report Time: ${report.creditProfileHeader.reportTime}
👤 DOB: ${formatDate(report.currentApplication.currentApplicationDetails.currentApplicantDetails.dateOfBirthApplicant)}

📋 Summary:
- Total Accounts: ${creditSummary.account.creditAccountTotal}
- Active Accounts: ${creditSummary.account.creditAccountActive}
- Defaulted Accounts: ${creditSummary.account.creditAccountDefault}
- Closed Accounts: ${creditSummary.account.creditAccountClosed}
- CAD/Suit Filed Balance: ₹${creditSummary.account.cadSuitFiledCurrentBalance}

💰 Outstanding Balances:
- Secured: ₹${total.outstandingBalanceSecured} (${total.outstandingBalanceSecuredPercentage}%)
- Unsecured: ₹${total.outstandingBalanceUnSecured} (${total.outstandingBalanceUnSecuredPercentage}%)
- Total: ₹${total.outstandingBalanceAll}
`.trim();

  const formattedAccounts = accounts.map((acc, i) => {
    return `
🏦 Account ${i + 1}: ${acc.subscriberName}
- Account Type Code: ${acc.accountType}
- Portfolio Type: ${acc.portfolioType}
- Open Date: ${formatDate(acc.openDate)}
- Original Loan / Credit Limit: ₹${acc.highestCreditOrOriginalLoanAmount || acc.creditLimitAmount}
- Account Status: ${acc.accountStatus}
- Payment Rating: ${acc.paymentRating}
- Current Balance: ₹${acc.currentBalance}
- Past Due Amount: ₹${acc.amountPastDue}
- Interest Rate: ${acc.rateOfInterest}%
- Tenure: ${acc.repaymentTenure} months
- Last Reported: ${formatDate(acc.dateReported)}
- Payment History: ${acc.paymentHistoryProfile}
    `.trim();
  }).join('\n\n');

  const nonCreditCaps = report.nonCreditCaps.capsApplicationDetailsArray.map((c, i) => {
    return `🔍 Non-Credit CAP ${i + 1}: ${c.SubscriberName}, Purpose Code: ${c.FinancePurpose}`;
  }).join('\n');

  const capSummary = `
📈 CAPS Activity:
- Last 7 Days: ${report.totalCapsSummary.totalCapsLast7Days}
- Last 30 Days: ${report.totalCapsSummary.totalCapsLast30Days}
- Last 90 Days: ${report.totalCapsSummary.totalCapsLast90Days}
- Last 180 Days: ${report.totalCapsSummary.totalCapsLast180Days}
  `.trim();

  const exactMatch = `✅ Identity Match: ${report.matchResult.exactMatch === 'Y' ? 'Yes' : 'No'}`;

  return [
    summary,
    '\n\n📂 Accounts:\n',
    formattedAccounts,
    '\n\n📁 Non-Credit CAPs:\n',
    nonCreditCaps || 'No recent non-credit inquiries',
    '\n\n' + capSummary,
    '\n\n' + exactMatch
  ].join('\n');
}

async function getCreditReport() {
    await ensureLoggedIn();
    const raw=await fetchAndParseToolData(ToolNames.CREDIT_REPORT);
    const data=JSON.parse(raw)
    const formatted_credit_report=formatCreditReport(data);
    // console.log(formatted_credit_report)
    return formatted_credit_report;
}

//Formatting EPF details
function formatEPFDetails(data) {
  const accounts = data.uanAccounts;

  if (!accounts || accounts.length === 0) return 'No UAN accounts found.';

  return accounts.map((acc, index) => {
    const ests = acc.rawDetails?.est_details || [];
    const overall = acc.rawDetails?.overall_pf_balance || {};

    const estDetails = ests.map((est, i) => {
      const pf = est.pf_balance || {};
      const empShare = pf.employee_share || {};
      const emrShare = pf.employer_share || {};

      return `
🏢 Establishment ${i + 1}: ${est.est_name || 'N/A'}
- Member ID: ${est.member_id || 'N/A'}
- PF Office: ${est.office || 'N/A'}
- Date of Joining (EPF): ${est.doj_epf || 'N/A'}
- Date of Exit (EPF): ${est.doe_epf || 'N/A'}
- Date of Exit (EPS): ${est.doe_eps || 'N/A'}

💰 PF Balance:
- Net Balance: ₹${pf.net_balance || '0'}
- Employee Share: Credit ₹${empShare.credit || '0'}, Balance ₹${empShare.balance || '0'}
- Employer Share: Credit ₹${emrShare.credit || '0'}, Balance ₹${emrShare.balance || '0'}
      `.trim();
    }).join('\n\n');

    const empTotal = overall.employee_share_total || {};
    const emrTotal = overall.employer_share_total || {};

    const overallSummary = `
📊 Overall PF Summary:
- Pension Balance: ₹${overall.pension_balance || '0'}
- Current PF Balance: ₹${overall.current_pf_balance || '0'}
- Employee Share Total: Credit ₹${empTotal.credit || '0'}, Balance ₹${empTotal.balance || '0'}
- Employer Share Total: Credit ₹${emrTotal.credit || '0'}, Balance ₹${emrTotal.balance || '0'}
    `.trim();

    return `
===========================
👤 UAN Account ${index + 1}
===========================

${estDetails}

${overallSummary}
    `.trim();
  }).join('\n\n\n');
}

async function getEPFDetails() {
    await ensureLoggedIn();
    const raw= await fetchAndParseToolData(ToolNames.EPF_DETAILS);
    const data=JSON.parse(raw)
    const formatted_EPF=formatEPFDetails(data);
    // console.log(formatted_EPF);
    return formatted_EPF;
}

//Fomratting Mutual Funds Transactions
function formatMFTransactions(data) {
  if (!data || !Array.isArray(data.mfTransactions)) return "No mutual fund data available.";

  return data.mfTransactions.map((fund) => {
    const { schemeName, isin, folioId, txns } = fund;

    let summary = `\n🧾 Mutual Fund Investment Summary\n`;
    summary += `Scheme Name: ${schemeName}\n`;
    summary += `ISIN: ${isin}\n`;
    summary += `Folio ID: ${folioId}\n`;

    if (txns.length > 0) {
      const totalUnits = txns.reduce((sum, t) => sum + t[3], 0).toFixed(4);
      summary += `Total Units Held: ${totalUnits} units\n`;
      summary += `\nTransaction History:\n`;

      txns.forEach(([orderType, date, nav, units, amount]) => {
        summary += `${orderType === 1 ? "🟢 BUY" : "🔴 SELL"} on ${date}\n`;
        summary += `• Purchase Price (NAV): ₹${nav}\n`;
        summary += `• Units ${orderType === 1 ? "Purchased" : "Sold"}: ${units}\n`;
        summary += `• Transaction Amount: ₹${amount}\n\n`;
      });
    } else {
      summary += `No transactions found.\n`;
    }

    return summary;
  }).join("\n-----------------------------\n");
}

async function getMFTransactions() {
    await ensureLoggedIn();
    const raw = await fetchAndParseToolData(ToolNames.MUTUAL_FUND_TRANSACTIONS);
    // Transform the data to match Transaction interface if needed
    const data=JSON.parse(raw);
    const formatted_MFtransactions=formatMFTransactions(data);
    // console.log(formatted_MFtransactions);
    return formatted_MFtransactions;
}


function formatStockTransactions(data) {
  if (!data || !Array.isArray(data.stockTransactions)) return "No stock transaction data available.";

  // Mapping transaction type codes
  const txnTypeMap = {
    1: "🟢 BUY",
    2: "🔴 SELL",
    3: "🎁 BONUS",
    4: "🔀 SPLIT"
  };

  return data.stockTransactions.map((stock, idx) => {
    const { isin, txns } = stock;
    let summary = `\n📈 Stock Transaction #${idx + 1}\n`;
    summary += `ISIN: ${isin}\n`;

    if (txns.length === 0) {
      summary += "No transactions available.\n";
      return summary;
    }

    summary += `Transaction History:\n`;

    txns.forEach((txn) => {
      const [type, date, qty, nav] = txn;
      summary += `• ${txnTypeMap[type] || "Unknown Type"} on ${date} - Quantity: ${qty}`;
      if (nav !== undefined) summary += ` @ ₹${nav}`;
      summary += "\n";
    });

    return summary;
  }).join("\n-----------------------------\n");
}

async function getStockTransactions() {
    await ensureLoggedIn();
    const raw = await fetchAndParseToolData(ToolNames.STOCK_TRANSACTIONS);
    // Transform the data to match Transaction interface if needed
    const data=JSON.parse(raw);
    const formatted_Stock_transactions=formatStockTransactions(data);
    // console.log(formatted_Stock_transactions);
    return formatted_Stock_transactions;
}

function formatNetWorthResponse(data) {
  const netWorth = data.netWorthResponse;

  const formatCurrency = (value) => `₹${Number(value.units).toLocaleString("en-IN")}`;

  const assets = netWorth.assetValues.map(
    (a) => `${a.netWorthAttribute.replace("ASSET_TYPE_", "").replaceAll("_", " ")}: ${formatCurrency(a.value)}`
  ).join('\n');

  const liabilities = netWorth.liabilityValues.map(
    (l) => `${l.netWorthAttribute.replace("LIABILITY_TYPE_", "").replaceAll("_", " ")}: ${formatCurrency(l.value)}`
  ).join('\n');

  const total = formatCurrency(netWorth.totalNetWorthValue);

  return `📊 Total Net Worth: ${total}\n\n💰 Assets:\n${assets}\n\n💸 Liabilities:\n${liabilities}`;
}

async function getNetWorth() {
    await ensureLoggedIn();
    const raw = await fetchAndParseToolData(ToolNames.NET_WORTH);
    const data=JSON.parse(raw)
    const formatted_net_worth=formatNetWorthResponse(data)
    // console.log(formatted_net_worth);
    return formatted_net_worth;
}

// Export all the functions
export {
    getFinancialData,
    getBankTransactions,
    getCreditReport,
    getEPFDetails,
    getMFTransactions,
    getStockTransactions,
    getNetWorth
};


// getBankTransactions();
// getNetWorth();
// getCreditReport();
// getEPFDetails();
// getMFTransactions();
// getStockTransactions();
