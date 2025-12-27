-- 会员等级佣金配置系统
-- 普通会员：直推3%，间推2%
-- 市场合伙人：10%收益权，可管理10层
-- 全球合伙人：5%收益权，可管理100层

-- 更新会员等级配置表
DELETE FROM member_level_config;

INSERT INTO member_level_config (level_name, display_name, max_depth, commission_total_percentage, description) VALUES
('normal', '普通会员', 2, 5, '直推3%，间推2%'),
('market_partner', '市场合伙人', 10, 10, '可管理10层，总收益权10%'),
('global_partner', '全球合伙人', 100, 5, '可管理100层，总收益权5%');

-- 创建提现记录表
CREATE TABLE IF NOT EXISTS withdrawal_records (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(255) NOT NULL,
  amount NUMERIC(30, 18) NOT NULL,
  amount_usd NUMERIC(20, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  tx_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  notes TEXT
);

-- 创建佣金分配设置表（市场合伙人和全球合伙人可以分配给下级）
CREATE TABLE IF NOT EXISTS commission_distribution (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(255) NOT NULL,
  level INTEGER NOT NULL, -- 1-10 for market_partner, 1-100 for global_partner
  percentage NUMERIC(5, 2) NOT NULL, -- 分配给该层级的百分比
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(wallet_address, level)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_withdrawal_wallet ON withdrawal_records(wallet_address);
CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON withdrawal_records(status);
CREATE INDEX IF NOT EXISTS idx_commission_dist_wallet ON commission_distribution(wallet_address);
