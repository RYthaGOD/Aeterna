import { useState, useEffect } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { getProgram } from "@/lib/aeterna-program";
import { PROGRAM_ID } from "@/lib/constants";

interface SoulStatsData {
    xp: number;
    questsCompleted: number;
    loading: boolean;
    error: string | null;
}

/**
 * Reads the SoulStats PDA for a given asset pubkey.
 * Seeds: ["soul_stats", assetPubkey]
 */
export function useSoulStats(assetPubkey: string | null): SoulStatsData {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();
    const [data, setData] = useState<SoulStatsData>({
        xp: 0,
        questsCompleted: 0,
        loading: false,
        error: null,
    });

    useEffect(() => {
        if (!assetPubkey || !wallet) return;

        let cancelled = false;
        const fetchSoulStats = async () => {
            try {
                const program = getProgram(connection, wallet);

                const [soulStatsPda] = PublicKey.findProgramAddressSync(
                    [Buffer.from("soul_stats"), new PublicKey(assetPubkey).toBuffer()],
                    new PublicKey(PROGRAM_ID)
                );

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const stats = await (program.account as any).soulStats.fetch(soulStatsPda);

                if (!cancelled) {
                    setData({
                        xp: stats.xp.toNumber(),
                        questsCompleted: stats.questsCompleted,
                        loading: false,
                        error: null,
                    });
                }
            } catch {
                // PDA may not exist yet (unminted pass) — silently return zeros
                if (!cancelled) {
                    setData({ xp: 0, questsCompleted: 0, loading: false, error: null });
                }
            }
        };

        fetchSoulStats();
        return () => { cancelled = true; };
    }, [assetPubkey, wallet, connection]);

    return data;
}
