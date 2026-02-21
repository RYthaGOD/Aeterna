"use client";

import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import RebornEngine from "@/components/RebornEngine";
import MirrorSoul from "@/components/MirrorSoul";
import CinematicHUD from "@/components/CinematicHUD";

export default function Home() {
  const { publicKey, connect, disconnect, connected } = useWallet();
  const [xp, setXp] = useState<number>(0);
  const [wealthTier, setWealthTier] = useState<number>(0);

  // Sync wallet adapter state to local state (or just pass `publicKey` down directly)
  const wallet = publicKey;

  const handleConnect = async () => {
    if (connected) {
      await disconnect();
    } else {
      await connect().catch(console.error);
    }
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
        onConnect={handleConnect}
        onScan={handleScan}
        onSwap={handleSwap}
      />

    </main>
  );
}
