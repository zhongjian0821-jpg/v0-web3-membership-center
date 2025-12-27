-- 为 nodes 表添加 device_id 字段（用于用户查看的设备ID）
-- node_id 保留用于机器号

ALTER TABLE nodes 
ADD COLUMN IF NOT EXISTS device_id VARCHAR(255);

-- 为现有记录生成设备ID（示例）
UPDATE nodes 
SET device_id = 'cb3c20f05cd89728af144736534018d'
WHERE id = 21;

-- 添加索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_nodes_device_id ON nodes(device_id);

COMMENT ON COLUMN nodes.device_id IS '用户可见的设备ID';
COMMENT ON COLUMN nodes.node_id IS '机器编号（运维使用）';
