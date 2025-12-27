-- 清除测试节点数据
-- 此脚本会删除所有节点记录，仅在开发/测试环境使用

-- 查看当前所有节点（执行删除前先查看）
SELECT node_id, wallet_address, node_type, created_at, tx_hash 
FROM nodes 
ORDER BY created_at DESC;

-- 如果确认要删除，取消下面命令的注释并执行
-- DELETE FROM nodes WHERE wallet_address = '0x8fc07A7F4886BA53acd58d77666A88e1392C716D';

-- 或者删除所有测试节点（请谨慎使用）
-- DELETE FROM nodes;

-- 验证删除结果
-- SELECT COUNT(*) as remaining_nodes FROM nodes;
