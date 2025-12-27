-- 查看当前所有挂单
SELECT 
  listing_id,
  node_id,
  seller_wallet,
  asking_price,
  status,
  description,
  created_at
FROM node_listings
ORDER BY created_at DESC;

-- 删除所有测试挂单数据（确认后取消注释以下命令）
-- DELETE FROM node_listings WHERE listing_id LIKE 'LISTING-%';

-- 验证清理结果（应该返回 0 行，除非有真实挂单）
-- SELECT COUNT(*) as remaining_listings FROM node_listings WHERE status = 'active';
