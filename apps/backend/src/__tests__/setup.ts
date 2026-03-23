// Minimal environment setup for Zod config validation
process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/test';
process.env['REDIS_URL'] = 'redis://localhost:6379';
process.env['SOLANA_RPC_URL'] = 'https://api.devnet.solana.com';
process.env['SOLANA_KEYPAIR_PATH'] = '/dev/null';
process.env['SUPABASE_URL'] = 'https://test.supabase.co';
process.env['GROUNDTRUTH_PROGRAM_ID'] = ''; // skip Solana integration
