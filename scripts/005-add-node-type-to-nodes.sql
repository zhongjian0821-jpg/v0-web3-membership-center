-- 为nodes表添加服务器配置字段
ALTER TABLE nodes 
ADD COLUMN IF NOT EXISTS cpu_cores INTEGER,
ADD COLUMN IF NOT EXISTS memory_gb INTEGER,
ADD COLUMN IF NOT EXISTS storage_gb INTEGER,
ADD COLUMN IF NOT EXISTS install_command TEXT;

-- 为nodes表添加node_type字段区分云节点和镜像节点
ALTER TABLE nodes 
ADD COLUMN IF NOT EXISTS node_type VARCHAR(20) DEFAULT 'cloud';

-- 更新现有记录为云节点
UPDATE nodes SET node_type = 'cloud' WHERE node_type IS NULL;
