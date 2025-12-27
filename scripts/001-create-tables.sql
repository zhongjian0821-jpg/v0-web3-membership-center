-- 创建用户钱包表
CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    ashva_balance DECIMAL(20, 8) DEFAULT 0,
    member_level VARCHAR(50) DEFAULT 'normal', -- 'normal' 或 'global_partner'
    parent_wallet VARCHAR(42), -- 上级钱包地址
    commission_rate_level1 DECIMAL(5, 2) DEFAULT 3.00, -- 第一层佣金比例
    commission_rate_level2 DECIMAL(5, 2) DEFAULT 2.00, -- 第二层佣金比例
    total_earnings DECIMAL(20, 8) DEFAULT 0,
    team_size INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建层级关系表
CREATE TABLE IF NOT EXISTS hierarchy (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    parent_wallet VARCHAR(42),
    level INTEGER DEFAULT 1, -- 层级深度
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_address) REFERENCES wallets(wallet_address) ON DELETE CASCADE
);

-- 创建节点表
CREATE TABLE IF NOT EXISTS nodes (
    id SERIAL PRIMARY KEY,
    node_id VARCHAR(100) UNIQUE NOT NULL,
    wallet_address VARCHAR(42) NOT NULL,
    node_type VARCHAR(20) NOT NULL, -- 'cloud' 或 'image'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'maintenance'
    purchase_price DECIMAL(20, 8) NOT NULL,
    
    -- 硬件配置
    cpu_cores INTEGER,
    memory_gb INTEGER,
    storage_gb INTEGER,
    
    -- 性能数据
    uptime_percentage DECIMAL(5, 2) DEFAULT 0,
    data_transferred_gb DECIMAL(20, 2) DEFAULT 0,
    total_earnings DECIMAL(20, 8) DEFAULT 0,
    
    -- 使用率
    storage_used_percentage DECIMAL(5, 2) DEFAULT 0,
    cpu_usage_percentage DECIMAL(5, 2) DEFAULT 0,
    memory_usage_percentage DECIMAL(5, 2) DEFAULT 0,
    
    is_transferable BOOLEAN DEFAULT false, -- 是否可转让
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_address) REFERENCES wallets(wallet_address) ON DELETE CASCADE
);

-- 创建节点转让市场表
CREATE TABLE IF NOT EXISTS node_listings (
    id SERIAL PRIMARY KEY,
    listing_id VARCHAR(100) UNIQUE NOT NULL,
    node_id VARCHAR(100) NOT NULL,
    seller_wallet VARCHAR(42) NOT NULL,
    asking_price DECIMAL(20, 8) NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'sold', 'cancelled'
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sold_at TIMESTAMP,
    buyer_wallet VARCHAR(42),
    FOREIGN KEY (node_id) REFERENCES nodes(node_id) ON DELETE CASCADE,
    FOREIGN KEY (seller_wallet) REFERENCES wallets(wallet_address) ON DELETE CASCADE
);

-- 创建佣金记录表
CREATE TABLE IF NOT EXISTS commission_records (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    from_wallet VARCHAR(42) NOT NULL, -- 产生佣金的下级钱包
    amount DECIMAL(20, 8) NOT NULL,
    commission_level INTEGER NOT NULL, -- 1 或 2
    transaction_type VARCHAR(50), -- 'node_purchase', 'staking', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_address) REFERENCES wallets(wallet_address) ON DELETE CASCADE
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallets_parent ON wallets(parent_wallet);
CREATE INDEX IF NOT EXISTS idx_hierarchy_wallet ON hierarchy(wallet_address);
CREATE INDEX IF NOT EXISTS idx_hierarchy_parent ON hierarchy(parent_wallet);
CREATE INDEX IF NOT EXISTS idx_nodes_wallet ON nodes(wallet_address);
CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_listings_status ON node_listings(status);
CREATE INDEX IF NOT EXISTS idx_commission_wallet ON commission_records(wallet_address);

-- 插入 Ashva 合约地址作为根节点
INSERT INTO wallets (wallet_address, member_level, ashva_balance, parent_wallet)
VALUES ('0xea75cb12bbe6232eb082b365f450d3fe06d02fb3', 'global_partner', 999999999, NULL)
ON CONFLICT (wallet_address) DO NOTHING;
