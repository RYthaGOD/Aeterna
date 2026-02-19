# AETERNA: Lead Developer Guide

## 1. System Architecture

AETERNA is a hybrid Web3 ticketing platform combining **Metaplex Core** assets with **Turnkey** non-custodial wallets (Pulse Wallets) to create an "invisible" crypto experience.

### High-Level Data Flow

```mermaid
graph TD
    User[User] -->|Buys Ticket| Web[AETERNA Web App]
    Web -->|Calls| Anchor[AETERNA Anchor Program]
    Anchor -->|CPI: Create Asset| Core[Metaplex Core Program]
    
    User -->|Scans QR| Pulse[Pulse Wallet (Turnkey)]
    Pulse -->|Signs Tx| Solana[Solana Blockchain]
    
    Validator[KYDLabs Scanner] -->|API Webhook| Backend[Node.js Backend]
    Backend -->|Triggers| Anchor
    Anchor -->|CPI: Update Asset| Core
```

## 2. Smart Contract (Solana/Anchor)

### Location: `d:\AETERNA\aeterna`

- **Framework**: Anchor 0.29.0
- **Standard**: Metaplex Core (MPL-Core) 0.7.0

### Key Instructions

1. **`initialize_pass`**: Mints the initial "Dormant" stone slab asset.
    - *Input*: `uri` (Initial Metadata).
    - *Authorities*:
        - `signer`: The User (Owner).
        - `authority`: The Backend (Update Authority).
    - *Output*: A new MPL-Core Asset with `status: Dormant`.
2. **`resurrect_pass`**: The "Evolution" event.
    - *Input*: `new_uri`, `new_stage`, `current_xp`.
    - *Security*: Must be called by the `authority` (Backend). The `payer` (User or Backend) pays for the tx.
    - *Logic*: Updates the Asset's URI and Attributes to reflect the festival state (e.g., Active, VIP). **Note**: Argument `current_xp` is required to preserve XP during the attribute overwrite.
3. **`register_pulse_wallet`**: Links a temporary session wallet.
    - *Input*: `pulse_wallet` (Pubkey).
    - *Logic*: Creates or Updates a **PDA** (`PulseLink`) deriving from `[b"pulse", asset_key]`.
    - *Why PDA?*: Enables secure, cheap verification of the wallet link without spamming the NFT metadata or risking overwrite of attributes. Supports rotation (idempotent).

### Data Model

#### Metaplex Core Attributes

| Key | Value Sample | Description |
| :--- | :--- | :--- |
| `status` | "Dormant", "Active" | Current lifecycle state |
| `stage` | "0", "1", "VIP" | Access level or event phase |
| `xp` | "150" | Gamification score |

#### PulseLink PDA

- **Seeds**: `["pulse", asset.key()]`
- **Data**: `{ asset: Pubkey, pulse_wallet: Pubkey, bump: u8 }`

## 3. Pulse Wallet Infrastructure (Phase 2 Preview)

- **Provider**: Turnkey (<https://turnkey.com>)
- **Architecture**:
  - **Sub-Organization**: Each user gets a sub-org.
  - **Signer**: Initialized via Passkey (FaceID/TouchID) or Email auth.
  - **Scope**: "Session Keys" scoped to USCMD/Bonk spending and AETERNA interactions only.

## 4. Environment Setup

### Prerequisites

- **Rust**: `1.75.0` or later
- **Solana CLI**: `1.18.0` or later
- **Anchor CLI**: `0.29.0`
- **Node.js**: `v20+`

### Build & Test

```bash
# Navigate to program root
cd d:\AETERNA\aeterna

# Build contracts
anchor build

# Run tests (Requires local validator)
anchor test
```
