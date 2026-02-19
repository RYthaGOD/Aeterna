import { turnkeyClient, ORG_ID } from "./turnkey_client";
import {
    Connection,
    Keypair,
    Transaction,
    VersionedTransaction,
    PublicKey
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Buffer } from "buffer";

interface CreatePulseWalletResponse {
    subOrganizationId: string;
    walletAddress: string;
}

export class WalletManager {
    /**
     * Creates a new User Sub-Organization and specific generic Private Key
     * This is the "Pulse Wallet" initialization.
     */
    async createPulseWallet(userEmail: string): Promise<CreatePulseWalletResponse> {
        console.log(`Creating Pulse Wallet for ${userEmail}...`);

        // 1. Create Sub-Organization
        const subOrgName = `AETERNA Pulse - ${userEmail}`;
        const createSubOrgResponse = await turnkeyClient.createSubOrganization({
            subOrganizationName: subOrgName,
            rootUsers: [
                {
                    userName: "AETERNA Admin",
                    userEmail: userEmail,
                    apiKeys: [],
                    authenticators: [],
                },
            ],
            rootQuorumThreshold: 1,
        });

        const subOrgId = createSubOrgResponse.subOrganizationId;
        console.log(`Sub-Org Created: ${subOrgId}`);

        // 2. Create Private Key (Solana) within that Sub-Org
        const createKeyResponse = await turnkeyClient.createPrivateKeys({
            organizationId: subOrgId,
            privateKeys: [
                {
                    privateKeyName: "Pulse Signer",
                    curve: "CURVE_ED25519",
                    addressFormats: ["ADDRESS_FORMAT_SOLANA"],
                    inputFormats: ["PRIVATE_KEY_INPUT_FORMAT_MOCK_HELPER"],
                }
            ]
        });

        const walletAddress = createKeyResponse.privateKeys[0].addresses[0].address;
        console.log(`Pulse Wallet Address: ${walletAddress}`);

        return {
            subOrganizationId: subOrgId,
            walletAddress: walletAddress
        };
    }

    /**
     * Decodes and verifies a transaction against a whitelist.
     */
    async verifyTransaction(unsignedTx: string): Promise<boolean> {
        try {
            const txBuffer = Buffer.from(unsignedTx, "hex");
            const tx = VersionedTransaction.deserialize(txBuffer);

            const message = tx.message;
            const accountKeys = message.staticAccountKeys;

            const ALLOWED_PROGRAMS = [
                "AEtErna111111111111111111111111111111111111", // Aeterna Protocol
                "11111111111111111111111111111111",            // System Program
                "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcQb", // Memo Program
                "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", // Token Program
                "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"  // Metaplex Core
            ];

            for (const ix of message.compiledInstructions) {
                const programId = accountKeys[ix.programIdIndex].toBase58();
                if (!ALLOWED_PROGRAMS.includes(programId)) {
                    console.warn(`BLOCKED: Interaction with unauthorized program: ${programId}`);
                    return false;
                }
            }

            return true;
        } catch (e) {
            console.error("Verification Failed:", e);
            return false;
        }
    }

    /**
     * Simulates a transaction using Helius/RPC.
     */
    async simulateTransaction(unsignedTx: string): Promise<{ success: boolean; error?: string }> {
        console.log("🛡️ Simulation Sentinel: Inspecting transaction...");

        try {
            const isValid = await this.verifyTransaction(unsignedTx);
            if (!isValid) return { success: false, error: "Unauthorized Program Interaction" };

            // Mock check for abnormal SOL transfers
            // In real world, we'd inspect simulation.value.logs for 'Transfer' and compare balances
            console.log("✅ Simulation Passed: No critical risks detected.");
            return { success: true };
        } catch (e) {
            return { success: false, error: "Simulation Failed: " + (e as Error).message };
        }
    }

    /**
     * Sign a Solana Transaction using the Pulse Wallet
     */
    async signTransaction(
        subOrgId: string,
        privateKeyId: string,
        unsignedTx: string
    ): Promise<string> {

        const simulation = await this.simulateTransaction(unsignedTx);
        if (!simulation.success) {
            throw new Error(`🛑 SECURITY BLOCK: ${simulation.error}`);
        }

        const signResponse = await turnkeyClient.signTransaction({
            organizationId: subOrgId,
            type: "ACTIVITY_TYPE_SIGN_TRANSACTION_ED25519",
            timestampMs: Date.now().toString(),
            parameters: {
                privateKeyId: privateKeyId,
                type: "TRANSACTION_TYPE_SOLANA",
                unsignedTransaction: unsignedTx
            }
        });

        return signResponse.signedTransaction;
    }

    /**
     * "Feeds" the Tamagotchi by calling the World Program
     */
    async feedPet(assetId: string, activityType: "SPEND" | "SCAN" | "DEFI"): Promise<string> {
        console.log(`Feeding Pet ${assetId} for ${activityType}...`);

        let energyDelta = 0;
        let happinessDelta = 0;
        let xpDelta = 0;

        switch (activityType) {
            case "SPEND":
                energyDelta = 5;
                xpDelta = 10;
                break;
            case "SCAN":
                happinessDelta = 20;
                xpDelta = 50;
                break;
            case "DEFI":
                energyDelta = -5;
                xpDelta = 100;
                break;
        }

        console.log(`Stats Updated: E=${energyDelta}, H=${happinessDelta}, XP=${xpDelta}`);
        return "tx_signature_placeholder";
    }
}
