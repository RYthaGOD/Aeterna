"use client";


import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "@/lib/constants";
import { getProgram } from "@/lib/aeterna-program";

// react-qr-reader reads a camera feed and calls onResult when a QR is decoded.
// The QR code should contain the user's AETERNA Pass public key.
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fetchAsset } from "@metaplex-foundation/mpl-core";
import { publicKey as umiPublicKey } from "@metaplex-foundation/umi";
import dynamic from "next/dynamic";
const QrReader = dynamic(() => import("react-qr-reader").then(m => m.QrReader), { ssr: false });

interface Quest {
    name: string;
    eventName: string;
    xpReward: number;
}

const CURRENT_QUEST: Quest = {
    name: "devcon_check_in",
    eventName: "AETERNA_GENESIS_EVENT",
    xpReward: 100,
};

export default function ScannerPage() {
    const { publicKey } = useWallet();
    const wallet = useAnchorWallet();
    const { connection } = useConnection();

    const [scanning, setScanning] = useState(false);
    const [lastScanned, setLastScanned] = useState<string | null>(null);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [txSig, setTxSig] = useState<string | null>(null);
    const [xpGranted, setXpGranted] = useState(0);
    const [questName, setQuestName] = useState("");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleScan = useCallback(async (result: any) => {
        const text = result?.text || result?.getText?.();
        if (!text || !wallet || !publicKey) return;
        const assetPubkey = text.trim();

        // Prevent duplicate scans within the same session
        if (lastScanned === assetPubkey) return;
        setLastScanned(assetPubkey);
        setScanning(false);
        setStatus("loading");
        setQuestName(CURRENT_QUEST.name);

        try {
            // Validate it's a real public key
            new PublicKey(assetPubkey);

            // Fetch the asset owner via Umi to satisfy the smart contract constraints
            const umi = createUmi(connection.rpcEndpoint);
            const coreAsset = await fetchAsset(umi, umiPublicKey(assetPubkey));
            const recipientPubkey = new PublicKey(coreAsset.owner);

            const program = getProgram(connection, wallet);

            // Derive PDAs needed for complete_quest
            const [eventPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("event"), Buffer.from(CURRENT_QUEST.eventName)],
                new PublicKey(PROGRAM_ID)
            );

            const [questPda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("quest"),
                    eventPda.toBuffer(),
                    Buffer.from(CURRENT_QUEST.name),
                ],
                new PublicKey(PROGRAM_ID)
            );

            const [soulStatsPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("soul_stats"), new PublicKey(assetPubkey).toBuffer()],
                new PublicKey(PROGRAM_ID)
            );

            // Completion record PDA — init will fail if already completed (dedup)
            const [completionRecordPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("completion"), questPda.toBuffer(), new PublicKey(assetPubkey).toBuffer()],
                new PublicKey(PROGRAM_ID)
            );

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const tx = await (program.methods as any)
                .completeQuest()
                .accounts({
                    authority: publicKey,
                    payer: publicKey,
                    quest: questPda,
                    event: eventPda,
                    asset: new PublicKey(assetPubkey),
                    recipient: recipientPubkey,
                    soulStats: soulStatsPda,
                    completionRecord: completionRecordPda,
                    mplCoreProgram: new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"),
                    systemProgram: new PublicKey("11111111111111111111111111111111"),
                })
                .rpc();

            setTxSig(tx);
            setXpGranted(CURRENT_QUEST.xpReward);
            setStatus("success");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Unknown error";
            // AccountAlreadyInUse = quest already completed for this pass
            if (msg.includes("already in use") || msg.includes("AlreadyInUse")) {
                setStatus("error");
                setQuestName("Already completed this quest!");
            } else {
                console.error("Complete Quest failed:", err);
                setStatus("error");
            }
        }
    }, [wallet, publicKey, connection, lastScanned]);

    if (!publicKey) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
                <h1 className="text-2xl font-bold text-white tracking-widest uppercase">
                    AETERNA Scanner
                </h1>
                <p className="text-neutral-400">Connect your scanner wallet to proceed.</p>
                <WalletMultiButton className="!bg-violet-600 hover:!bg-violet-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 px-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-white tracking-widest uppercase">
                    Quest Scanner
                </h1>
                <p className="text-neutral-500 mt-2 text-sm">
                    Active Quest: <span className="text-violet-400 font-mono">{CURRENT_QUEST.name}</span>
                    {" "}| +{CURRENT_QUEST.xpReward} XP
                </p>
            </div>

            {status === "idle" && !scanning && (
                <button
                    onClick={() => { setScanning(true); setLastScanned(null); }}
                    className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl uppercase tracking-widest transition-all"
                >
                    Start Scanning
                </button>
            )}

            {scanning && (
                <div className="w-72 h-72 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(139,92,246,0.4)]">
                    <QrReader
                        onResult={handleScan}
                        constraints={{ facingMode: "environment" }}
                        className="w-full h-full"
                    />
                </div>
            )}

            {status === "loading" && (
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-neutral-400">Granting XP on-chain...</p>
                    <p className="text-xs font-mono text-neutral-600 mt-1 truncate max-w-xs">{lastScanned}</p>
                </div>
            )}

            {status === "success" && (
                <div className="text-center space-y-3">
                    <div className="text-6xl">✨</div>
                    <p className="text-green-400 font-bold text-xl">+{xpGranted} XP Granted</p>
                    <p className="text-neutral-400 text-sm">Quest <span className="text-violet-400">{questName}</span> Complete!</p>
                    {txSig && (
                        <a
                            href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-violet-500 hover:text-violet-300 underline font-mono block"
                        >
                            View on Solana Explorer ↗
                        </a>
                    )}
                    <button
                        onClick={() => { setStatus("idle"); setLastScanned(null); setScanning(true); }}
                        className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm mt-2"
                    >
                        Scan Next
                    </button>
                </div>
            )}

            {status === "error" && (
                <div className="text-center space-y-3">
                    <p className="text-red-400 font-bold">
                        {questName === "Already completed this quest!" ? "⚠️ Already Completed" : "Transaction Failed"}
                    </p>
                    <p className="text-neutral-500 text-sm">
                        {questName === "Already completed this quest!"
                            ? "This Soul has already completed this quest."
                            : "Check the console for details."}
                    </p>
                    <button
                        onClick={() => { setStatus("idle"); setLastScanned(null); }}
                        className="px-6 py-2 bg-neutral-800 text-white rounded-lg text-sm"
                    >
                        Try Again
                    </button>
                </div>
            )}

            <div className="mt-8 text-xs text-neutral-700 font-mono">
                Scanner: {publicKey.toBase58().slice(0, 8)}...
            </div>
        </div>
    );
}
