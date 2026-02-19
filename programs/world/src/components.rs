use anchor_lang::prelude::*;
use bolt_lang::*;

#[component]
#[derive(Default)]
pub struct SoulStats {
    pub level: u8,
    pub xp: u64,
    pub stamina: u8,
    pub quests_completed: u32,
    pub trading_volume: u64, // Track DeFi volume
    pub wealth_tier: u8,     // 0=Common, 1=Gold, 2=Diamond
}

#[component]
#[derive(Default)]
pub struct SoulTraits {
    pub energy: u8,          // 0-100: Fuel for actions
    pub happiness: u8,       // 0-100: Affects evolution speed
    pub last_interaction: i64, // Unix timestamp for decay/regeneration logic
    pub is_sleeping: bool,   // State flag
}

#[component]
#[derive(Default)]
pub struct Position {
    pub x: i64,
    pub y: i64,
    pub z: i64,
}
