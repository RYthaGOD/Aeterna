"use client";

import { useState, useCallback } from "react";
import { useWallet, useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import Forge from "./Forge";
import { useAeternaPass } from "@/hooks/useAeternaPass";
import { useSoulStats } from "@/hooks/useSoulStats";
import { XP_THRESHOLD_ACTIVE, XP_THRESHOLD_ASCENDED, PROGRAM_ID, MPL_CORE_PROGRAM_ID } from "@/lib/constants";
import { getProgram } from "@/lib/aeterna-program";

export default function SoulWallet() {
    const { publicKey } = useWallet();
    const wallet = useAnchorWallet();
    const { connection } = useConnection();
    const [activeTab, setActiveTab] = useState<"assets" | "traits" | "evolution">("assets");
    const [evolving, setEvolving] = useState(false);
    const [evolveSuccess, setEvolveSuccess] = useState(false);

    // ── Live on-chain data ──────────────────────────────────────────────────
    const { assetPubkey, xp: metaplexXp, stage, status, loading: passLoading } = useAeternaPass(publicKey?.toBase58() ?? null);
    const { xp, questsCompleted, loading: statsLoading } = useSoulStats(assetPubkey);

    // Prefer SoulStats PDA XP (authoritative) over Metaplex attribute XP
    const displayXp = xp || metaplexXp;
    const nextThreshold = stage === 0 ? XP_THRESHOLD_ACTIVE : XP_THRESHOLD_ASCENDED;
    const xpProgress = Math.min((displayXp / nextThreshold) * 100, 100);
    const canEvolve = stage === 0
        ? displayXp >= XP_THRESHOLD_ACTIVE
        : stage === 1 && displayXp >= XP_THRESHOLD_ASCENDED;

    // ── Evolution handler ────────────────────────────────────────────────────
    const handleEvolve = useCallback(async () => {
        if (!assetPubkey || !wallet || !publicKey || !canEvolve) return;
        setEvolving(true);
        try {
            const program = getProgram(connection, wallet);

            const [soulStatsPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("soul_stats"), new PublicKey(assetPubkey).toBuffer()],
                new PublicKey(PROGRAM_ID)
            );

            const newStage = stage + 1;
            await (program.methods as any)
                .evolveSoul({
                    newUri: null,
                    newStage,
                    attributes: [
                        { key: "stage", value: newStage.toString() },
                        { key: "xp", value: displayXp.toString() },
                        { key: "status", value: newStage === 1 ? "Active" : "Ascended" },
                    ],
                })
                .accounts({
                    authority: publicKey,
                    payer: publicKey,
                    asset: new PublicKey(assetPubkey),
                    soulStats: soulStatsPda,
                    mplCoreProgram: new PublicKey(MPL_CORE_PROGRAM_ID),
                    systemProgram: new PublicKey("11111111111111111111111111111111"),
                })
                .rpc();

            setEvolveSuccess(true);
        } catch (e) {
            console.error("Evolution failed:", e);
        } finally {
            setEvolving(false);
        }
    }, [assetPubkey, wallet, publicKey, connection, canEvolve, stage, displayXp]);

    if (!publicKey) {
        return (
            <div className="w-full max-w-5xl mx-auto h-[800px] bg-slate-900/80 backdrop-blur-xl rounded-3xl flex items-center justify-center">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-black tracking-widest text-white">AETERNA</h1>
                    <p className="text-slate-400 text-sm">Connect your wallet to access your Soul</p>
                    <WalletMultiButton className="!bg-indigo-600 hover:!bg-indigo-500" />
                </div>
            </div>
        );
    }

    const isLoading = passLoading || statsLoading;

    return (
        <div className="w-full max-w-5xl mx-auto h-[800px] bg-slate-900/80 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col md:flex-row relative">

            {/* BACKGROUND EFFECTS */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[100px] rounded-full mix-blend-screen animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 blur-[100px] rounded-full mix-blend-screen"></div>
            </div>

            {/* LEFT COLUMN: THE FORGE */}
            <div className="w-full md:w-1/2 h-1/2 md:h-full relative bg-gradient-to-b from-slate-900/0 to-slate-950/50">
                <div className="absolute top-6 left-6 z-10">
                    <h1 className="text-2xl font-black tracking-widest text-white">AETERNA</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]"></div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                            {status} | Stage {stage}
                        </span>
                    </div>
                </div>

                <div className="w-full h-full">
                    {isLoading ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : assetPubkey ? (
                        <Forge xpLevel={Math.floor(displayXp / 100)} wealthTier={stage} />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                            <p className="text-slate-400 text-sm mb-4">No AETERNA Pass found</p>
                            <WalletMultiButton className="!bg-indigo-600" />
                        </div>
                    )}
                </div>

                {/* XP Bar */}
                {assetPubkey && (
                    <div className="absolute bottom-8 left-8 right-8 z-10">
                        <div className="flex justify-between text-xs font-bold text-white mb-2 uppercase tracking-wider">
                            <span>Stage {stage} — {status}</span>
                            <span>{displayXp} / {nextThreshold} XP</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 shadow-[0_0_10px_#6366f1] transition-all duration-1000"
                                style={{ width: `${xpProgress}%` } as React.CSSProperties}
                            />
                        </div>
                        <div className="mt-2 text-[10px] text-center text-slate-500 font-mono">
                            {questsCompleted} Quests Completed
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT COLUMN: THE INTERFACE */}
            <div className="w-full md:w-1/2 h-1/2 md:h-full bg-slate-950/80 border-l border-white/5 flex flex-col">

                {/* TABS */}
                <div className="flex border-b border-white/5">
                    {["assets", "traits", "evolution"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex-1 py-6 text-xs font-bold uppercase tracking-widest transition-all
                                ${activeTab === tab
                                    ? "text-white bg-white/5 border-b-2 border-indigo-500"
                                    : "text-slate-500 hover:text-white hover:bg-white/5"}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-8">

                    {/* ASSETS TAB */}
                    {activeTab === "assets" && (
                        <div className="space-y-6">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                <span className="text-slate-400 text-xs uppercase block mb-1">Asset</span>
                                <div className="text-xs font-mono text-indigo-300 truncate">
                                    {assetPubkey ?? "No pass found"}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div className="text-slate-400 text-xs uppercase mb-1">XP (on-chain)</div>
                                    <div className="text-2xl font-bold text-white">{displayXp}</div>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div className="text-slate-400 text-xs uppercase mb-1">Quests</div>
                                    <div className="text-2xl font-bold text-white">{questsCompleted}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TRAITS TAB */}
                    {activeTab === "traits" && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <div className="text-4xl">🧬</div>
                            <h3 className="text-white font-bold">Soul Traits</h3>
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-200 text-left w-full">
                                <strong>Active Traits:</strong>
                                <ul className="list-disc pl-4 mt-2 space-y-1 text-slate-300">
                                    <li>Early Adopter</li>
                                    {stage >= 1 && <li>Awakened Soul</li>}
                                    {stage >= 2 && <li>Ascendant</li>}
                                    {questsCompleted >= 3 && <li>Raver (Event Attendance)</li>}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* EVOLUTION TAB */}
                    {activeTab === "evolution" && (
                        <div className="space-y-6">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="text-slate-400 text-xs uppercase mb-3">Evolution Progress</div>
                                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000"
                                        style={{ width: `${xpProgress}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-slate-500 font-mono">
                                    <span>{displayXp} XP</span>
                                    <span>Need: {nextThreshold} XP</span>
                                </div>
                            </div>

                            {evolveSuccess ? (
                                <div className="text-center space-y-2">
                                    <div className="text-5xl">✨</div>
                                    <p className="text-green-400 font-bold">Evolution Complete!</p>
                                </div>
                            ) : (
                                <button
                                    onClick={handleEvolve}
                                    disabled={!canEvolve || evolving}
                                    className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all
                                        ${canEvolve && !evolving
                                            ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-[0_0_30px_rgba(99,102,241,0.4)]"
                                            : "bg-white/5 text-slate-600 cursor-not-allowed"}`}
                                >
                                    {evolving ? "Evolving..." : canEvolve
                                        ? `✨ ASCEND TO ${stage === 0 ? "ACTIVE" : "ASCENDED"}`
                                        : `${nextThreshold - displayXp} XP to Evolve`}
                                </button>
                            )}

                            <p className="text-[10px] text-slate-600 font-mono text-center">
                                AETERNA PROGRAM: {PROGRAM_ID.slice(0, 8)}...
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
