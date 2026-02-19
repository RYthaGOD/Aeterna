'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Ticket, Activity } from 'lucide-react';

export default function Dashboard() {
    const [events, setEvents] = useState([
        { name: "Techno Blast 2026", active: true, attendees: 142, revenue: "142 SOL" }
    ]);
    const [feed, setFeed] = useState<string[]>([]);

    // Simulation of WebSockets
    const addFeedItem = () => {
        const names = ["Alice", "Bob", "Charlie", "Dave"];
        const actions = ["Checked In", "Completed Quest: Main Stage", "Bought Drink"];
        const text = `${names[Math.floor(Math.random() * names.length)]} ${actions[Math.floor(Math.random() * actions.length)]}`;
        setFeed(prev => [text, ...prev].slice(0, 10));
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <header className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-6">
                <div>
                    <h1 className="text-4xl font-bold tracking-tighter">AETERNA <span className="text-purple-500">PRIME</span></h1>
                    <p className="text-zinc-500">Organizer Command Center</p>
                </div>
                <button
                    onClick={addFeedItem}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
                >
                    Simulate Live Activity
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* STATS */}
                <StatsCard icon={<Users />} label="Total Attendees" value="1,240" />
                <StatsCard icon={<Activity />} label="Live Quests" value="8 Active" />
                <StatsCard icon={<Ticket />} label="Tickets Sold" value="2,500" />
                <StatsCard icon={<MapPin />} label="Venue Capacity" value="45%" />

                {/* LIVE FEED */}
                <div className="lg:col-span-1 bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 h-[600px] overflow-hidden">
                    <h3 className="text-zinc-400 uppercase text-xs font-bold tracking-widest mb-6">Live Pulse</h3>
                    <div className="space-y-4">
                        {feed.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3 text-sm p-3 bg-zinc-900 rounded-lg border border-zinc-800/50"
                            >
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                {item}
                            </motion.div>
                        ))}
                        {feed.length === 0 && <p className="text-zinc-600 text-center italic mt-20">Waiting for signals...</p>}
                    </div>
                </div>

                {/* MAIN MAP / EVENT VIEW */}
                <div className="lg:col-span-3 bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 h-[600px] flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="text-center">
                        <h2 className="text-3xl font-bold mb-4">Event Configuration</h2>
                        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                            <button className="p-8 bg-zinc-900 border border-zinc-700 hover:border-purple-500 transition-colors rounded-xl">
                                <span className="block text-2xl mb-2">🎉</span>
                                Create New Event
                            </button>
                            <button className="p-8 bg-zinc-900 border border-zinc-700 hover:border-pink-500 transition-colors rounded-xl">
                                <span className="block text-2xl mb-2">⚔️</span>
                                Design Quest
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex items-center justify-between">
            <div>
                <p className="text-zinc-500 text-sm mb-1">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
            <div className="text-zinc-600">{icon}</div>
        </div>
    )
}
