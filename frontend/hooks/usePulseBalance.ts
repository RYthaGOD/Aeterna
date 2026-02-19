import { useState, useEffect } from "react";
import { PULSE_API_URL } from "@/lib/constants";

interface PulseBalanceData {
    balance: number;
    currency: string;
    loading: boolean;
    error: string | null;
}

/**
 * Fetches the USDC balance of a Pulse wallet from the Pulse Service.
 * Requires a valid JWT token for authentication.
 */
export function usePulseBalance(
    pulseWalletAddress: string | null,
    jwtToken: string | null
): PulseBalanceData {
    const [data, setData] = useState<PulseBalanceData>({
        balance: 0,
        currency: "USDC",
        loading: false,
        error: null,
    });

    useEffect(() => {
        if (!pulseWalletAddress || !jwtToken) return;
        setData(d => ({ ...d, loading: true }));

        const fetchBalance = async () => {
            try {
                const res = await fetch(`${PULSE_API_URL}/pulse/balance/${pulseWalletAddress}`, {
                    headers: { Authorization: `Bearer ${jwtToken}` },
                });
                if (!res.ok) throw new Error(`Status ${res.status}`);
                const json = await res.json();
                setData({ balance: json.balance ?? 0, currency: json.currency ?? "USDC", loading: false, error: null });
            } catch (e: any) {
                setData(d => ({ ...d, loading: false, error: e.message }));
            }
        };

        fetchBalance();
        const interval = setInterval(fetchBalance, 30_000); // Poll every 30s
        return () => clearInterval(interval);
    }, [pulseWalletAddress, jwtToken]);

    return data;
}
