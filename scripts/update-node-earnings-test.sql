-- 为测试目的更新节点收益
-- 这会给所有现有节点添加模拟收益数据

-- 更新云节点托管（hosting）的收益为 150 ASHVA
UPDATE nodes
SET 
  total_earnings = 150.00000000,
  uptime_percentage = 99.90,
  cpu_usage_percentage = 45.00,
  memory_usage_percentage = 60.00,
  storage_used_percentage = 35.00,
  data_transferred_gb = 125.50,
  updated_at = CURRENT_TIMESTAMP
WHERE node_type IN ('hosting', 'cloud')
AND status IN ('active', 'deploying', 'maintenance');

-- 更新镜像节点（image）的收益为 8 ASHVA
UPDATE nodes
SET 
  total_earnings = 8.00000000,
  uptime_percentage = 99.50,
  cpu_usage_percentage = 30.00,
  memory_usage_percentage = 45.00,
  storage_used_percentage = 25.00,
  data_transferred_gb = 50.25,
  updated_at = CURRENT_TIMESTAMP
WHERE node_type = 'image'
AND status IN ('active', 'deploying', 'maintenance');

-- 查看更新后的结果
SELECT 
  id,
  node_id,
  node_type,
  wallet_address,
  total_earnings,
  uptime_percentage,
  data_transferred_gb,
  status,
  updated_at
FROM nodes
ORDER BY created_at DESC;
