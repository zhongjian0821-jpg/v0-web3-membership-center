# 数据库使用说明

## 数据库概述

本项目使用 **Neon PostgreSQL** 作为数据库，共10张表，支持完整的Web3会员管理系统功能。

## 快速导入

### 方法1：使用psql命令行

```bash
# 确保已安装PostgreSQL客户端
psql $DATABASE_URL -f schema.sql
```

### 方法2：使用Neon CLI

```bash
# 安装Neon CLI
npm install -g neonctl

# 登录
neonctl auth

# 导入Schema
neonctl sql-file schema.sql --project-id your-project-id
```

### 方法3：通过Neon控制台

1. 登录 https://console.neon.tech
2. 选择你的项目
3. 进入 SQL Editor
4. 复制 `schema.sql` 的内容并执行

## 数据库表结构

| 表名 | 用途 | 关键字段 |
|------|------|---------|
| wallets | 钱包主表 | wallet_address, ashva_balance, member_level |
| hierarchy | 层级关系 | wallet_address, parent_wallet, level |
| nodes | 节点信息 | node_id, wallet_address, node_type, status |
| assigned_records | 设备收益记录 | wallet_address, device_id, daily_income |
| member_level_config | 会员等级配置 | level_name, max_depth, commission_percentage |
| commission_distribution | 佣金分配配置 | from_wallet, to_wallet, percentage |
| commission_records | 佣金记录 | wallet_address, amount, commission_level |
| node_listings | 节点转让市场 | node_id, seller_wallet, asking_price |
| withdrawal_records | 提现记录 | wallet_address, amount, status |
| staking_records | 质押记录 | wallet_address, staked_amount, unlock_date |

## 数据库迁移

如果需要修改表结构，使用 `migrations/` 目录下的迁移脚本：

```bash
# 按顺序执行迁移
psql $DATABASE_URL -f migrations/001_create_wallets.sql
psql $DATABASE_URL -f migrations/002_create_nodes.sql
# ...
```

## 备份和恢复

### 备份

```bash
# 导出完整数据库
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# 或使用Neon CLI
neonctl db-dump --project-id your-project-id > backup.sql
```

### 恢复

```bash
psql $DATABASE_URL < backup.sql
```

## 环境变量

确保设置以下环境变量：

```env
DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname
```

## 性能优化

1. 所有表已添加必要的索引
2. 使用 `EXPLAIN ANALYZE` 分析慢查询
3. 定期运行 `ANALYZE` 更新统计信息

## 注意事项

⚠️ **生产环境使用前**：
- 确保修改默认密码
- 配置Row Level Security (RLS)
- 定期备份数据
- 监控数据库性能
