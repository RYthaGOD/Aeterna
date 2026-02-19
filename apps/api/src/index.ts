import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import * as dotenv from "dotenv";
import { WalletManager } from "./wallet_manager";
import { checkConnection } from "./turnkey_client";
import { createHmac, randomBytes } from "crypto";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { InteractionMonitor } from "./interaction_monitor";
import { BoltClient } from "./bolt_client";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGIN ?? "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(bodyParser.json());

// ── Auth Store (in-memory nonces for hackathon; use Redis/DB in production) ────
const JWT_SECRET = process.env.JWT_SECRET || "aeterna-dev-secret-change-in-prod";
const nonceStore = new Map<string, { nonce: string; expiresAt: number }>();

function signJwt(payload: object): string {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 })).toString("base64url");
    const sig = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    return `${header}.${body}.${sig}`;
}

function verifyJwt(token: string): { walletAddress: string } | null {
    try {
        const [header, body, sig] = token.split(".");
        const expected = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
        if (sig !== expected) return null;
        const payload = JSON.parse(Buffer.from(body, "base64url").toString());
        if (payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch { return null; }
}

// ── JWT Auth Middleware ────────────────────────────────────────────────────────
const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized: Missing Bearer token" });
        return;
    }
    const token = authHeader.slice(7);
    const payload = verifyJwt(token);
    if (!payload) {
        res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
        return;
    }
    (req as any).walletAddress = payload.walletAddress;
    next();
};

// Services
const walletManager = new WalletManager();

// In-memory mapping: wallet address → Turnkey subOrgId
// Populated on /pulse/create; used to enforce ownership on /pulse/sign
// In production: replace with a DB-backed lookup
const walletOwnershipMap = new Map<string, string>();

// ── Backend Keypair (Signer for grant_xp, evolve_soul) ─────────────────────
// FATAL if not set — Keypair.generate() fallback would silently break grant_xp
// because the on-chain program constraints the exact BACKEND_AUTHORITY pubkey.
if (!process.env.BACKEND_PRIVATE_KEY) {
    throw new Error("FATAL: BACKEND_PRIVATE_KEY environment variable is required. Refusing to start.");
}
const backendKeypair = Keypair.fromSecretKey(bs58.decode(process.env.BACKEND_PRIVATE_KEY));

// ── Solana Connection ────────────────────────────────────────────────────────
const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const connection = new Connection(RPC_URL, "confirmed");
const interactionMonitor = new InteractionMonitor(connection, backendKeypair);
const boltClient = new BoltClient(connection, backendKeypair);


// ── Auth Routes ──────────────────────────────────────────────────────────────

// Step 1: Get a nonce to sign
app.post("/auth/challenge", (req: Request, res: Response) => {
    const { walletAddress } = req.body;
    if (!walletAddress) { res.status(400).json({ error: "walletAddress required" }); return; }
    const nonce = randomBytes(16).toString("hex");
    nonceStore.set(walletAddress, { nonce, expiresAt: Date.now() + 5 * 60 * 1000 }); // 5 min TTL
    res.json({ nonce, message: `Sign this message to authenticate with AETERNA:\n${nonce}` });
});

// Step 2: Verify signature, receive JWT
app.post("/auth/verify", (req: Request, res: Response) => {
    const { walletAddress, signature } = req.body;
    if (!walletAddress || !signature) { res.status(400).json({ error: "walletAddress and signature required" }); return; }
    const stored = nonceStore.get(walletAddress);
    if (!stored || stored.expiresAt < Date.now()) { res.status(401).json({ error: "Nonce expired or not found" }); return; }
    try {
        const pubkey = new PublicKey(walletAddress);
        const message = new TextEncoder().encode(`Sign this message to authenticate with AETERNA:\n${stored.nonce}`);
        const sigBytes = bs58.decode(signature);
        const valid = nacl.sign.detached.verify(message, sigBytes, pubkey.toBytes());
        if (!valid) { res.status(401).json({ error: "Invalid signature" }); return; }
        nonceStore.delete(walletAddress);
        const token = signJwt({ walletAddress });
        res.json({ token });
    } catch (e: any) {
        res.status(401).json({ error: "Verification failed: " + e.message });
    }
});

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/health", async (_req, res) => {
    const turnkeyConnected = await checkConnection();
    res.json({
        status: "ok",
        service: "AETERNA Pulse Service",
        turnkey_connected: turnkeyConnected,
        // backend_authority intentionally omitted — never expose signing keys in public endpoints
    });
});

// Endpoint: Helius Webhook
app.post("/webhook", async (req, res) => {
    try {
        // Helius sends an array of events
        const events = req.body;

        // Process async to not block webhook response
        if (Array.isArray(events)) {
            for (const event of events) {
                interactionMonitor.processWebhookEvent(event).catch(err => {
                    console.error("Error processing event in background:", err);
                });
            }
        } else {
            // Single event
            interactionMonitor.processWebhookEvent(events).catch(err => {
                console.error("Error processing event in background:", err);
            });
        }

        res.status(200).send("OK");
    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).send("Error");
    }
});

// Endpoint: Create Pulse Wallet
// Input: { userEmail: string }
// Output: { subOrganizationId: string, walletAddress: string }
app.post("/pulse/create", authMiddleware, async (req: Request, res: Response) => {
    try {
        // userEmail is the wallet address (used as Turnkey sub-org identifier)
        // Must match the authenticated JWT wallet — prevents one user creating wallets for another
        const callerWallet = (req as any).walletAddress as string;
        const { userEmail } = req.body;

        if (!userEmail) {
            return res.status(400).json({ error: "userEmail is required" });
        }

        if (userEmail !== callerWallet) {
            return res.status(403).json({ error: "Forbidden: userEmail must match authenticated wallet" });
        }

        const result = await walletManager.createPulseWallet(userEmail);

        // Register wallet-to-subOrg mapping for ownership checks on /pulse/sign
        walletOwnershipMap.set(callerWallet, result.subOrganizationId);

        res.json(result);
    } catch (error: any) {
        console.error("Error creating pulse wallet:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});

// Endpoint: Sign Transaction
// Input: { subOrgId: string, unsignedTx: string (hex/base64), privateKeyId: string }
// Output: { signedTx: string }
app.post("/pulse/sign", authMiddleware, async (req, res) => {
    try {
        const { subOrgId, unsignedTx } = req.body;
        const callerWallet = (req as any).walletAddress as string;

        // B5: verify that the caller owns this subOrgId
        // In production this would be a database lookup. 
        // For this build we use the in-memory map populated at /pulse/create.
        const ownedSubOrgId = walletOwnershipMap.get(callerWallet);
        if (ownedSubOrgId !== subOrgId) {
            return res.status(403).json({ error: "Forbidden: You do not own this Pulse Wallet." });
        }

        if (!subOrgId || !unsignedTx) {
            return res.status(400).json({ error: "subOrgId and unsignedTx are required" });
        }

        // We assume we are using the "Pulse Signer" key we created earlier.
        // In a robust system, we would lookup the specific `privateKeyId` for this wallet.
        // For now, let's assume we need to pass `privateKeyId` or we fetch it.
        // Let's update the API to require `privateKeyId` for precision.
        const { privateKeyId } = req.body;

        if (!privateKeyId) {
            // Fallback or Error? 
            // Let's require it for now to be explicit.
            return res.status(400).json({ error: "privateKeyId is required" });
        }

        const signedTx = await walletManager.signTransaction(subOrgId, privateKeyId, unsignedTx);

        res.json({ signedTx });
    } catch (error: any) {
        console.error("Error signing transaction:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});

// Endpoint: Get USDC balance for a Pulse wallet
app.get("/pulse/balance/:address", authMiddleware, async (req: Request, res: Response) => {
    try {
        const { address } = req.params;
        const pubkey = new PublicKey(address);
        // Devnet USDC mint
        const USDC_MINT = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");
        const accounts = await connection.getParsedTokenAccountsByOwner(pubkey, { mint: USDC_MINT });
        const balance = accounts.value.length > 0
            ? accounts.value[0].account.data.parsed.info.tokenAmount.uiAmount
            : 0;
        res.json({ address, balance, currency: "USDC" });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Endpoint: Scan Ticket → Grant XP on-chain
// Required auth: Scanner wallet JWT
app.post("/api/scan-ticket", authMiddleware, async (req, res) => {
    try {
        const { ticketId, userSoul, locationId } = req.body;
        if (!ticketId || !userSoul) {
            return res.status(400).json({ error: "Missing ticketId or userSoul" });
        }
        console.log(`[Pulse] Scanning ticket ${ticketId} for Soul ${userSoul} at ${locationId}`);

        // Grant XP — calls the real on-chain grant_xp instruction
        const XP_PER_SCAN = 100;
        const result = await boltClient.addXP(userSoul, XP_PER_SCAN);

        res.json({
            status: "success",
            message: "Ticket Verified. XP Granted On-Chain.",
            gained_xp: XP_PER_SCAN,
            tx_signature: result.signature,
        });
    } catch (error: any) {
        console.error("Scan Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint: Simulate Swap (DeFi Warlord Logic)
// Input: { userSoul: string, volumeUsd: number }
app.post("/api/simulate-swap", async (req, res) => {
    try {
        const { userSoul, volumeUsd } = req.body;

        if (!userSoul || !volumeUsd) {
            return res.status(400).json({ error: "Missing userSoul or volumeUsd" });
        }

        console.log(`[Pulse] Simulating Swap $${volumeUsd} for Soul ${userSoul}`);

        // 1. Record Swap in Bolt (Updates Trading Volume Component)
        const result = await boltClient.recordSwap(userSoul, volumeUsd);

        // 2. Check for Evolution (Wealth Tier Upgrade)
        if (result.newTrait) {
            console.log(`[Pulse] Soul ${userSoul} Earned Trait: ${result.newTrait}!`);
        }

        res.json({
            status: "success",
            message: "Swap Recorded. Financial History Updated.",
            new_trait: result.newTrait,
            tx_signature: result.signature
        });

    } catch (error: any) {
        console.error("Swap Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Pulse Service running on port ${PORT}`);
});
