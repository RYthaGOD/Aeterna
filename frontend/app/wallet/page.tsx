'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Trophy, Star } from 'lucide-react';

export default function UserWallet() {
    // const [activeTab, setActiveTab] = useState('ticket'); // Unused
    const [xp, setXp] = useState(150);
    const [level, setLevel] = useState("Gold VIP");

    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans max-w-md mx-auto border-x border-zinc-900 shadow-2xl overflow-hidden relative">
            {/* HEADER */}
            <div className="p-6 bg-gradient-to-b from-purple-900/20 to-transparent">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl font-bold tracking-tight">Access Pass</h1>
                    <div className="px-3 py-1 bg-zinc-800 rounded-full text-xs font-mono text-zinc-400">
                        ID: 8x...J9kL
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 blur-3xl opacity-20" />
                    <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl overflow-hidden">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Event</p>
                                <h2 className="text-2xl font-bold">Techno Blast 2026</h2>
                            </div>
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black font-bold text-xl">
                                ⚡
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl mb-4 shadow-lg">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=AETERNA_ASSET_ID_MOCK`}
                                alt="Ticket QR"
                                className="w-full aspect-square object-contain opacity-90"
                            />
                        </div>

                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs text-zinc-500">Status</p>
                                <p className="text-green-400 font-medium flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    Active
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-zinc-500">Stage</p>
                                <p className="text-white font-medium">{level}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* XP BAR */}
            <div className="px-6 py-4">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-400">Current XP</span>
                    <span className="text-purple-400 font-bold">{xp} / 500</span>
                </div>
                <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(xp / 500) * 100}%` }}
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    />
                </div>
            </div>

            {/* QUESTS LOG */}
            <div className="px-6">
                <h3 className="text-zinc-500 uppercase text-xs font-bold tracking-widest mb-4">Recent Activity</h3>
                <div className="space-y-3">
                    <ActivityItem icon={<Star className="w-4 h-4 text-yellow-500" />} title="Quest Complete: Main Stage" time="2m ago" xp="+50 XP" />
                    <ActivityItem icon={<Trophy className="w-4 h-4 text-purple-500" />} title="Resurrection Event" time="1h ago" xp="Level Up" />
                    <ActivityItem icon={<Wallet className="w-4 h-4 text-blue-500" />} title="Linked Pulse Wallet" time="1d ago" xp="" />
                </div>
            </div>
        </div>
    );
}

function ActivityItem({ icon, title, time, xp }: any) {
    return (
        <div className="flex items-center gap-4 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
            <div className="p-2 bg-zinc-900 rounded-lg">{icon}</div>
            <div className="flex-1">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-zinc-500">{time}</p>
            </div>
            <span className="text-xs font-bold text-purple-400">{xp}</span>
        </div>
    )
}
