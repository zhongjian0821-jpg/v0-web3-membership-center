-- Add burn-related columns to withdrawal_records table

-- Add burn_rate column (percentage as decimal, e.g., 0.10 for 10%)
ALTER TABLE withdrawal_records 
ADD COLUMN IF NOT EXISTS burn_rate DECIMAL(5, 4) DEFAULT 0;

-- Add burn_amount column (amount of ASHVA burned)
ALTER TABLE withdrawal_records 
ADD COLUMN IF NOT EXISTS burn_amount DECIMAL(20, 8) DEFAULT 0;

-- Add actual_amount column (amount actually received after burn)
ALTER TABLE withdrawal_records 
ADD COLUMN IF NOT EXISTS actual_amount DECIMAL(20, 8) DEFAULT 0;

-- Add comment to explain the columns
COMMENT ON COLUMN withdrawal_records.burn_rate IS 'Burn rate applied to this withdrawal (0.10 = 10%, 0.03 = 3%)';
COMMENT ON COLUMN withdrawal_records.burn_amount IS 'Amount of ASHVA burned during this withdrawal';
COMMENT ON COLUMN withdrawal_records.actual_amount IS 'Actual amount received by user after burn';
