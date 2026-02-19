"use client";

import { useState, useEffect } from 'react';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { publicKey } from '@metaplex-foundation/umi';
import { fetchAssetV1, AssetV1 } from '@metaplex-foundation/mpl-core';
import Forge from './Forge';
import { bridgeSoulDNA } from '../utils/SoulBridge';

// Initialize Umi (Connect to Devnet)
const umi = createUmi('https://api.devnet.solana.com');

interface AvatarDisplayProps {
    assetAddress: string;
}

export default function AvatarDisplay({ assetAddress }: AvatarDisplayProps) {
    const [asset, setAsset] = useState<AssetV1 | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadAvatar() {
            if (!assetAddress) return;

            try {
                setLoading(true);
                setError(null);

                // Fetch the asset using Umi
                const fetchedAsset = await fetchAssetV1(umi, publicKey(assetAddress));
                setAsset(fetchedAsset);

                // Fetch off-chain JSON (Image)
                if (fetchedAsset.uri) {
                    try {
                        const response = await fetch(fetchedAsset.uri);
                        const json = await response.json();
                        setImageUri(json.image);
                    } catch (err) {
                        console.error("Failed to fetch metadata URI", err);
                    }
                }

            } catch (err: any) {
                console.error("Error fetching avatar:", err);
                setError("Failed to load Soul.");
            } finally {
                setLoading(false);
            }
        }

        loadAvatar();
    }, [assetAddress]);

    if (loading) return <div className="animate-pulse h-64 w-64 bg-slate-800 rounded-xl"></div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!asset) return null;

    // Parse Attributes via Bridge
    const attributesPlugin = asset.plugins?.find(p => p.type === 'Attributes');
    const attributeList = attributesPlugin?.data.attributeList || [];

    // CONVERT METAPLEX DATA -> VISUAL DNA
    const soulDNA = bridgeSoulDNA(attributeList);

    // Derived Stats for UI
    const currentXP = Number(attributeList.find(a => a.key === 'XP')?.value || 0);
    const currentLevel = Number(attributeList.find(a => a.key === 'Level')?.value || 1);
    const nextLevelXP = currentLevel * 1000;
    const prevLevelXP = (currentLevel - 1) * 1000;
    const progressPercent = Math.min(Math.max(((currentXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100, 0), 100);

    return (
        <div className="flex flex-col items-center w-full max-w-5xl mx-auto bg-[#050505] p-8 rounded-3xl border border-white/10 shadow-2xl">

            {/* 3D SOUL VIEWPORT */}
            <div className="w-full h-[500px] mb-8 relative group rounded-2xl overflow-hidden border border-white/5 bg-black/20">
                {/* We pass the bridged DNA into the Forge */}
                <Forge dna={soulDNA} />

                {/* Overlay Info */}
                <div className="absolute top-6 left-6">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Soul Identity</div>
                    <h2 className="text-3xl font-bold text-white tracking-tight mb-1">{asset.name}</h2>
                    <div className="inline-flex items-center px-2 py-1 rounded-md bg-white/10 border border-white/10 backdrop-blur-md">
                        <span className="text-indigo-300 text-xs font-mono uppercase tracking-wider">
                            {attributeList.find(a => a.key === 'Title')?.value || 'Wanderer'}
                        </span>
                    </div>
                </div>
            </div>

            {/* STATS GRID (Debug View of Chains Data) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                    <div className="text-xs text-slate-500 uppercase tracking-widest">Entropy</div>
                    <div className="text-xl font-mono text-white">{soulDNA.txCount}</div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                    <div className="text-xs text-slate-500 uppercase tracking-widest">Wealth Tier</div>
                    <div className="text-xl font-mono text-white text-emerald-400">${soulDNA.wealthUsd}</div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                    <div className="text-xs text-slate-500 uppercase tracking-widest">Scars</div>
                    <div className="text-xl font-mono text-white text-red-400">{soulDNA.burnCount}</div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                    <div className="text-xs text-slate-500 uppercase tracking-widest">Age</div>
                    <div className="text-xl font-mono text-white">{soulDNA.walletAgeDays} Days</div>
                </div>
            </div>
            {/* XP Bar (Dynamic) */}
            <div className="w-full mt-8 bg-white/5 p-6 rounded-2xl border border-white/10">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Progression</div>
                        <div className="text-white font-bold text-lg">Level {currentLevel}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-indigo-400 font-mono">{currentXP} / {nextLevelXP} XP</div>
                    </div>
                </div>
                <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
}
