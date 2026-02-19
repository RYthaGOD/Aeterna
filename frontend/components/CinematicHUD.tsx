"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { PublicKey } from "@solana/web3.js";

interface CinematicHUDProps {
    wallet: PublicKey | null;
    xp: number;
    wealthTier: number;
    onConnect: () => void;
    onScan: () => void;
    onSwap: () => void;
}

export default function CinematicHUD({ wallet, xp, wealthTier, onConnect, onScan, onSwap }: CinematicHUDProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // STAGGERED ENTRY ANIMATION (THE "AETERNA REBIRTH")
        const ctx = gsap.context(() => {
            gsap.from(".hud-element", {
                opacity: 0,
                y: 30,
                duration: 1.5,
                stagger: 0.2,
                ease: "expo.out",
                delay: 0.5
            });

            // Infinite "Vignette Pulsing"
            gsap.to(".hud-glow", {
                opacity: 0.6,
                duration: 4,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-between p-12 overflow-hidden selection:bg-indigo-500 selection:text-white">

            {/* 1. TOP HEADER: THE PROTOCOL STATE */}
            <div className="flex justify-between items-start">
                <div className="hud-element flex flex-col gap-1 pointer-events-auto">
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${wallet ? "bg-indigo-400" : "bg-white/20"} shadow-[0_0_10px_rgba(129,140,248,0.5)]`} />
                        <h1 className="text-[10px] tracking-[0.5em] text-white/40 uppercase font-medium">AETERNA // GENESIS</h1>
                        <div className="ml-4 px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-xs flex items-center gap-2">
                            <span className="w-1 h-1 bg-indigo-400 rounded-full animate-pulse" />
                            <span className="text-[8px] text-indigo-400/80 tracking-widest uppercase">Sentinel_Active</span>
                        </div>
                    </div>
                    {wallet ? (
                        <span className="text-xl font-light text-white font-mono tracking-tighter">
                            {wallet.toString().slice(0, 6)}...{wallet.toString().slice(-4)}
                        </span>
                    ) : (
                        <button
                            onClick={onConnect}
                            className="text-xl font-light text-white/20 hover:text-white transition-colors tracking-tighter cursor-pointer"
                        >
                            CONNECT_SOUL_
                        </button>
                    )}
                </div>

                <div className="hud-element text-right pointer-events-auto">
                    <span className="text-[10px] tracking-[0.3em] text-white/40 uppercase">Stored Potential</span>
                    <div className="text-4xl font-extralight text-white font-mono">
                        ${wealthTier > 0 ? "5,420" : "420"}
                        <span className="text-sm opacity-30 ml-1">.69</span>
                    </div>
                </div>
            </div>

            {/* 2. CENTER: THE VOID (Decorative) */}
            <div className="absolute inset-0 flex items-center justify-center -z-10">
                <div className="hud-glow w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[150px] opacity-20" />
            </div>

            {/* 3. BOTTOM FOOTER: ACTIONS & PROGRESSION */}
            <div className="flex justify-between items-end">

                {/* PROGRESSION RING (Minimalist) */}
                <div className="hud-element flex flex-col gap-4 pointer-events-auto">
                    <div className="flex items-baseline gap-4">
                        <span className="text-6xl font-thin text-white/5 tracking-tighter italic">L_{Math.floor(xp / 1000) + 1}</span>
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] tracking-[0.4em] text-white/30 uppercase font-bold">Resonance Level</span>
                            <div className="w-48 h-[1px] bg-white/10 relative">
                                <div
                                    className="absolute top-0 left-0 h-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"
                                    style={{ width: `${(xp % 1000) / 10}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* INTERACTION HUB */}
                <div className="hud-element flex gap-8 pointer-events-auto items-center">
                    <button
                        onClick={onScan}
                        className="group flex flex-col items-center gap-2 transition-transform hover:-translate-y-1"
                    >
                        <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center group-hover:border-indigo-500/50 group-hover:bg-indigo-500/10 transition-all">
                            <span className="text-xs group-hover:scale-110 transition-transform">SCAN</span>
                        </div>
                    </button>

                    <button
                        onClick={onSwap}
                        className="group flex flex-col items-center gap-2 transition-transform hover:-translate-y-1"
                    >
                        <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center group-hover:border-yellow-500/50 group-hover:bg-yellow-500/10 transition-all">
                            <span className="text-xs group-hover:scale-110 transition-transform">FUSE</span>
                        </div>
                    </button>

                    <div className="h-12 w-[1px] bg-white/10 mx-2" />

                    <div className="flex flex-col text-left">
                        <span className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Timeline</span>
                        <span className="text-xs font-mono text-white/20 whitespace-nowrap">EPOCH_214.X9_SYS</span>
                    </div>
                </div>

            </div>

            {/* DECORATIVE LENS OVERLAY */}
            <div className="absolute inset-0 border-[40px] border-black pointer-events-none opacity-20 blur-2xl" />
        </div>
    );
}
