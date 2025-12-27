-- Add tx_hash column to nodes table to store blockchain transaction hashes
ALTER TABLE nodes 
ADD COLUMN IF NOT EXISTS tx_hash VARCHAR(66);

-- Add index for quick lookup
CREATE INDEX IF NOT EXISTS idx_nodes_tx_hash ON nodes(tx_hash);

-- Add comment
COMMENT ON COLUMN nodes.tx_hash IS 'Blockchain transaction hash for node purchase';
