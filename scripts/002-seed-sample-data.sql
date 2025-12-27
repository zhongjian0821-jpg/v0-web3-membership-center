-- 插入示例会员数据
INSERT INTO wallets (wallet_address, ashva_balance, member_level, parent_wallet, commission_rate_level1, commission_rate_level2, total_earnings, team_size)
VALUES 
    ('0x1234567890123456789012345678901234567890', 15000, 'global_partner', '0xea75cb12bbe6232eb082b365f450d3fe06d02fb3', 25.00, 25.00, 4567.89, 12),
    ('0x2234567890123456789012345678901234567890', 3500, 'normal', '0xea75cb12bbe6232eb082b365f450d3fe06d02fb3', 3.00, 2.00, 234.56, 5),
    ('0x3234567890123456789012345678901234567890', 8200, 'normal', '0x1234567890123456789012345678901234567890', 3.00, 2.00, 156.78, 3),
    ('0x4234567890123456789012345678901234567890', 1200, 'normal', '0x1234567890123456789012345678901234567890', 3.00, 2.00, 89.45, 0),
    ('0x5234567890123456789012345678901234567890', 25000, 'global_partner', '0xea75cb12bbe6232eb082b365f450d3fe06d02fb3', 30.00, 20.00, 8901.23, 8)
ON CONFLICT (wallet_address) DO NOTHING;

-- 插入层级关系
INSERT INTO hierarchy (wallet_address, parent_wallet, level)
VALUES 
    ('0x1234567890123456789012345678901234567890', '0xea75cb12bbe6232eb082b365f450d3fe06d02fb3', 1),
    ('0x2234567890123456789012345678901234567890', '0xea75cb12bbe6232eb082b365f450d3fe06d02fb3', 1),
    ('0x3234567890123456789012345678901234567890', '0x1234567890123456789012345678901234567890', 2),
    ('0x4234567890123456789012345678901234567890', '0x1234567890123456789012345678901234567890', 2),
    ('0x5234567890123456789012345678901234567890', '0xea75cb12bbe6232eb082b365f450d3fe06d02fb3', 1);

-- 插入示例节点数据
INSERT INTO nodes (node_id, wallet_address, node_type, status, purchase_price, cpu_cores, memory_gb, storage_gb, uptime_percentage, data_transferred_gb, total_earnings, storage_used_percentage, cpu_usage_percentage, memory_usage_percentage, is_transferable)
VALUES 
    ('NODE-CLOUD-001', '0x1234567890123456789012345678901234567890', 'cloud', 'active', 2000, 16, 64, 2000, 99.8, 1567.89, 456.78, 65.5, 42.3, 58.7, true),
    ('NODE-CLOUD-002', '0x5234567890123456789012345678901234567890', 'cloud', 'active', 2000, 16, 64, 2000, 98.5, 2345.67, 678.90, 72.3, 38.9, 61.2, true),
    ('NODE-IMAGE-001', '0x2234567890123456789012345678901234567890', 'image', 'active', 100, 8, 32, 1000, 97.2, 890.45, 123.45, 45.8, 28.5, 35.6, false),
    ('NODE-IMAGE-002', '0x3234567890123456789012345678901234567890', 'image', 'active', 100, 12, 48, 1500, 99.1, 1234.56, 234.56, 58.9, 45.2, 52.3, false);

-- 插入节点转让市场数据
INSERT INTO node_listings (listing_id, node_id, seller_wallet, asking_price, status, description)
VALUES 
    ('LISTING-001', 'NODE-CLOUD-001', '0x1234567890123456789012345678901234567890', 2500, 'active', '高性能云节点，运行稳定，收益良好'),
    ('LISTING-002', 'NODE-CLOUD-002', '0x5234567890123456789012345678901234567890', 2800, 'active', '优质节点转让，已产生678 ASHVA收益');

-- 插入佣金记录
INSERT INTO commission_records (wallet_address, from_wallet, amount, commission_level, transaction_type)
VALUES 
    ('0xea75cb12bbe6232eb082b365f450d3fe06d02fb3', '0x1234567890123456789012345678901234567890', 60.00, 1, 'node_purchase'),
    ('0x1234567890123456789012345678901234567890', '0x3234567890123456789012345678901234567890', 6.00, 1, 'node_purchase'),
    ('0xea75cb12bbe6232eb082b365f450d3fe06d02fb3', '0x3234567890123456789012345678901234567890', 4.00, 2, 'node_purchase');
