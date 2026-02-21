import { WalletManager } from "../apps/api/src/wallet_manager";
import * as fs from "fs";
import * as path from "path";
import { Connection } from "@solana/web3.js";
import fetch from "node-fetch";

const LOG_FILE = path.join(__dirname, "../AUDIT_MASTER.md");

function writeLog(message: string) {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${message}\n`;
    console.log(message);
    fs.appendFileSync(LOG_FILE, entry);
}

class Clone {
    id: number;
    wm: WalletManager;

    constructor(id: number) {
        this.id = id;
        this.wm = new WalletManager();
    }

    async testSimulationGuard() {
        writeLog(`[Clone ${this.id}] Initiating Security Perimeter Breach Attempt...`);
        // A generic random hex string that should fail deserialization or verification
        const malTx = "0000deadbeefbadc0ffee";

        const result = await this.wm.simulateTransaction(malTx);
        if (!result.success) {
            writeLog(`✅ [Clone ${this.id}] Guard Held. Malicious payload blocked. Reason: ${result.error}`);
        } else {
            writeLog(`⚠️ [Clone ${this.id}] CRITICAL: Guard bypassed!`);
        }
    }

    async pingRPC() {
        writeLog(`[Clone ${this.id}] Pinging Solana Devnet via RPC...`);
        try {
            // Check world program account creation
            const conn = new Connection(process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com", {
                commitment: "confirmed",
                fetch: fetch as any
            });
            const blockhash = await conn.getLatestBlockhash();
            writeLog(`✅ [Clone ${this.id}] RPC Active. Blockhash: ${blockhash.blockhash}`);
        } catch (error) {
            writeLog(`⚠️ [Clone ${this.id}] RPC Ping Failed: ${String(error)}`);
        }
    }

    async executeSweep() {
        await this.pingRPC();
        await this.testSimulationGuard();
    }
}

async function runArmy(cloneCount: number) {
    writeLog(`\n--- 🌀 RYKIRI COMMAND: DEPLOYING ${cloneCount} SHADOW CLONES ---`);

    const clones = Array.from({ length: cloneCount }).map((_, i) => new Clone(i + 1));

    let cycle = 1;
    while (true) {
        writeLog(`\n=== ⚔️ INITIATING STRESS CYCLE ${cycle} ===`);

        // Run clones sequentially with a staggering jitter to avoid rate limits
        for (const clone of clones) {
            await clone.executeSweep();
            // Stagger delay between clones (2 seconds)
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        writeLog(`=== 🛡️ CYCLE ${cycle} COMPLETE. RECHARGING MANA... ===`);

        // Cooldown between waves (30 seconds)
        await new Promise(resolve => setTimeout(resolve, 30000));
        cycle++;
    }
}

// Initialize Log File Header
if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, "# AETERNA INFINITE SENTINEL LOG\n\n");
}

runArmy(3).catch(err => writeLog(`FATAL ERROR: ${String(err)}`));
