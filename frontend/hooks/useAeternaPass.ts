import { useState, useEffect } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";
import { mplCore, fetchAssetsByOwner } from "@metaplex-foundation/mpl-core";

interface AeternaPassData {
    assetPubkey: string | null;
    xp: number;
    stage: number;
    status: "Dormant" | "Active" | "Ascended";
    loading: boolean;
    error: string | null;
}

/**
 * Reads the wallet's AETERNA Pass from Metaplex Core.
 * Returns the asset pubkey, XP (from attributes), stage, and status.
 */
export function useAeternaPass(walletPubkey: string | null): AeternaPassData {
    const { connection } = useConnection();
    const [data, setData] = useState<AeternaPassData>({
        assetPubkey: null,
        xp: 0,
        stage: 0,
        status: "Dormant",
        loading: false,
        error: null,
    });

    useEffect(() => {
        if (!walletPubkey) return;
        setData(d => ({ ...d, loading: true, error: null }));

        const fetchPass = async () => {
            try {
                const umi = createUmi(connection.rpcEndpoint).use(mplCore());
                const assets = await fetchAssetsByOwner(umi, publicKey(walletPubkey));

                const aeternaPass = assets[0]; // First asset — in production filter by collection

                if (!aeternaPass) {
                    setData({ assetPubkey: null, xp: 0, stage: 0, status: "Dormant", loading: false, error: null });
                    return;
                }

                // Parse attributes from Metaplex Core attributes plugin (G5: Hardened parsing)
                // fetchAssetsByOwner returns AssetV1[] which has attributes property
                const attrs: { key: string; value: string }[] = (aeternaPass as any).attributes?.attributeList ?? [];

                const getAttr = (key: string) => attrs.find(a => a.key === key)?.value ?? null;
                const xp = parseInt(getAttr("xp") ?? "0", 10);
                const stage = parseInt(getAttr("stage") ?? "0", 10);
                const status = (getAttr("status") as AeternaPassData["status"]) ?? "Dormant";

                setData({
                    assetPubkey: aeternaPass.publicKey.toString(),
                    xp,
                    stage,
                    status,
                    loading: false,
                    error: null,
                });
            } catch (e: unknown) {
                setData(d => ({ ...d, loading: false, error: e instanceof Error ? e.message : String(e) }));
            }
        };

        fetchPass();
    }, [walletPubkey, connection]);

    return data;
}
