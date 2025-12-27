-- 创建镜像节点购买统计视图
-- 这个视图专门用于统计100U镜像节点的购买记录

-- 删除旧视图（如果存在）
DROP VIEW IF EXISTS image_node_purchases_stats;

-- 创建镜像节点购买统计视图
CREATE VIEW image_node_purchases_stats AS
SELECT 
  node_id,
  wallet_address,
  purchase_price as price_usd,
  staking_amount as staking_ashva,
  staking_required_usd,
  status,
  tx_hash,
  created_at as purchase_date,
  CASE 
    WHEN status = 'active' OR status = 'running' THEN 'completed'
    WHEN status = 'pending' OR status = 'deploying' THEN 'pending'
    WHEN status = 'failed' OR status = 'cancelled' THEN 'failed'
    ELSE 'unknown'
  END as payment_status
FROM nodes
WHERE node_type = 'image'
ORDER BY created_at DESC;

-- 创建镜像节点购买汇总统计视图
CREATE VIEW image_node_purchases_summary AS
SELECT 
  COUNT(*) as total_purchases,
  COUNT(DISTINCT wallet_address) as unique_buyers,
  SUM(CAST(purchase_price AS DECIMAL)) as total_revenue_usd,
  SUM(CAST(staking_amount AS DECIMAL)) as total_staking_ashva,
  COUNT(CASE WHEN status IN ('active', 'running') THEN 1 END) as completed_count,
  COUNT(CASE WHEN status IN ('pending', 'deploying') THEN 1 END) as pending_count,
  COUNT(CASE WHEN status IN ('failed', 'cancelled') THEN 1 END) as failed_count,
  SUM(CASE WHEN status IN ('pending', 'deploying') THEN CAST(purchase_price AS DECIMAL) ELSE 0 END) as pending_revenue_usd,
  SUM(CASE WHEN status IN ('active', 'running') THEN CAST(purchase_price AS DECIMAL) ELSE 0 END) as completed_revenue_usd
FROM nodes
WHERE node_type = 'image';

-- 创建排名前10的镜像节点买家视图
CREATE VIEW image_node_top_buyers AS
SELECT 
  wallet_address,
  COUNT(*) as purchase_count,
  SUM(CAST(purchase_price AS DECIMAL)) as total_spent_usd,
  SUM(CAST(staking_amount AS DECIMAL)) as total_staked_ashva,
  MAX(created_at) as last_purchase_date
FROM nodes
WHERE node_type = 'image'
GROUP BY wallet_address
ORDER BY total_spent_usd DESC
LIMIT 10;

COMMENT ON VIEW image_node_purchases_stats IS '100U镜像节点购买记录详情视图';
COMMENT ON VIEW image_node_purchases_summary IS '100U镜像节点购买汇总统计视图';
COMMENT ON VIEW image_node_top_buyers IS '100U镜像节点购买排名前10的买家视图';
