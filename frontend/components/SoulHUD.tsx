"use client";

import { motion } from "framer-motion";
import { PublicKey } from "@solana/web3.js";

interface SoulHUDProps {
    wallet: PublicKey | null;
    xp: number;
    wealthTier: number;
    onConnect: () => void;
    onScan: () => void;
    onSwap: () => void;
}

export default function SoulHUD({ wallet, xp, wealthTier, onConnect, onScan, onSwap }: SoulHUDProps) {

    // Animation Variants
    const hudVariant: any = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    return (
        <div className="absolute inset-0 z-50 pointer-events-none p-6 flex flex-col justify-between">

            {/* TOP LEFT: CONNECTIVITY */}
            <motion.div
                initial="hidden" animate="visible" variants={hudVariant}
                className="flex items-center gap-4 pointer-events-auto"
            >
                <div onClick={onConnect} className="cursor-pointer group flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${wallet ? "bg-emerald-400 shadow-[0_0_15px_#34d399] animate-pulse" : "bg-red-500"}`} />
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-white/50 group-hover:text-white transition-colors">
                            {wallet ? "LINK ESTABLISHED" : "NO CARRIER"}
                        </span>
                        {wallet && <span className="text-xs font-mono text-white/80">{wallet.toString().slice(0, 4)}...{wallet.toString().slice(-4)}</span>}
                    </div>
                </div>
            </motion.div>

            {/* TOP RIGHT: MANA (BALANCE) */}
            <motion.div
                initial="hidden" animate="visible" variants={hudVariant}
                className="self-end text-right pointer-events-auto"
            >
                <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">Stored Energy</span>
                    <div className="text-3xl font-light text-white font-mono flex items-baseline gap-2">
                        <span>$</span>
                        {wealthTier > 0 ? "5,420.69" : "420.69"}
                    </div>
                    {wealthTier > 0 && (
                        <span className="px-2 py-0.5 mt-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-[10px] text-yellow-300 uppercase">
                            Midas Tier
                        </span>
                    )}
                </div>
            </motion.div>

            {/* CENTER: DISCONNECTED STATE */}
            {!wallet && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onConnect}
                        className="px-8 py-4 bg-white/5 border border-white/10 backdrop-blur-md rounded-full text-white font-bold tracking-widest hover:bg-white/10 hover:border-white/30 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                    >
                        INITIALIZE SOUL
                    </motion.button>
                </div>
            )}

            {/* BOTTOM BAR: CONTROLS & XP */}
            {wallet && (
                <motion.div
                    initial="hidden" animate="visible" variants={hudVariant}
                    className="flex items-end justify-between w-full pointer-events-auto"
                >
                    {/* XP & LEVEL */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-white/10">0{Math.floor(xp / 1000) + 1}</span>
                            <span className="text-sm font-bold text-white uppercase tracking-widest">Construct Level</span>
                        </div>
                        <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 shadow-[0_0_10px_#6366f1]"
                                style={{ width: `${(xp % 1000) / 10}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-mono text-white/40">{xp} / 1000 XP</span>
                    </div>

                    {/* ACTIONS (RUNE MENU) */}
                    <div className="flex gap-4">
                        <button
                            onClick={onScan}
                            className="group p-4 rounded-xl bg-black/40 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-900/20 backdrop-blur-md transition-all"
                        >
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-xl group-hover:scale-110 transition-transform">🎫</span>
                                <span className="text-[8px] uppercase tracking-widest text-emerald-400">Scan</span>
                            </div>
                        </button>

                        <button
                            onClick={onSwap}
                            className="group p-4 rounded-xl bg-black/40 border border-yellow-500/30 hover:border-yellow-400 hover:bg-yellow-900/20 backdrop-blur-md transition-all"
                        >
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-xl group-hover:scale-110 transition-transform">⚡</span>
                                <span className="text-[8px] uppercase tracking-widest text-yellow-400">Transmute</span>
                            </div>
                        </button>
                    </div>
                </motion.div>
            )}

            {/* DECORATIVE CORNERS (FUTURISTIC) */}
            <div className="absolute top-6 right-6 w-32 h-32 border-t border-r border-white/10 rounded-tr-3xl pointer-events-none" />
            <div className="absolute bottom-6 left-6 w-32 h-32 border-b border-l border-white/10 rounded-bl-3xl pointer-events-none" />
        </div>
    );
}
