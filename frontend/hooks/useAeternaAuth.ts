import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PULSE_API_URL } from "@/lib/constants";
import bs58 from "bs58";

const SESSION_KEY = "aeterna_jwt";

/** Extract exp from a base64url JWT payload without a library */
function getJwtExpiry(token: string): number | null {
    try {
        const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
        return payload.exp ?? null;
    } catch {
        return null;
    }
}

function isTokenValid(token: string): boolean {
    const exp = getJwtExpiry(token);
    if (!exp) return false;
    return exp > Math.floor(Date.now() / 1000);
}

interface AuthState {
    jwtToken: string | null;
    loading: boolean;
    error: string | null;
}

/**
 * Provides wallet-signature-based authentication with the AETERNA Pulse Service.
 * Flow: challenge → wallet signs → verify → receive JWT
 * JWT is persisted in sessionStorage so it survives page refreshes within the same tab.
 */
export function useAeternaAuth(): AuthState & { authenticate: () => Promise<void> } {
    const { publicKey, signMessage, connected } = useWallet();

    // Restore JWT from sessionStorage on mount (G2 fix)
    const [state, setState] = useState<AuthState>(() => {
        if (typeof window === "undefined") return { jwtToken: null, loading: false, error: null };
        const stored = sessionStorage.getItem(SESSION_KEY);
        if (stored && isTokenValid(stored)) {
            return { jwtToken: stored, loading: false, error: null };
        }
        return { jwtToken: null, loading: false, error: null };
    });

    // Clear token when wallet disconnects
    useEffect(() => {
        if (!connected) {
            sessionStorage.removeItem(SESSION_KEY);
            setState({ jwtToken: null, loading: false, error: null });
        }
    }, [connected]);

    const authenticate = useCallback(async () => {
        if (!publicKey || !signMessage) return;

        // Don't re-auth if we already have a valid token
        const stored = sessionStorage.getItem(SESSION_KEY);
        if (stored && isTokenValid(stored)) {
            setState(s => ({ ...s, jwtToken: stored }));
            return;
        }

        setState({ jwtToken: null, loading: true, error: null });

        try {
            // Step 1: Get nonce challenge
            const challengeRes = await fetch(`${PULSE_API_URL}/auth/challenge`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ walletAddress: publicKey.toBase58() }),
            });
            const { message } = await challengeRes.json();

            // Step 2: Sign the challenge message with connected wallet
            const encodedMessage = new TextEncoder().encode(message);
            const signatureBytes = await signMessage(encodedMessage);
            const signatureBase58 = bs58.encode(signatureBytes);

            // Step 3: Verify and get JWT
            const verifyRes = await fetch(`${PULSE_API_URL}/auth/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    walletAddress: publicKey.toBase58(),
                    signature: signatureBase58,
                }),
            });

            if (!verifyRes.ok) {
                const err = await verifyRes.json();
                throw new Error(err.error ?? "Auth failed");
            }

            const { token } = await verifyRes.json();

            // Persist to sessionStorage so refresh doesn't require re-signing (G2 fix)
            sessionStorage.setItem(SESSION_KEY, token);
            setState({ jwtToken: token, loading: false, error: null });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Authentication failed";
            setState({ jwtToken: null, loading: false, error: msg });
        }
    }, [publicKey, signMessage]);

    return { ...state, authenticate };
}
