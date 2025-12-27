-- =====================================================
-- Web3 Membership Center - Complete Database Schema
-- =====================================================
-- 数据库: PostgreSQL (Neon)
-- 创建日期: 2024
-- 用途: Web3会员管理系统完整表结构
-- =====================================================

-- 清理现有表（仅用于重新创建，生产环境请谨慎使用）
-- DROP TABLE IF EXISTS withdrawal_records CASCADE;
-- DROP TABLE IF EXISTS staking_records CASCADE;
-- DROP TABLE IF EXISTS node_listings CASCADE;
-- DROP TABLE IF EXISTS commission_records CASCADE;
-- DROP TABLE IF EXISTS commission_distribution CASCADE;
-- DROP TABLE IF EXISTS member_level_config CASCADE;
-- DROP TABLE IF EXISTS assigned_records CASCADE;
-- DROP TABLE IF EXISTS nodes CASCADE;
-- DROP TABLE IF EXISTS hierarchy CASCADE;
-- DROP TABLE IF EXISTS wallets CASCADE;

-- =====================================================
-- 表1: wallets - 钱包主表
-- =====================================================
CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    ashva_balance DECIMAL(20, 8) DEFAULT 0 NOT NULL,
    member_level VARCHAR(50) DEFAULT 'normal' NOT NULL,
    parent_wallet VARCHAR(42),
    total_earnings DECIMAL(20, 8) DEFAULT 0 NOT NULL,
    distributable_commission DECIMAL(20, 8) DEFAULT 0 NOT NULL,
    distributed_commission DECIMAL(20, 8) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_parent_wallet FOREIGN KEY (parent_wallet) 
        REFERENCES wallets(wallet_address) ON DELETE SET NULL
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallets_parent ON wallets(parent_wallet);
CREATE INDEX IF NOT EXISTS idx_wallets_level ON wallets(member_level);
CREATE INDEX IF NOT EXISTS idx_wallets_created ON wallets(created_at);

-- =====================================================
-- 表2: hierarchy - 层级关系表
-- =====================================================
CREATE TABLE IF NOT EXISTS hierarchy (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    parent_wallet VARCHAR(42),
    level INTEGER NOT NULL DEFAULT 1,
    path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hierarchy_wallet FOREIGN KEY (wallet_address) 
        REFERENCES wallets(wallet_address) ON DELETE CASCADE,
    CONSTRAINT fk_hierarchy_parent FOREIGN KEY (parent_wallet) 
        REFERENCES wallets(wallet_address) ON DELETE CASCADE
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_hierarchy_wallet ON hierarchy(wallet_address);
CREATE INDEX IF NOT EXISTS idx_hierarchy_parent ON hierarchy(parent_wallet);
CREATE INDEX IF NOT EXISTS idx_hierarchy_level ON hierarchy(level);

-- =====================================================
-- 表3: nodes - 节点表
-- =====================================================
CREATE TABLE IF NOT EXISTS nodes (
    node_id VARCHAR(100) PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    node_type VARCHAR(20) NOT NULL CHECK (node_type IN ('cloud', 'image')),
    status VARCHAR(20) DEFAULT 'pending' NOT NULL 
        CHECK (status IN ('pending', 'active', 'inactive', 'deploying')),
    purchase_price DECIMAL(20, 8) NOT NULL,
    staking_amount DECIMAL(20, 8) DEFAULT 0,
    total_earnings DECIMAL(20, 8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_nodes_wallet FOREIGN KEY (wallet_address) 
        REFERENCES wallets(wallet_address) ON DELETE CASCADE
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_nodes_wallet ON nodes(wallet_address);
CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_nodes_status ON nodes(status);
CREATE INDEX IF NOT EXISTS idx_nodes_created ON nodes(created_at);

-- =====================================================
-- 表4: assigned_records - 设备分配记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS assigned_records (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    node_id VARCHAR(100),
    device_id VARCHAR(100) NOT NULL,
    daily_income_ashva DECIMAL(20, 8) DEFAULT 0,
    daily_fine_ashva DECIMAL(20, 8) DEFAULT 0,
    net_income_ashva DECIMAL(20, 8) DEFAULT 0,
    daily_flow_gb DECIMAL(10, 2) DEFAULT 0,
    record_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assigned_wallet FOREIGN KEY (wallet_address) 
        REFERENCES wallets(wallet_address) ON DELETE CASCADE,
    CONSTRAINT fk_assigned_node FOREIGN KEY (node_id) 
        REFERENCES nodes(node_id) ON DELETE SET NULL
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_assigned_wallet ON assigned_records(wallet_address);
CREATE INDEX IF NOT EXISTS idx_assigned_node ON assigned_records(node_id);
CREATE INDEX IF NOT EXISTS idx_assigned_date ON assigned_records(record_date DESC);
CREATE INDEX IF NOT EXISTS idx_assigned_device ON assigned_records(device_id);

-- =====================================================
-- 表5: member_level_config - 会员等级配置表
-- =====================================================
CREATE TABLE IF NOT EXISTS member_level_config (
    id SERIAL PRIMARY KEY,
    level_name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    max_depth INTEGER NOT NULL,
    commission_total_percentage DECIMAL(5, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认配置
INSERT INTO member_level_config (level_name, display_name, max_depth, commission_total_percentage, description)
VALUES 
    ('normal', '普通会员', 0, 0, '普通用户，无佣金'),
    ('node_partner', '节点合伙人', 1, 10, '1级佣金10%'),
    ('regional_partner', '区域合伙人', 2, 20, '2级佣金：一级10%+二级10%'),
    ('global_partner', '全球合伙人', 5, 50, '5级佣金：每级10%')
ON CONFLICT (level_name) DO NOTHING;

-- =====================================================
-- 表6: commission_distribution - 佣金分配配置表
-- =====================================================
CREATE TABLE IF NOT EXISTS commission_distribution (
    id SERIAL PRIMARY KEY,
    from_wallet VARCHAR(42) NOT NULL,
    to_wallet VARCHAR(42) NOT NULL,
    level INTEGER NOT NULL,
    percentage DECIMAL(5, 2) NOT NULL,
    rate DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_commission_from FOREIGN KEY (from_wallet) 
        REFERENCES wallets(wallet_address) ON DELETE CASCADE,
    CONSTRAINT fk_commission_to FOREIGN KEY (to_wallet) 
        REFERENCES wallets(wallet_address) ON DELETE CASCADE,
    CONSTRAINT unique_commission_config UNIQUE (from_wallet, to_wallet, level)
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_commission_from ON commission_distribution(from_wallet);
CREATE INDEX IF NOT EXISTS idx_commission_to ON commission_distribution(to_wallet);
CREATE INDEX IF NOT EXISTS idx_commission_level ON commission_distribution(level);

-- =====================================================
-- 表7: commission_records - 佣金记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS commission_records (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    from_wallet VARCHAR(42),
    amount DECIMAL(20, 8) NOT NULL,
    commission_level INTEGER,
    transaction_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_commission_wallet FOREIGN KEY (wallet_address) 
        REFERENCES wallets(wallet_address) ON DELETE CASCADE,
    CONSTRAINT fk_commission_from_wallet FOREIGN KEY (from_wallet) 
        REFERENCES wallets(wallet_address) ON DELETE SET NULL
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_commission_wallet ON commission_records(wallet_address);
CREATE INDEX IF NOT EXISTS idx_commission_from_wallet ON commission_records(from_wallet);
CREATE INDEX IF NOT EXISTS idx_commission_created ON commission_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commission_type ON commission_records(transaction_type);

-- =====================================================
-- 表8: node_listings - 节点转让挂单表
-- =====================================================
CREATE TABLE IF NOT EXISTS node_listings (
    listing_id SERIAL PRIMARY KEY,
    node_id VARCHAR(100) NOT NULL,
    seller_wallet VARCHAR(42) NOT NULL,
    buyer_wallet VARCHAR(42),
    asking_price DECIMAL(20, 8) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' NOT NULL 
        CHECK (status IN ('active', 'sold', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sold_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_listing_node FOREIGN KEY (node_id) 
        REFERENCES nodes(node_id) ON DELETE CASCADE,
    CONSTRAINT fk_listing_seller FOREIGN KEY (seller_wallet) 
        REFERENCES wallets(wallet_address) ON DELETE CASCADE,
    CONSTRAINT fk_listing_buyer FOREIGN KEY (buyer_wallet) 
        REFERENCES wallets(wallet_address) ON DELETE SET NULL
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_listing_node ON node_listings(node_id);
CREATE INDEX IF NOT EXISTS idx_listing_seller ON node_listings(seller_wallet);
CREATE INDEX IF NOT EXISTS idx_listing_status ON node_listings(status);
CREATE INDEX IF NOT EXISTS idx_listing_created ON node_listings(created_at DESC);

-- =====================================================
-- 表9: withdrawal_records - 提现记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS withdrawal_records (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    amount_usd DECIMAL(20, 2),
    fee DECIMAL(20, 8) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    tx_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_withdrawal_wallet FOREIGN KEY (wallet_address) 
        REFERENCES wallets(wallet_address) ON DELETE CASCADE
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_withdrawal_wallet ON withdrawal_records(wallet_address);
CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON withdrawal_records(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_created ON withdrawal_records(created_at DESC);

-- =====================================================
-- 表10: staking_records - 质押记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS staking_records (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    node_id VARCHAR(100),
    staked_amount DECIMAL(20, 8) NOT NULL,
    staked_amount_usd DECIMAL(20, 2),
    lock_period_days INTEGER NOT NULL,
    unlock_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'locked' NOT NULL 
        CHECK (status IN ('locked', 'unlocked', 'withdrawn')),
    rewards_earned DECIMAL(20, 8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_staking_wallet FOREIGN KEY (wallet_address) 
        REFERENCES wallets(wallet_address) ON DELETE CASCADE,
    CONSTRAINT fk_staking_node FOREIGN KEY (node_id) 
        REFERENCES nodes(node_id) ON DELETE SET NULL
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_staking_wallet ON staking_records(wallet_address);
CREATE INDEX IF NOT EXISTS idx_staking_node ON staking_records(node_id);
CREATE INDEX IF NOT EXISTS idx_staking_status ON staking_records(status);
CREATE INDEX IF NOT EXISTS idx_staking_unlock ON staking_records(unlock_date);

-- =====================================================
-- 触发器：自动更新 updated_at 字段
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加触发器
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commission_distribution_updated_at BEFORE UPDATE ON commission_distribution
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 视图：用户完整信息视图
-- =====================================================
CREATE OR REPLACE VIEW v_user_complete_info AS
SELECT 
    w.wallet_address,
    w.ashva_balance,
    w.member_level,
    w.parent_wallet,
    w.total_earnings,
    w.distributable_commission,
    w.distributed_commission,
    w.created_at,
    mlc.display_name AS level_display_name,
    mlc.max_depth AS commission_depth,
    mlc.commission_total_percentage,
    COUNT(DISTINCT n.node_id) AS total_nodes,
    COUNT(DISTINCT CASE WHEN n.status = 'active' THEN n.node_id END) AS active_nodes,
    COALESCE(SUM(n.total_earnings), 0) AS node_total_earnings
FROM wallets w
LEFT JOIN member_level_config mlc ON w.member_level = mlc.level_name
LEFT JOIN nodes n ON w.wallet_address = n.wallet_address
GROUP BY w.wallet_address, w.ashva_balance, w.member_level, w.parent_wallet, 
         w.total_earnings, w.distributable_commission, w.distributed_commission, 
         w.created_at, mlc.display_name, mlc.max_depth, mlc.commission_total_percentage;

-- =====================================================
-- 数据库函数：计算用户等级
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_member_level(
    p_wallet_address VARCHAR(42),
    p_ashva_balance DECIMAL
)
RETURNS VARCHAR AS $$
DECLARE
    v_node_count INTEGER;
    v_level VARCHAR(50);
BEGIN
    -- 统计节点数量
    SELECT COUNT(*) INTO v_node_count
    FROM nodes
    WHERE wallet_address = p_wallet_address AND status = 'active';
    
    -- 根据余额和节点数量判断等级
    IF p_ashva_balance >= 500000 AND v_node_count >= 10 THEN
        v_level := 'global_partner';
    ELSIF p_ashva_balance >= 100000 AND v_node_count >= 5 THEN
        v_level := 'regional_partner';
    ELSIF p_ashva_balance >= 20000 AND v_node_count >= 1 THEN
        v_level := 'node_partner';
    ELSE
        v_level := 'normal';
    END IF;
    
    RETURN v_level;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 授权和权限设置
-- =====================================================
-- 确保数据库所有者有完整权限
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO neondb_owner;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO neondb_owner;

-- =====================================================
-- 数据完整性检查
-- =====================================================
-- 添加约束确保余额不为负
ALTER TABLE wallets ADD CONSTRAINT check_positive_balance 
    CHECK (ashva_balance >= 0);

ALTER TABLE wallets ADD CONSTRAINT check_positive_earnings 
    CHECK (total_earnings >= 0);

-- =====================================================
-- 性能优化建议
-- =====================================================
-- 1. 定期分析表统计信息
-- ANALYZE wallets;
-- ANALYZE nodes;
-- ANALYZE assigned_records;

-- 2. 定期清理旧记录（根据业务需求）
-- DELETE FROM assigned_records WHERE record_date < CURRENT_DATE - INTERVAL '90 days';

-- 3. 创建物化视图用于复杂统计（可选）
-- CREATE MATERIALIZED VIEW mv_daily_stats AS
-- SELECT ...;

-- =====================================================
-- 初始化完成
-- =====================================================
-- Schema创建完成！
-- 表总数: 10张
-- 索引总数: 30+个
-- 视图: 1个
-- 函数: 2个
