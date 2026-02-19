"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import RebornEngine from "@/components/RebornEngine";
import MirrorSoul from "@/components/MirrorSoul";
import CinematicHUD from "@/components/CinematicHUD";

export default function Home() {
  const [wallet, setWallet] = useState<PublicKey | null>(null);
  const [xp, setXp] = useState<number>(0);
  const [wealthTier, setWealthTier] = useState<number>(0);

  const connectMock = () => {
    // Cinematic connection simulation
    const mockUser = new PublicKey("AETERNAUser1111111111111111111111111111111111");
    setWallet(mockUser);
  };

  const handleScan = () => {
    if (!wallet) return;
    setXp(prev => prev + 250);
  };

  const handleSwap = () => {
    if (!wallet) return;
    setWealthTier(1);
    setXp(prev => prev + 500);
  };

  return (
    <main className="relative w-full h-screen overflow-hidden">

      {/* THE SPATIAL ENGINE (3D WORLD) */}
      <RebornEngine>
        <MirrorSoul mood={xp > 1500 ? "HAPPY" : xp > 500 ? "NEUTRAL" : "SLEEPY"} />
      </RebornEngine>

      {/* THE CINEMATIC INTERFACE (HUD) */}
      <CinematicHUD
        wallet={wallet}
        xp={xp}
        wealthTier={wealthTier}
        onConnect={connectMock}
        onScan={handleScan}
        onSwap={handleSwap}
      />

    </main>
  );
}
