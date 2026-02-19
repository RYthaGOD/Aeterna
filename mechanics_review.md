# AETERNA Mechanics & State Machine

## 1. The Asset Lifecycle (Evolution)

The AETERNA Pass is a **Metaplex Core Asset** that evolves through three distinct stages. This state is stored in the `attributes` plugin of the asset.

### State 0: DORMANT (The Stone)

- **Trigger**: User Mints via Frontend.
- **Attributes**:
  - `status`: "Dormant"
  - `stage`: "0"
  - `xp`: "0"
- **Visual**: A rough, gray stone slab.
- **Capabilities**: Can hold a Pulse Wallet link, but cannot earn XP.

### State 1: ACTIVE (The Crack)

- **Trigger**: "Resurrection" (Festival Entry Scan).
- **Attributes**:
  - `status`: "Active"
  - `stage`: "1"
  - `xp`: (Preserved from previous, usually 0)
- **Visual**: The stone cracks, revealing emerald light from within.
- **Capabilities**: starts accumulating `xp` from spending.

### State 2: ASCENDED (The Gold)

- **Trigger**: `xp` > 1000.
- **Attributes**:
  - `status`: "Ascended"
  - `stage`: "2"
  - `xp`: > 1000
- **Visual**: The stone shell falls away, revealing a pure gold/emerald core.
- **Capabilities**: VIP Access, Airdrops.

## 2. Pulse Wallet Mechanics

The Pulse Wallet is a **Session Key** managed by the user's "Real" wallet but secured by the Backend TEE (Turnkey).

1. **Creation**:
    - User signs a message on Frontend verifying ownership of `Asset #123`.
    - Backend creates a Sub-Organization for `Asset #123`.
    - Backend generates a `Pulse Key` inside that Sub-Org.

2. **Linking**:
    - Frontend calls Anchor: `register_pulse_wallet(pulseKey, assetId)`.
    - Program checks: `Signer == AssetOwner`.
    - Program saves `PulseLink` PDA `{ asset: assetId, pulse: pulseKey }`.

3. **Spending (The "Tap")**:
    - User taps phone on a reader (Bar).
    - Reader sends `unsignedTx` (USDC Transfer) to Backend.
    - Backend verifies:
        - Is `Pulse Key` linked to a valid Asset?
        - Is `Tx` interacting with a Whitelisted Program (USDC/Bar)?
    - Backend signs via Turnkey.
    - Tx broadcasted.

## 3. Security Model (Anti-Drain)

To prevent a compromised frontend from draining user funds:

- **Whitelisting**: The Backend REJECTS any transaction that interacts with unknown programs.
- **Scope**: Pulse Wallets are "Hot Wallets" meant for small balances ($50-100). They should NOT hold value tickets or high-value assets.
