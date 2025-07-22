// fiMcpClient.js
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid'; // For generating unique session IDs
// Install uuid: npm install uuid

const FI_MCP_SERVER_URL = "http://localhost:8080";
const MCP_STREAM_ENDPOINT = `${FI_MCP_SERVER_URL}/mcp/stream`;
const LOGIN_ENDPOINT = `${FI_MCP_SERVER_URL}/login`;

let currentSessionId = null; // Store the active session ID
let currentPhoneNumber = null; // Store the phone number associated with the active session

/**
 * Simulates logging into the Fi MCP Dev server.
 * In a real scenario, the sessionId would likely come from your chatbot's framework,
 * and the phone number from user input. For a hackathon, we hardcode it or use
 * a simple mapping.
 * @param {string} phoneNumber - One of the allowed dummy phone numbers (e.g., "2222222222")
 * @returns {Promise<boolean>} - True if login is successful, false otherwise.
 */
export async function loginToFiMCPDev(phoneNumber) {
    // Generate a new session ID for each login attempt
    const SessionId = uuidv4(); 
    const newSessionId = "mcp-session-" + SessionId;
    const formData = new URLSearchParams();
    formData.append('sessionId', newSessionId);
    formData.append('phoneNumber', phoneNumber);
    formData.append('otp', '123456'); // OTP is dummy, can be anything

    try {
        const response = await fetch(LOGIN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
            // Important: Node-fetch does not automatically handle cookies in the same way browsers do.
            // For this specific fi-mcp-dev server, the session is stored server-side
            // based on `sessionId` passed in the login request, and the authMiddleware
            // uses this `sessionId` to fetch the correct data.
            // So, we primarily need to ensure subsequent requests include the same sessionId,
            // which we'll manage explicitly.
        });

        if (response.ok) {
            currentSessionId = newSessionId;
            currentPhoneNumber = phoneNumber;
            console.log(`[FiMCPClient] Successfully logged in with ${phoneNumber}. Session ID: ${currentSessionId}`);
            // You might want to parse the login_successful.html response if needed, but not strictly for API interaction
            return true;
        } else {
            const errorText = await response.text();
            console.error(`[FiMCPClient] Login failed with status ${response.status}: ${errorText}`);
            currentSessionId = null;
            currentPhoneNumber = null;
            return false;
        }
    } catch (error) {
        console.error(`[FiMCPClient] Error during login: ${error.message}`);
        currentSessionId = null;
        currentPhoneNumber = null;
        return false;
    }
}

/**
 * Fetches data from the Fi MCP Dev server for a specific tool.
 * Requires an active session.
 * @param {string} toolName - The name of the tool to call (e.g., "fetch_net_worth").
 * @param {object} [args={}] - Optional arguments for the tool.
 * @returns {Promise<object|null>} - The JSON data from the server, or null if an error occurs.
 */
export async function fetchFiMCPData(toolName, args = {}) {
    if (!currentSessionId) {
        console.error("[FiMCPClient] No active session. Please log in first.");
        return null;
    }

    // Construct the MCP CallToolRequest payload in proper JSON-RPC 2.0 format
    const payload = {
        jsonrpc: "2.0",
        method: "tools/call",
        id: 1,
        params: {
            name: toolName,
            arguments: args
        }
    };

    try {
        const response = await fetch(MCP_STREAM_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Mcp-Session-Id': currentSessionId, // Critical for fi-mcp-lite authentication
                'Cookie': `sessionId=${currentSessionId}` // You could also try sending as a cookie, but X-Session-Id is more explicit for this server's middleware.
            },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            const data = await response.json();
            // console.log(`[FiMCPClient] Fetched data for ${toolName}:`, JSON.stringify(data, null, 2));
            return data;
        } else {
            const errorText = await response.text();
            console.error(`[FiMCPClient] Failed to fetch data for ${toolName}. Status: ${response.status}, Error: ${errorText}`);
            return null;
        }
    } catch (error) {
        console.error(`[FiMCPClient] Error fetching data for ${toolName}: ${error.message}`);
        return null;
    }
}

/**
 * Helper to get the current logged-in phone number.
 * @returns {string|null} The current phone number or null if not logged in.
 */
export function getCurrentPhoneNumber() {
    return currentPhoneNumber;
}

/**
 * Tool names that match exactly with the Go server's pkg/tool_info.go definitions.
 */
export const ToolNames = {
    NET_WORTH: "fetch_net_worth",
    CREDIT_REPORT: "fetch_credit_report",
    EPF_DETAILS: "fetch_epf_details",
    MUTUAL_FUND_TRANSACTIONS: "fetch_mf_transactions",
    BANK_TRANSACTIONS: "fetch_bank_transactions",
    STOCK_TRANSACTIONS: "fetch_stock_transactions",
};

// Example usage (for testing within this file or directly in your chatbot logic)
// async function testFiMCPClient() {
//     const dummyPhoneNumber = "2222222222"; // User with all assets
//     // const dummyPhoneNumber = "1111111111"; // User with no assets

//     console.log("--- Attempting Login ---");
//     const loginSuccess = await loginToFiMCPDev(dummyPhoneNumber);

//     if (loginSuccess) {
//         console.log("\n--- Fetching Net Worth ---");
//         const netWorthData = await fetchFiMCPData(ToolNames.NET_WORTH);
//         if (netWorthData && netWorthData.results && netWorthData.results.length > 0) {
//             const netWorthResult = netWorthData.results[0].toolResult.text; // Assuming text result
//             console.log("Parsed Net Worth Result:", netWorthResult);
//             // Further parse netWorthResult if it's a JSON string
//             try {
//                 const parsedJson = JSON.parse(netWorthResult);
//                 const totalNetWorth = parsedJson.netWorthResponse?.totalNetWorthValue;
//                 if (totalNetWorth) {
//                     console.log(`Total Net Worth: ${totalNetWorth.units} ${totalNetWorth.currencyCode}`);
//                 }
//             } catch (e) {
//                 console.error("Failed to parse net worth JSON string:", e);
//             }
//         } else {
//             console.log("No net worth data received or invalid format.");
//         }

//         console.log("\n--- Fetching Credit Report ---");
//         const creditReportData = await fetchFiMCPData(ToolNames.CREDIT_REPORT);
//         if (creditReportData && creditReportData.results && creditReportData.results.length > 0) {
//             const creditReportResult = creditReportData.results[0].toolResult.text;
//             console.log("Parsed Credit Report Result:", creditReportResult);
//             // Further parse creditReportResult if it's a JSON string to extract DOB, score etc.
//         } else {
//             console.log("No credit report data received or invalid format.");
//         }
//     } else {
//         console.log("\nLogin failed. Cannot fetch data.");
//     }
// }

// // Run the test function (uncomment to test this file directly)
// // testFiMCPClient();