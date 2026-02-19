import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import * as dotenv from "dotenv";

dotenv.config();

// Configuration
const TURNKEY_API_PUBLIC_KEY = process.env.TURNKEY_API_PUBLIC_KEY || "mock_public_key";
const TURNKEY_API_PRIVATE_KEY = process.env.TURNKEY_API_PRIVATE_KEY || "mock_private_key";
const TURNKEY_BASE_URL = "https://api.turnkey.com";

// Initialize Stamper
const stamper = new ApiKeyStamper({
    apiPublicKey: TURNKEY_API_PUBLIC_KEY,
    apiPrivateKey: TURNKEY_API_PRIVATE_KEY,
});

// Initialize Client
export const turnkeyClient = new TurnkeyClient(
    { baseUrl: TURNKEY_BASE_URL },
    stamper
);

export const ORG_ID = process.env.TURNKEY_ORGANIZATION_ID || "mock_org_id";

/**
 * Helper to ensure we are connected
 */
export async function checkConnection() {
    try {
        const whoami = await turnkeyClient.getWhoami({
            organizationId: ORG_ID,
        });
        console.log("Turnkey Connection Verified:", whoami.organizationId);
        return true;
    } catch (error) {
        console.error("Turnkey Connection Failed:", error);
        return false;
    }
}
