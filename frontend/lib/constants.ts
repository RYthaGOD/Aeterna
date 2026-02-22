// ── API ───────────────────────────────────────────────────────────────────────
export const PULSE_API_URL = process.env.NEXT_PUBLIC_PULSE_API_URL || "http://localhost:3001";

// ── On-chain Program IDs ──────────────────────────────────────────────────────
// Update PROGRAM_ID after `anchor deploy --provider.cluster devnet`
export const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID || "E3aVLq7oT4BFPjHRXaZmYupDJ9EZTG8At8oafLKzPMBG";
export const MPL_CORE_PROGRAM_ID = "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d";

// ── Backend Authority ─────────────────────────────────────────────────────────
export const BACKEND_AUTHORITY_PK = "AjdHrwHUVTu57Br3AZpEstDFdqE6Knh2LG6EtfTaAwnJ";

// ── Devnet Addresses ──────────────────────────────────────────────────────────
export const DEVNET_USDC_MINT = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";

// ── XP Thresholds (must match soul_stats.rs) ─────────────────────────────────
export const XP_THRESHOLD_ACTIVE = 100;    // Stage 0 → Stage 1 (Dormant → Active)
export const XP_THRESHOLD_ASCENDED = 1000; // Stage 1 → Stage 2 (Active → Ascended)
