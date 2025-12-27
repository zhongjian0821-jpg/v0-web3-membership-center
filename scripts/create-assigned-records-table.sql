-- 创建每日收益记录表
CREATE TABLE IF NOT EXISTS assigned_records (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(255) NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  record_date DATE NOT NULL,
  daily_income_cny NUMERIC(20, 8) NOT NULL DEFAULT 0,
  daily_income_ashva NUMERIC(20, 8) NOT NULL DEFAULT 0,
  daily_flow_gb NUMERIC(10, 2) NOT NULL DEFAULT 0,
  daily_fine_cny NUMERIC(20, 8) NOT NULL DEFAULT 0,
  daily_fine_ashva NUMERIC(20, 8) NOT NULL DEFAULT 0,
  net_income_ashva NUMERIC(20, 8) NOT NULL DEFAULT 0,
  ashva_price_usd NUMERIC(20, 8),
  cny_to_usd_rate NUMERIC(10, 4),
  price_source VARCHAR(50),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 创建唯一索引，确保每个设备每天只有一条记录
  UNIQUE(device_id, record_date)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_assigned_records_wallet ON assigned_records(wallet_address);
CREATE INDEX IF NOT EXISTS idx_assigned_records_device ON assigned_records(device_id);
CREATE INDEX IF NOT EXISTS idx_assigned_records_date ON assigned_records(record_date);
CREATE INDEX IF NOT EXISTS idx_assigned_records_wallet_date ON assigned_records(wallet_address, record_date);

-- 添加注释
COMMENT ON TABLE assigned_records IS '每日收益记录表';
COMMENT ON COLUMN assigned_records.device_id IS '设备ID';
COMMENT ON COLUMN assigned_records.wallet_address IS '钱包地址';
COMMENT ON COLUMN assigned_records.record_date IS '记录日期';
COMMENT ON COLUMN assigned_records.daily_income_cny IS '每日收入（人民币）';
COMMENT ON COLUMN assigned_records.daily_income_ashva IS '每日收入（ASHVA）';
COMMENT ON COLUMN assigned_records.daily_flow_gb IS '每日流量（GB）';
COMMENT ON COLUMN assigned_records.daily_fine_cny IS '每日罚款（人民币）';
COMMENT ON COLUMN assigned_records.daily_fine_ashva IS '每日罚款（ASHVA）';
COMMENT ON COLUMN assigned_records.net_income_ashva IS '净收入（ASHVA）';
COMMENT ON COLUMN assigned_records.ashva_price_usd IS 'ASHVA价格（USD）';
COMMENT ON COLUMN assigned_records.cny_to_usd_rate IS '人民币兑美元汇率';
COMMENT ON COLUMN assigned_records.price_source IS '价格来源';
