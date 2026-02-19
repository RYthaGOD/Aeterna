# AETERNA Evaluation: Experience & History

**Date**: 2026-02-14
**Status**: Research Complete.

## 1. The Core Architecture

The system has evolved into a "Soulbound Game":

- **AETERNA (Anchor)**: Manages Quest logic and Asset Evolution.
- **WORLD (Bolt ECS)**: Tracks `SoulStats` (Level, XP, Wealth) and `Position`.
- **PULSE (Service)**: Handles the "Action".

## 2. The Gap (Critique)

The pieces are disconnected.

- **Pulse is Isolated**: Spending USDC with Pulse currently just moves money. It does **NOT** update `SoulStats.trading_volume` or `SoulStats.xp`.
- **Evolution is Manual**: `evolve_soul` likely checks attributes, but should check `SoulStats`.
- **History is Hidden**: The `SoulStats` component is the "History" but it is not visualized in the frontend.

## 3. The "Experience" Loop (Proposed)

1. **User Actions**: Tap Pulse at Bar -> Spend USDC.
2. **Pulse Service**:
    - Signs the USDC Transfer.
    - **NEW**: Calls `world.update_stats(trade_volume += amount)` via CPI or instruction.
3. **Frontend**:
    - Polls `SoulStats`.
    - Example: "You spent $50. Your 'Wealth Tier' increased to Gold."
4. **Evolution**:
    - User clicks "Evolve".
    - Smart Contract: Checks `SoulStats.wealth_tier >= Gold`.
    - Result: Stone turns to Gold.

## 4. Improvment Plan

1. **Pulse + World**: Modify `wallet_manager.ts` and `aeterna` program to link Spending to Stats.
2. **Frontend + World**: Add `SoulStats` visualization to the Dashboard.
