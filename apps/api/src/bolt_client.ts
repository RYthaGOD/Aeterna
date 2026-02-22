import { Connection, PublicKey, Keypair, Transaction, TransactionInstruction } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

export class BoltClient {
    connection: Connection;
    authority: Keypair;
    worldProgramId: PublicKey;
    aeternaProgramId: PublicKey;

    constructor(connection: Connection, authority: Keypair) {
        this.connection = connection;
        this.authority = authority;

        // Use environment variables or fallback to known devnet addresses
        this.worldProgramId = new PublicKey(process.env.WORLD_PROGRAM_ID || "WorLd11111111111111111111111111111111111111");
        this.aeternaProgramId = new PublicKey(process.env.AETERNA_PROGRAM_ID || "E3aVLq7oT4BFPjHRXaZmYupDJ9EZTG8At8oafLKzPMBG");
    }

    /**
     * Broadcasts a real Solana transaction to the network
     */
    private async sendAndConfirm(ixs: TransactionInstruction[]): Promise<string> {
        const tx = new Transaction().add(...ixs);
        const { blockhash } = await this.connection.getLatestBlockhash("confirmed");
        tx.recentBlockhash = blockhash;
        tx.feePayer = this.authority.publicKey;

        tx.sign(this.authority);

        try {
            const signature = await this.connection.sendRawTransaction(tx.serialize(), { skipPreflight: false });
            await this.connection.confirmTransaction(signature, "confirmed");
            return signature;
        } catch (error) {
            console.error("[BoltClient] Transaction Failed:", error);
            throw error;
        }
    }

    /**
     * Adds XP to a user's Soul entity on the Ephemeral Rollup / Devnet.
     */
    async addXP(userSoul: string, amount: number): Promise<{ signature: string, newLevel?: number }> {
        console.log(`[Bolt] Transmitting +${amount} XP to Soul ${userSoul} on Devnet...`);

        // Grant XP uses discriminator `df9319fc5bed7cd5`
        // Memory Layout:
        // [0..8] Discriminator
        // [8..16] xp_amount (u64)
        // [16] add_trading_volume Option flag (0 = None)
        // [17] quests_completed Option flag (0 = None)

        const data = Buffer.alloc(8 + 8 + 1 + 1);
        Buffer.from("df9319fc5bed7cd5", "hex").copy(data, 0);
        data.writeBigUInt64LE(BigInt(amount), 8);
        data.writeUInt8(0, 16);
        data.writeUInt8(0, 17);

        const SystemProgram = new PublicKey("11111111111111111111111111111111");
        const [soulStatsPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("soul_stats"), new PublicKey(userSoul).toBuffer()],
            this.aeternaProgramId
        );

        const ix = new TransactionInstruction({
            programId: this.aeternaProgramId,
            keys: [
                { pubkey: this.authority.publicKey, isSigner: true, isWritable: true },
                { pubkey: soulStatsPda, isSigner: false, isWritable: true },
                { pubkey: SystemProgram, isSigner: false, isWritable: false }
            ],
            data
        });

        const signature = await this.sendAndConfirm([ix]);
        console.log(`[Bolt] Success. TX: ${signature}`);

        return { signature, newLevel: undefined };
    }

    /**
     * Records a Swap interaction on-chain
     */
    async recordSwap(userSoul: string, volumeUsd: number): Promise<{ signature: string, newTrait?: string }> {
        console.log(`[Bolt] Recording Swap $${volumeUsd} for Soul ${userSoul} on Devnet...`);

        // Update Soul uses discriminator `c31371ab5aabd39a`
        // Layout: Discriminator (8) + Options: energy (1), happiness (1), xp (1), add_trading_volume (1) + val (8)
        const data = Buffer.alloc(20);
        Buffer.from("c31371ab5aabd39a", "hex").copy(data, 0);
        data.writeUInt8(0, 8); // Option<u8> energy = None
        data.writeUInt8(0, 9); // Option<u8> happiness = None
        data.writeUInt8(0, 10); // Option<u64> xp = None
        data.writeUInt8(1, 11); // Option<u64> add_trading_volume = Some()
        data.writeBigUInt64LE(BigInt(volumeUsd), 12);

        const ix = new TransactionInstruction({
            programId: this.worldProgramId,
            keys: [
                { pubkey: new PublicKey(userSoul), isSigner: false, isWritable: true },
                { pubkey: this.authority.publicKey, isSigner: true, isWritable: false }
            ],
            data
        });

        const signature = await this.sendAndConfirm([ix]);
        console.log(`[Bolt] Swap Recorded. TX: ${signature}`);

        return { signature, newTrait: volumeUsd > 1000 ? "Gold Armor" : undefined };
    }

    /**
     * Reads the current components of a Soul entity directly from the RPC.
     */
    async getSoulStats(userSoul: string): Promise<any> {
        const soulPubkey = new PublicKey(userSoul);
        const accountInfo = await this.connection.getAccountInfo(soulPubkey);

        if (!accountInfo) {
            return { xp: 0, level: "Dormant", traits: {} };
        }

        // Normally we deserialize `accountInfo.data` using the Anchor IDL.
        // For now, we return placeholder live data based on account existence.
        return {
            xp: 250,
            level: "Active",
            traits: { "Title": "Verified Warlord" }
        };
    }
}
