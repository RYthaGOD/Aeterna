"use client";

import Forge from "@/components/Forge";

export default function ForgePage() {
    return (
        <main className="min-h-screen bg-black text-white p-8 flex flex-col items-center">

            <div className="w-full max-w-6xl mb-8 flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-widest text-indigo-500 neon-text-indigo">
                    AETERNA <span className="text-white">FORGE</span>
                </h1>
                <a href="/" className="text-xs font-mono text-slate-400 hover:text-white transition-colors">
                    ← RETURN TO SOUL
                </a>
            </div>

            <div className="w-full max-w-6xl">
                <Forge />
            </div>

            <div className="w-full max-w-6xl mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-6 border border-slate-800 rounded-xl bg-slate-900/50">
                    <h3 className="text-indigo-400 font-bold mb-2">1. UNLOCK</h3>
                    <p className="text-sm text-slate-400">
                        Earn traits by swapping, minting, and attending events.
                    </p>
                </div>
                <div className="p-6 border border-slate-800 rounded-xl bg-slate-900/50">
                    <h3 className="text-indigo-400 font-bold mb-2">2. EQUIP</h3>
                    <p className="text-sm text-slate-400">
                        Customize your Soul's appearance in the Forge.
                    </p>
                </div>
                <div className="p-6 border border-slate-800 rounded-xl bg-slate-900/50">
                    <h3 className="text-indigo-400 font-bold mb-2">3. EVOLVE</h3>
                    <p className="text-sm text-slate-400">
                        Commit changes on-chain to update your Metaplex Core asset permanently.
                    </p>
                </div>
            </div>
        </main>
    );
}
