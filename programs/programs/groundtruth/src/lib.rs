use anchor_lang::prelude::*;

declare_id!("GTemE7uVJk4ggH3X1eEFR1GNF7AgsmVfcGdVxEtSxXw7"); // Replace after `anchor deploy`

// ── GroundTruth Program ───────────────────────────────────────────────────────
// 3 instructions · 3 PDAs · EUDR compliance logic on-chain (Rust)
// Hackathon Solana LATAM 2026

#[program]
pub mod groundtruth {
    use super::*;

    // ── Instruction 1: initialize_farm ────────────────────────────────────────
    // PDA seeds: ["farm", owner.key()]
    // Creates: FarmAccount { owner, name, location, reading_count: 0, compliance_score: 0 }
    pub fn initialize_farm(
        ctx: Context<InitializeFarm>,
        name: String,
        location: String,
    ) -> Result<()> {
        require!(name.len() <= 64, GroundTruthError::NameTooLong);
        require!(location.len() <= 128, GroundTruthError::LocationTooLong);

        let farm = &mut ctx.accounts.farm_account;
        farm.owner = ctx.accounts.owner.key();
        farm.name = name;
        farm.location = location;
        farm.reading_count = 0;
        farm.compliance_score = 0;
        farm.bump = ctx.bumps.farm_account;

        msg!("Farm initialized: {}", farm.name);
        Ok(())
    }

    // ── Instruction 2: register_node ──────────────────────────────────────────
    // PDA seeds: ["node", node_id.as_bytes(), farm.key()]
    // Creates: NodeAccount { node_id, farm, is_active: true, last_seen: now }
    pub fn register_node(ctx: Context<RegisterNode>, node_id: String) -> Result<()> {
        require!(node_id.len() <= 32, GroundTruthError::NodeIdTooLong);

        let node = &mut ctx.accounts.node_account;
        node.node_id = node_id.clone();
        node.farm = ctx.accounts.farm_account.key();
        node.is_active = true;
        node.last_seen = Clock::get()?.unix_timestamp;
        node.bump = ctx.bumps.node_account;

        msg!("Node registered: {}", node_id);
        Ok(())
    }

    // ── Instruction 3: certify_reading ────────────────────────────────────────
    // PDA seeds: ["cert", node.key(), timestamp.to_le_bytes()]
    // Creates: ReadingCertificate with SHA-256 data_hash
    // Updates: FarmAccount.reading_count += 1
    // Updates: FarmAccount.compliance_score (EUDR logic in Rust — business value)
    // Updates: NodeAccount.last_seen = timestamp
    pub fn certify_reading(
        ctx: Context<CertifyReading>,
        node_id: String,
        data_hash: [u8; 32],
        temperature_x10: i32,
        humidity_x10: u32,
        pressure_x10: u32,
        timestamp: i64,
    ) -> Result<()> {
        require!(timestamp > 0, GroundTruthError::InvalidTimestamp);

        // ── Write ReadingCertificate PDA ──────────────────────────────────────
        let cert = &mut ctx.accounts.reading_cert;
        cert.node_id = node_id;
        cert.farm = ctx.accounts.farm_account.key();
        cert.data_hash = data_hash;
        cert.temperature_x10 = temperature_x10;
        cert.humidity_x10 = humidity_x10;
        cert.pressure_x10 = pressure_x10;
        cert.timestamp = timestamp;
        cert.bump = ctx.bumps.reading_cert;

        // ── Update farm reading count ─────────────────────────────────────────
        let farm = &mut ctx.accounts.farm_account;
        farm.reading_count = farm.reading_count.saturating_add(1);

        // ── EUDR compliance score — business logic in Rust on-chain ──────────
        // Ranges for tropical export crops (EU Deforestation Regulation)
        let temp_ok = temperature_x10 >= 100 && temperature_x10 <= 350; // 10°C – 35°C
        let hum_ok = humidity_x10 >= 200 && humidity_x10 <= 900; // 20% – 90%

        if temp_ok && hum_ok {
            farm.compliance_score = farm.compliance_score.saturating_add(1);
        } else {
            farm.compliance_score = farm.compliance_score.saturating_sub(2);
        }

        // ── Update node last_seen ─────────────────────────────────────────────
        let node = &mut ctx.accounts.node_account;
        node.last_seen = timestamp;

        msg!(
            "Reading certified: temp={}x10 hum={}x10 compliant={}",
            temperature_x10,
            humidity_x10,
            temp_ok && hum_ok
        );
        Ok(())
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// Account Structs
// ══════════════════════════════════════════════════════════════════════════════

#[account]
#[derive(Default)]
pub struct FarmAccount {
    pub owner: Pubkey,          // 32
    pub name: String,           // 4 + 64
    pub location: String,       // 4 + 128
    pub reading_count: u64,     // 8
    pub compliance_score: i64,  // 8  — can go negative (non-compliant readings)
    pub bump: u8,               // 1
}

impl FarmAccount {
    pub const LEN: usize = 8    // Anchor discriminator
        + 32                    // owner
        + 4 + 64                // name
        + 4 + 128               // location
        + 8                     // reading_count
        + 8                     // compliance_score
        + 1;                    // bump
}

#[account]
#[derive(Default)]
pub struct NodeAccount {
    pub node_id: String,  // 4 + 32
    pub farm: Pubkey,     // 32
    pub is_active: bool,  // 1
    pub last_seen: i64,   // 8  — Unix timestamp
    pub bump: u8,         // 1
}

impl NodeAccount {
    pub const LEN: usize = 8    // Anchor discriminator
        + 4 + 32                // node_id
        + 32                    // farm
        + 1                     // is_active
        + 8                     // last_seen
        + 1;                    // bump
}

#[account]
#[derive(Default)]
pub struct ReadingCertificate {
    pub node_id: String,        // 4 + 32
    pub farm: Pubkey,           // 32
    pub data_hash: [u8; 32],    // 32  — SHA-256 of sensor payload
    pub temperature_x10: i32,   // 4   — °C × 10 (no floats in Solana)
    pub humidity_x10: u32,      // 4   — % × 10
    pub pressure_x10: u32,      // 4   — hPa × 10
    pub timestamp: i64,         // 8   — Unix seconds
    pub bump: u8,               // 1
}

impl ReadingCertificate {
    pub const LEN: usize = 8    // Anchor discriminator
        + 4 + 32                // node_id
        + 32                    // farm
        + 32                    // data_hash
        + 4                     // temperature_x10
        + 4                     // humidity_x10
        + 4                     // pressure_x10
        + 8                     // timestamp
        + 1;                    // bump
}

// ══════════════════════════════════════════════════════════════════════════════
// Instruction Contexts
// ══════════════════════════════════════════════════════════════════════════════

#[derive(Accounts)]
#[instruction(name: String, location: String)]
pub struct InitializeFarm<'info> {
    #[account(
        init,
        payer = owner,
        space = FarmAccount::LEN,
        seeds = [b"farm", owner.key().as_ref()],
        bump
    )]
    pub farm_account: Account<'info, FarmAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(node_id: String)]
pub struct RegisterNode<'info> {
    #[account(
        init,
        payer = authority,
        space = NodeAccount::LEN,
        seeds = [b"node", node_id.as_bytes(), farm_account.key().as_ref()],
        bump
    )]
    pub node_account: Account<'info, NodeAccount>,

    #[account(
        mut,
        seeds = [b"farm", authority.key().as_ref()],
        bump = farm_account.bump,
        constraint = farm_account.owner == authority.key() @ GroundTruthError::Unauthorized
    )]
    pub farm_account: Account<'info, FarmAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(
    node_id: String,
    _data_hash: [u8; 32],
    _temperature_x10: i32,
    _humidity_x10: u32,
    _pressure_x10: u32,
    timestamp: i64
)]
pub struct CertifyReading<'info> {
    #[account(
        init,
        payer = authority,
        space = ReadingCertificate::LEN,
        seeds = [b"cert", node_account.key().as_ref(), &timestamp.to_le_bytes()],
        bump
    )]
    pub reading_cert: Account<'info, ReadingCertificate>,

    #[account(
        mut,
        seeds = [b"farm", authority.key().as_ref()],
        bump = farm_account.bump,
        constraint = farm_account.owner == authority.key() @ GroundTruthError::Unauthorized
    )]
    pub farm_account: Account<'info, FarmAccount>,

    #[account(
        mut,
        seeds = [b"node", node_id.as_bytes(), farm_account.key().as_ref()],
        bump = node_account.bump,
        constraint = node_account.farm == farm_account.key() @ GroundTruthError::Unauthorized,
        constraint = node_account.is_active @ GroundTruthError::NodeInactive
    )]
    pub node_account: Account<'info, NodeAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// ══════════════════════════════════════════════════════════════════════════════
// Custom Errors
// ══════════════════════════════════════════════════════════════════════════════

#[error_code]
pub enum GroundTruthError {
    #[msg("Node is not active")]
    NodeInactive,
    #[msg("Invalid timestamp: must be positive")]
    InvalidTimestamp,
    #[msg("Unauthorized: caller is not the farm owner")]
    Unauthorized,
    #[msg("Farm name exceeds 64 characters")]
    NameTooLong,
    #[msg("Location exceeds 128 characters")]
    LocationTooLong,
    #[msg("Node ID exceeds 32 characters")]
    NodeIdTooLong,
}
