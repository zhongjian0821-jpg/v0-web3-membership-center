# 购买数据API部署指南

## 概述

本指南说明如何将购买数据API部署到外部后台系统（v0-pve-operations-center）。

## 需要部署的API

### 1. 购买记录列表API
**文件路径**: `app/api/purchases/route.ts`  
**端点**: `GET /api/purchases`  
**功能**: 获取购买记录列表，支持分页和筛选

### 2. 购买数据汇总API
**文件路径**: `app/api/purchases/summary/route.ts`  
**端点**: `GET /api/purchases/summary`  
**功能**: 获取购买数据的汇总统计

---

## 部署步骤

### 步骤1: 复制API文件

从当前项目（v0-web3-membership-center）复制以下文件到外部后台项目（v0-pve-operations-center）：

\`\`\`bash
# 复制购买记录API
cp app/api/purchases/route.ts [外部项目]/app/api/purchases/route.ts

# 复制购买汇总API
cp app/api/purchases/summary/route.ts [外部项目]/app/api/purchases/summary/route.ts
\`\`\`

### 步骤2: 确保数据库连接

外部项目需要使用相同的数据库连接。在 Vercel 项目设置中添加环境变量：

\`\`\`env
DATABASE_URL=postgresql://neondb_owner:npg_uqVF2XMa4wCY@ep-crimson-bar-ah90q08x-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
\`\`\`

### 步骤3: 安装依赖

确保外部项目安装了必要的依赖：

\`\`\`bash
npm install @neondatabase/serverless
# 或
pnpm add @neondatabase/serverless
\`\`\`

### 步骤4: 部署到Vercel

\`\`\`bash
# 提交代码
git add app/api/purchases/
git commit -m "Add purchases data APIs for external statistics"

# 推送到仓库
git push origin main

# Vercel会自动部署
\`\`\`

---

## API端点

部署完成后，可以通过以下URL访问：

- **购买记录列表**: `https://v0-pve-operations-center.vercel.app/api/purchases`
- **购买数据汇总**: `https://v0-pve-operations-center.vercel.app/api/purchases/summary`

---

## 查询参数说明

### GET /api/purchases

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `wallet_address` | string | 否 | 钱包地址筛选 |
| `node_type` | string | 否 | 节点类型 (`cloud`/`image`) |
| `status` | string | 否 | 状态筛选 (`pending`/`processing`/`active`/`delivered`) |
| `start_date` | string | 否 | 开始日期 (YYYY-MM-DD) |
| `end_date` | string | 否 | 结束日期 (YYYY-MM-DD) |
| `page` | number | 否 | 页码，默认1 |
| `limit` | number | 否 | 每页数量，默认100，最大1000 |

### GET /api/purchases/summary

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `wallet_address` | string | 否 | 钱包地址筛选 |
| `node_type` | string | 否 | 节点类型筛选 |
| `start_date` | string | 否 | 开始日期 |
| `end_date` | string | 否 | 结束日期 |

---

## 数据表结构

API查询的 `nodes` 表结构：

\`\`\`sql
CREATE TABLE nodes (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(255),
  wallet_address VARCHAR(255) NOT NULL,
  node_type VARCHAR(50) NOT NULL,  -- 'cloud' 或 'image'
  quantity INTEGER DEFAULT 1,
  total_price_cny DECIMAL(20, 2),
  total_price_ashva DECIMAL(30, 8),
  status VARCHAR(50) DEFAULT 'pending',
  tx_hash VARCHAR(255),
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

---

## 注意事项

1. **SQL语法**: 所有SQL查询必须使用Neon的标签模板字符串语法：
   \`\`\`typescript
   // ✅ 正确
   const result = await sql`SELECT * FROM nodes WHERE wallet_address = ${address}`
   
   // ❌ 错误
   const result = await sql("SELECT * FROM nodes WHERE wallet_address = $1", [address])
   \`\`\`

2. **错误处理**: API已包含完整的错误处理和日志记录

3. **性能优化**: 
   - 使用索引优化查询性能
   - 限制最大返回数量（1000条）
   - 支持分页查询

4. **安全性**: 
   - 所有输入参数都经过验证
   - SQL查询使用参数化防止注入
   - 钱包地址统一转换为小写比较

---

## 验证部署

部署完成后，使用测试指南（TEST_GUIDE.md）进行验证。
