"use client";

import { useState, useEffect } from "react";
import { useWallet, useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { useAeternaAuth } from "@/hooks/useAeternaAuth";
import { usePulseBalance } from "@/hooks/usePulseBalance";
import { useAeternaPass } from "@/hooks/useAeternaPass";
import { PULSE_API_URL, PROGRAM_ID } from "@/lib/constants";
import { getProgram } from "@/lib/aeterna-program";

export default function PulseDashboard() {
    const { publicKey } = useWallet();
    const wallet = useAnchorWallet();
    const { connection } = useConnection();

    // Auth and asset state
    const { jwtToken, loading: authLoading, error: authError, authenticate } = useAeternaAuth();
    const { assetPubkey } = useAeternaPass(publicKey?.toBase58() ?? null);

    // Pulse wallet state (stored in component state after creation)
    const [pulseWalletAddress, setPulseWalletAddress] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [statusMsg, setStatusMsg] = useState<string | null>(null);

    // Live balance from Pulse Service
    const { balance, currency, loading: balanceLoading } = usePulseBalance(pulseWalletAddress, jwtToken);

    // ── Auth on wallet connect ────────────────────────────────────────────────
    useEffect(() => {
        if (publicKey && !jwtToken && !authLoading) {
            authenticate();
        }
    }, [publicKey, jwtToken, authLoading, authenticate]);

    // ── Create Pulse Wallet ────────────────────────────────────────────────────
    const createWallet = async () => {
        if (!publicKey) return;
        setCreating(true);
        setStatusMsg(null);
        try {
            const res = await fetch(`${PULSE_API_URL}/pulse/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userEmail: publicKey.toBase58() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            const { walletAddress, subOrganizationId, privateKeyId } = data;
            setPulseWalletAddress(walletAddress);
            setStatusMsg(`Pulse Wallet: ${walletAddress.slice(0, 8)}...`);

            // Auto-link to AETERNA Pass if one exists
            if (assetPubkey && wallet) {
                await linkPulseToPass(walletAddress, subOrganizationId, privateKeyId);
            }
        } catch (e: unknown) {
            setStatusMsg(`Error: ${e instanceof Error ? e.message : String(e)}`);
        }
        setCreating(false);
    };

    // ── Link Pulse Wallet to AETERNA Pass on-chain ─────────────────────────────
    const linkPulseToPass = async (
        pulseAddr: string,
        _subOrgId: string,
        _privateKeyId: string
    ) => {
        if (!assetPubkey || !wallet || !publicKey) return;
        setStatusMsg("Linking Pulse Wallet to your AETERNA Pass...");
        try {
            const program = getProgram(connection, wallet);

            const [pulseLinkPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("pulse_link"), new PublicKey(assetPubkey).toBuffer()],
                new PublicKey(PROGRAM_ID)
            );

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (program.methods as any)
                .registerPulseWallet({ pulseWallet: new PublicKey(pulseAddr) })
                .accounts({
                    owner: publicKey,
                    asset: new PublicKey(assetPubkey),
                    pulseLink: pulseLinkPda,
                    systemProgram: new PublicKey("11111111111111111111111111111111"),
                })
                .rpc();

            setStatusMsg("✅ Pulse Wallet Linked to your Soul!");
        } catch (e: unknown) {
            setStatusMsg(`Link failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    };

    if (!publicKey) {
        return (
            <div className="w-full max-w-md mx-auto p-8 bg-slate-900/80 rounded-3xl border border-white/10 flex flex-col items-center gap-4">
                <h2 className="text-white font-bold tracking-widest uppercase">Pulse Wallet</h2>
                <p className="text-slate-400 text-sm">Connect your wallet to access your Pulse</p>
                <WalletMultiButton className="!bg-violet-600 hover:!bg-violet-500" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-white font-bold tracking-widest uppercase text-sm">Pulse Wallet</h2>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${jwtToken ? "bg-green-400 shadow-[0_0_6px_#4ade80]" : "bg-yellow-400"}`} />
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {jwtToken ? "Auth Active" : "Authenticating..."}
                    </span>
                </div>
            </div>

            {/* Balance */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-900/30 to-slate-900/40 border border-white/10">
                <span className="text-slate-400 text-xs uppercase block mb-2">Pulse Balance</span>
                <div className="text-4xl font-light text-white">
                    {balanceLoading ? "..." : `${balance.toFixed(2)}`}
                    <span className="text-sm text-slate-400 ml-2">{currency}</span>
                </div>
                {pulseWalletAddress && (
                    <div className="text-xs font-mono text-slate-600 mt-1 truncate">
                        {pulseWalletAddress}
                    </div>
                )}
            </div>

            {/* Status Message */}
            {statusMsg && (
                <div className="text-xs text-violet-300 font-mono bg-violet-900/20 border border-violet-500/20 rounded-lg p-3">
                    {statusMsg}
                </div>
            )}

            {/* Authenticate */}
            {!jwtToken && (
                <button
                    onClick={authenticate}
                    disabled={authLoading}
                    className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-widest transition-all"
                >
                    {authLoading ? "Signing..." : "🔐 Authenticate"}
                </button>
            )}

            {/* Activate Pulse */}
            {!pulseWalletAddress && jwtToken && (
                <button
                    onClick={createWallet}
                    disabled={creating}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                >
                    {creating ? "Creating..." : "⚡ ACTIVATE PULSE"}
                </button>
            )}

            {/* Auth Error */}
            {authError && (
                <p className="text-xs text-red-400 text-center">{authError}</p>
            )}

            <p className="text-[10px] text-slate-700 text-center font-mono">
                Powered by Turnkey HSM + Solana Devnet
            </p>
        </div>
    );
}
