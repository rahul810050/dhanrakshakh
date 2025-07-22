// fiMcpClient.js
import fetch from 'node-fetch';

const FI_MCP_SERVER_URL = "http://localhost:8080";
const MCP_STREAM_ENDPOINT = `${FI_MCP_SERVER_URL}/mcp/stream`;
const LOGIN_ENDPOINT = `${FI_MCP_SERVER_URL}/login`;

const FIXED_SESSION_ID = "test123"; // 🔒 Constant session ID

let currentSessionId = null; // Store the active session ID
let currentPhoneNumber = null; // Store the phone number associated with the active session

/**
 * Simulates logging into the Fi MCP Dev server with a constant session ID.
 * @param {string} phoneNumber - One of the allowed dummy phone numbers (e.g., "2222222222")
 * @returns {Promise<boolean>} - True if login is successful, false otherwise.
 */
export async function loginToFiMCPDev(phoneNumber) {
    const formData = new URLSearchParams();
    formData.append('sessionId', FIXED_SESSION_ID);
    formData.append('phoneNumber', phoneNumber);
    formData.append('otp', '123456'); // OTP is dummy, can be anything

    try {
        const response = await fetch(LOGIN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
        });

        if (response.ok) {
            currentSessionId = FIXED_SESSION_ID;
            currentPhoneNumber = phoneNumber;
            console.log(`[FiMCPClient] Successfully logged in with ${phoneNumber}. Session ID: ${currentSessionId}`);
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
 * @param {string} toolName - The name of the tool to call (e.g., "FetchNetWorth").
 * @param {object} [args={}] - Optional arguments for the tool.
 * @returns {Promise<object|null>} - The JSON data from the server, or null if an error occurs.
 */
export async function fetchFiMCPData(toolName, args = {}) {
    if (!currentSessionId) {
        console.error("[FiMCPClient] No active session. Please log in first.");
        return null;
    }

    const payload = {
        calls: [
            {
                tool: {
                    name: toolName,
                    args: args
                }
            }
        ],
        sessionId: currentSessionId,
    };

    try {
        const response = await fetch(MCP_STREAM_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-Id': currentSessionId,
            },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`[FiMCPClient] Fetched data for ${toolName}:`, JSON.stringify(data, null, 2));
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
 * Placeholder for available tool names.
 */
export const ToolNames = {
    NET_WORTH: "FetchNetWorth",
    CREDIT_REPORT: "FetchCreditReport",
    EPF_DETAILS: "FetchEPFDetails",
    MUTUAL_FUND_TRANSACTIONS: "FetchMutualFundTransactions",
    BANK_TRANSACTIONS: "FetchBankTransactions",
};
