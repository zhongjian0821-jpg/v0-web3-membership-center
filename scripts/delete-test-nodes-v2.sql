-- 删除测试节点数据
-- 此脚本将删除所有节点记录，确保只有真实购买后的节点才会显示

-- 查看当前所有节点（执行此查询查看将要删除的数据）
SELECT 
    node_id,
    node_type,
    wallet_address,
    LEFT(wallet_address, 10) || '...' as wallet_short,
    cpu_cores,
    memory_gb,
    storage_gb,
    status,
    created_at
FROM nodes
ORDER BY created_at DESC;

-- 删除所有节点（取消下面的注释来执行删除）
-- DELETE FROM nodes;

-- 验证删除结果（执行删除后运行此查询）
-- SELECT COUNT(*) as remaining_nodes FROM nodes;
