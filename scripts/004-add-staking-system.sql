-- Add staking system tables

-- Staking records table
CREATE TABLE IF NOT EXISTS staking_records (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(255) NOT NULL,
  node_id VARCHAR(255) NOT NULL,
  staked_amount DECIMAL(20, 8) NOT NULL,
  staked_amount_usd DECIMAL(10, 2) NOT NULL,
  stake_tx_hash VARCHAR(255) NOT NULL UNIQUE,
  unstake_tx_hash VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  lock_period_days INTEGER NOT NULL DEFAULT 180,
  unlock_date TIMESTAMP,
  rewards_earned DECIMAL(20, 8) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  unstaked_at TIMESTAMP,
  FOREIGN KEY (wallet_address) REFERENCES wallets(wallet_address),
  FOREIGN KEY (node_id) REFERENCES nodes(node_id)
);

-- Add staking fields to nodes table
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS staking_required_usd DECIMAL(10, 2) DEFAULT 100;
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS staking_amount DECIMAL(20, 8) DEFAULT 0;
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS staking_status VARCHAR(50) DEFAULT 'pending';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_staking_wallet ON staking_records(wallet_address);
CREATE INDEX IF NOT EXISTS idx_staking_node ON staking_records(node_id);
CREATE INDEX IF NOT EXISTS idx_staking_status ON staking_records(status);
