"use client";

import { useState } from "react";
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
      await connect().catch((err) => {
        // Silently catch the error when a user cancels the modal or hasn't selected a wallet
        if (err.name === 'WalletNotSelectedError') {
          console.log("Wallet connection cancelled by user.");
        } else {
          console.error("Connection failed:", err);
        }
      });
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
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      {/* THE SPATIAL ENGINE (3D WORLD) */}
      <div className="absolute inset-0 z-0">
        <RebornEngine>
          <MirrorSoul mood={xp > 1500 ? "HAPPY" : xp > 500 ? "NEUTRAL" : "SLEEPY"} />
        </RebornEngine>
      </div>

      {/* THE CINEMATIC INTERFACE (HUD) */}
      <div className="absolute inset-0 z-50 pointer-events-none">
        <CinematicHUD
          wallet={wallet}
          xp={xp}
          wealthTier={wealthTier}
          onConnect={handleConnect}
          onScan={handleScan}
          onSwap={handleSwap}
        />
      </div>
    </main>
  );
}
