# Web3 Membership Frontend API Documentation
# 前端API接口完整文档

> **目的**：此文档记录了前端项目当前正在使用的所有API接口，供后端团队实现。
> **版本**：v1.0
> **数据库**：Neon PostgreSQL (10张表)
> **认证方式**：钱包签名 + JWT Token

---

## 快速开始指南

### 给后端开发者的说明

1. **API Base URL**：所有接口都以 `/api/v1` 为前缀（推荐）或保持当前的 `/api` 路径
2. **数据库连接**：使用Neon PostgreSQL，连接信息见环境变量配置
3. **认证机制**：钱包连接后生成JWT Token，后续请求需携带Token
4. **响应格式**：统一JSON格式，包含 `success` 和 `data` 字段
5. **错误处理**：HTTP状态码 + 错误信息对象

### 环境变量配置

```env
# 数据库
DATABASE_URL=postgresql://[username]:[password]@[host]/[database]

# 服务器
PORT=4000
NODE_ENV=production

# 区块链
RPC_URL=https://mainnet.base.org
ASHVA_CONTRACT_ADDRESS=0x...

# JWT认证
JWT_SECRET=your-secret-key-here

# CORS
CORS_ORIGINS=https://member.yourdomain.com
```

---

## 数据库结构

### 1. wallets（钱包表）
```sql
CREATE TABLE wallets (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(255) UNIQUE NOT NULL,
  ashva_balance NUMERIC(20,8) DEFAULT 0,
  member_level VARCHAR(50) DEFAULT 'normal',
  parent_wallet VARCHAR(255),
  total_earnings NUMERIC(20,8) DEFAULT 0,
  distributable_commission NUMERIC(20,8) DEFAULT 0,
  distributed_commission NUMERIC(20,8) DEFAULT 0,
  total_withdrawn NUMERIC(20,8) DEFAULT 0,
  pending_withdrawal NUMERIC(20,8) DEFAULT 0,
  team_size INTEGER DEFAULT 0,
  self_commission_rate NUMERIC(5,4) DEFAULT 0,
  commission_rate_level1 NUMERIC(5,4) DEFAULT 0,
  commission_rate_level2 NUMERIC(5,4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. nodes（节点表）
```sql
CREATE TABLE nodes (
  id SERIAL PRIMARY KEY,
  node_id VARCHAR(255) UNIQUE NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  node_type VARCHAR(50) NOT NULL, -- 'cloud' or 'image'
  status VARCHAR(50) DEFAULT 'deploying',
  purchase_price NUMERIC(20,8) NOT NULL,
  staking_amount NUMERIC(20,8) DEFAULT 0,
  staking_required_usd NUMERIC(20,2),
  staking_status VARCHAR(50) DEFAULT 'pending',
  cpu_cores INTEGER,
  memory_gb INTEGER,
  storage_gb INTEGER,
  cpu_usage_percentage NUMERIC(5,2) DEFAULT 0,
  memory_usage_percentage NUMERIC(5,2) DEFAULT 0,
  storage_used_percentage NUMERIC(5,2) DEFAULT 0,
  uptime_percentage NUMERIC(5,2) DEFAULT 0,
  data_transferred_gb NUMERIC(20,2) DEFAULT 0,
  total_earnings NUMERIC(20,8) DEFAULT 0,
  is_transferable BOOLEAN DEFAULT FALSE,
  install_command TEXT,
  tx_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. assigned_records（设备分配记录表）
```sql
CREATE TABLE assigned_records (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(255) NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  record_date DATE NOT NULL,
  daily_income_ashva NUMERIC(20,8) DEFAULT 0,
  daily_fine_ashva NUMERIC(20,8) DEFAULT 0,
  net_income_ashva NUMERIC(20,8) DEFAULT 0,
  daily_flow_gb NUMERIC(20,2) DEFAULT 0,
  daily_income_cny NUMERIC(20,2) DEFAULT 0,
  daily_fine_cny NUMERIC(20,2) DEFAULT 0,
  ashva_price_usd NUMERIC(20,8),
  cny_to_usd_rate NUMERIC(10,4),
  price_source VARCHAR(100),
  assigned_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(wallet_address, device_id, record_date)
);
```

### 4. hierarchy（层级关系表）
```sql
CREATE TABLE hierarchy (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(255) NOT NULL,
  parent_wallet VARCHAR(255) NOT NULL,
  level INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(wallet_address, parent_wallet, level)
);
```

### 5. commission_distribution（佣金分配配置表）
```sql
CREATE TABLE commission_distribution (
  id SERIAL PRIMARY KEY,
  from_wallet VARCHAR(255) NOT NULL,
  to_wallet VARCHAR(255) NOT NULL,
  level INTEGER NOT NULL,
  percentage NUMERIC(5,4) NOT NULL,
  rate NUMERIC(5,4) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(from_wallet, to_wallet, level)
);
```

### 6. commission_records（佣金记录表）
```sql
CREATE TABLE commission_records (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(255) NOT NULL,
  from_wallet VARCHAR(255) NOT NULL,
  amount NUMERIC(20,8) NOT NULL,
  commission_level INTEGER NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 7. member_level_config（会员等级配置表）
```sql
CREATE TABLE member_level_config (
  id SERIAL PRIMARY KEY,
  level_name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  max_depth INTEGER NOT NULL,
  commission_total_percentage NUMERIC(5,4) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初始数据
INSERT INTO member_level_config (level_name, display_name, max_depth, commission_total_percentage) VALUES
('normal', 'Normal Member', 2, 0.15),
('partner', 'Partner', 5, 0.30),
('global_partner', 'Global Partner', 10, 0.50);
```

### 8. node_listings（节点转让挂单表）
```sql
CREATE TABLE node_listings (
  id SERIAL PRIMARY KEY,
  listing_id VARCHAR(255) UNIQUE NOT NULL,
  node_id VARCHAR(255) NOT NULL,
  seller_wallet VARCHAR(255) NOT NULL,
  buyer_wallet VARCHAR(255),
  asking_price NUMERIC(20,8) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  description TEXT,
  sold_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 9. withdrawal_records（提现记录表）
```sql
CREATE TABLE withdrawal_records (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(255) NOT NULL,
  amount NUMERIC(20,8) NOT NULL,
  amount_usd NUMERIC(20,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  tx_hash VARCHAR(255),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 10. staking_records（质押记录表）
```sql
CREATE TABLE staking_records (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(255) NOT NULL,
  node_id VARCHAR(255) NOT NULL,
  staked_amount NUMERIC(20,8) NOT NULL,
  staked_amount_usd NUMERIC(20,2) NOT NULL,
  lock_period_days INTEGER NOT NULL,
  unlock_date TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  rewards_earned NUMERIC(20,8) DEFAULT 0,
  stake_tx_hash VARCHAR(255),
  unstake_tx_hash VARCHAR(255),
  unstaked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## API接口列表

### 模块1：用户认证与钱包管理（6个接口）

#### 1.1 钱包连接验证
**前端使用位置**：`app/(auth)/page.tsx` (登录页面)

```
POST /api/wallet/connect
```

**功能**：验证钱包签名，检查ASHVA余额，创建或更新钱包记录

**请求体**：
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
  "signature": "0x...",
  "message": "Sign this message to authenticate..."
}
```

**业务逻辑**：
1. 验证钱包签名是否有效
2. 查询链上ASHVA余额（调用区块链RPC）
3. 检查余额是否 > 0
4. 如果钱包不存在，创建新记录
5. 如果钱包已存在，更新 `ashva_balance` 和 `updated_at`
6. 生成JWT Token返回

**SQL查询**：
```sql
-- 1. 查询钱包是否存在
SELECT * FROM wallets WHERE LOWER(wallet_address) = LOWER($1);

-- 2. 如果不存在，插入新记录
INSERT INTO wallets (wallet_address, ashva_balance, member_level)
VALUES ($1, $2, 'normal')
RETURNING *;

-- 3. 如果存在，更新余额
UPDATE wallets 
SET ashva_balance = $2, updated_at = CURRENT_TIMESTAMP
WHERE LOWER(wallet_address) = LOWER($1)
RETURNING *;
```

**响应**：
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "wallet": {
      "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
      "ashva_balance": "1250.5",
      "member_level": "normal",
      "parent_wallet": null
    }
  }
}
```

**错误响应**：
```json
{
  "success": false,
  "error": "Invalid signature" | "ASHVA balance is 0" | "Wallet creation failed"
}
```

---

#### 1.2 验证ASHVA余额
**前端使用位置**：`app/(auth)/page.tsx` (登录验证)

```
GET /api/wallet/verify-ashva?address={walletAddress}
```

**功能**：快速验证钱包是否持有ASHVA代币

**查询参数**：
- `address` (required): 钱包地址

**业务逻辑**：
1. 调用区块链RPC，查询钱包的ASHVA余额
2. 返回余额和验证状态

**区块链查询示例**（使用ethers.js）：
```typescript
const contract = new ethers.Contract(ASHVA_CONTRACT_ADDRESS, ABI, provider);
const balance = await contract.balanceOf(walletAddress);
const decimals = await contract.decimals();
const formattedBalance = ethers.formatUnits(balance, decimals);
```

**响应**：
```json
{
  "success": true,
  "data": {
    "hasBalance": true,
    "balance": "1250.5",
    "balanceWei": "1250500000000000000000"
  }
}
```

---

#### 1.3 获取钱包基本信息
**前端使用位置**：多处使用

```
GET /api/wallet/info?address={walletAddress}
```

**功能**：获取钱包的基本信息（不包括详细收益数据）

**SQL查询**：
```sql
SELECT 
  wallet_address,
  ashva_balance,
  member_level,
  parent_wallet,
  total_earnings,
  team_size,
  created_at
FROM wallets 
WHERE LOWER(wallet_address) = LOWER($1);
```

**响应**：
```json
{
  "success": true,
  "data": {
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
    "ashva_balance": "1250.5",
    "member_level": "partner",
    "parent_wallet": "0x123...",
    "total_earnings": "5420.35",
    "team_size": 15,
    "created_at": "2024-01-15T08:30:00Z"
  }
}
```

---

#### 1.4 获取推荐人状态
**前端使用位置**：推荐关系查询

```
GET /api/wallet/referral-status?address={walletAddress}
```

**功能**：查询钱包的推荐人信息

**SQL查询**：
```sql
SELECT 
  w.wallet_address,
  w.parent_wallet,
  parent.member_level as parent_level,
  parent.wallet_address as parent_address
FROM wallets w
LEFT JOIN wallets parent ON w.parent_wallet = parent.wallet_address
WHERE LOWER(w.wallet_address) = LOWER($1);
```

**响应**：
```json
{
  "success": true,
  "data": {
    "has_referrer": true,
    "parent_wallet": "0x123...",
    "parent_level": "partner",
    "can_change_referrer": false
  }
}
```

---

#### 1.5 更新推荐人关系
**前端使用位置**：`app/add-referral/page.tsx`, `app/invite/page.tsx`, `app/referral/page.tsx`, `app/set-referral/page.tsx`

```
POST /api/wallet/update-referral
```

**功能**：设置或更新钱包的推荐人

**请求体**：
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
  "referrerAddress": "0x123..."
}
```

**业务逻辑**：
1. 验证推荐人地址是否存在
2. 验证不能设置自己为推荐人
3. 验证推荐人不能是自己的下级（防止循环推荐）
4. 如果当前已有推荐人，检查是否允许修改（业务规则）
5. 更新 wallets 表的 `parent_wallet`
6. 插入层级关系到 hierarchy 表
7. 更新推荐人的 `team_size`

**SQL查询**：
```sql
-- 1. 验证推荐人存在
SELECT * FROM wallets WHERE LOWER(wallet_address) = LOWER($1);

-- 2. 更新推荐关系
UPDATE wallets 
SET parent_wallet = $2, updated_at = CURRENT_TIMESTAMP
WHERE LOWER(wallet_address) = LOWER($1)
RETURNING *;

-- 3. 插入层级关系
INSERT INTO hierarchy (wallet_address, parent_wallet, level)
VALUES ($1, $2, 1)
ON CONFLICT (wallet_address, parent_wallet, level) DO NOTHING;

-- 4. 更新推荐人团队人数
UPDATE wallets 
SET team_size = team_size + 1
WHERE LOWER(wallet_address) = LOWER($1);
```

**响应**：
```json
{
  "success": true,
  "data": {
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
    "parent_wallet": "0x123...",
    "updated": true
  }
}
```

---

#### 1.6 同步钱包数据
**前端使用位置**：管理员功能

```
POST /api/wallet/sync
```

**功能**：同步钱包的链上余额和数据库记录

**请求体**：
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2"
}
```

**业务逻辑**：
1. 查询链上ASHVA余额
2. 更新数据库中的余额记录
3. 重新计算团队人数
4. 更新总收益

**响应**：
```json
{
  "success": true,
  "data": {
    "synced": true,
    "old_balance": "1200.5",
    "new_balance": "1250.5"
  }
}
```

---

### 模块2：会员信息管理（9个接口）

#### 2.1 获取会员完整信息
**前端使用位置**：`app/member/page.tsx` (会员中心首页)

```
GET /api/member?address={walletAddress}
```

**功能**：获取会员的完整信息，包括余额、等级、收益、团队等

**SQL查询**：
```sql
SELECT 
  w.*,
  COALESCE(SUM(ar.net_income_ashva), 0) as total_device_earnings,
  COUNT(DISTINCT n.node_id) as total_nodes,
  mlc.display_name as level_display_name,
  mlc.max_depth,
  mlc.commission_total_percentage
FROM wallets w
LEFT JOIN assigned_records ar ON w.wallet_address = ar.wallet_address
LEFT JOIN nodes n ON w.wallet_address = n.wallet_address
LEFT JOIN member_level_config mlc ON w.member_level = mlc.level_name
WHERE LOWER(w.wallet_address) = LOWER($1)
GROUP BY w.id, mlc.id;
```

**响应**：
```json
{
  "success": true,
  "data": {
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
    "ashva_balance": "1250.5",
    "member_level": "partner",
    "level_display_name": "Partner",
    "max_depth": 5,
    "commission_total_percentage": "0.30",
    "parent_wallet": "0x123...",
    "total_earnings": "5420.35",
    "distributable_commission": "320.50",
    "distributed_commission": "180.20",
    "total_withdrawn": "2100.00",
    "pending_withdrawal": "0",
    "team_size": 15,
    "total_nodes": 3,
    "total_device_earnings": "4500.80",
    "self_commission_rate": "0.1000",
    "commission_rate_level1": "0.0800",
    "commission_rate_level2": "0.0500"
  }
}
```

---

#### 2.2 获取直推团队列表
**前端使用位置**：`app/member/page.tsx` (团队页面)

```
GET /api/team?address={walletAddress}
```

**功能**：获取直接推荐的下级成员列表

**SQL查询**：
```sql
SELECT 
  w.wallet_address,
  w.member_level,
  w.ashva_balance,
  w.total_earnings,
  w.team_size,
  w.created_at,
  COUNT(DISTINCT n.node_id) as node_count
FROM wallets w
LEFT JOIN nodes n ON w.wallet_address = n.wallet_address
WHERE LOWER(w.parent_wallet) = LOWER($1)
GROUP BY w.id
ORDER BY w.created_at DESC;
```

**响应**：
```json
{
  "success": true,
  "data": {
    "team_members": [
      {
        "wallet_address": "0xabc...",
        "member_level": "normal",
        "ashva_balance": "500.25",
        "total_earnings": "1200.50",
        "team_size": 5,
        "node_count": 2,
        "created_at": "2024-02-01T10:00:00Z"
      }
    ],
    "total_count": 15
  }
}
```

---

#### 2.3 获取全局团队（多级）
**前端使用位置**：`app/member/page.tsx` (全局团队页面)

```
GET /api/global-team?address={walletAddress}&maxDepth={depth}
```

**功能**：获取多级下级团队成员

**查询参数**：
- `address` (required): 钱包地址
- `maxDepth` (optional): 最大层级深度，默认使用会员等级的max_depth

**SQL查询**（递归查询）：
```sql
WITH RECURSIVE team_tree AS (
  -- 基础查询：直推成员（level 1）
  SELECT 
    w.wallet_address,
    w.member_level,
    w.ashva_balance,
    w.total_earnings,
    w.team_size,
    w.parent_wallet,
    1 as depth
  FROM wallets w
  WHERE LOWER(w.parent_wallet) = LOWER($1)
  
  UNION ALL
  
  -- 递归查询：下级的下级
  SELECT 
    w.wallet_address,
    w.member_level,
    w.ashva_balance,
    w.total_earnings,
    w.team_size,
    w.parent_wallet,
    tt.depth + 1
  FROM wallets w
  INNER JOIN team_tree tt ON LOWER(w.parent_wallet) = LOWER(tt.wallet_address)
  WHERE tt.depth < $2
)
SELECT * FROM team_tree ORDER BY depth, wallet_address;
```

**响应**：
```json
{
  "success": true,
  "data": {
    "team_members": [
      {
        "wallet_address": "0xabc...",
        "member_level": "normal",
        "depth": 1,
        "total_earnings": "1200.50",
        "team_size": 5
      },
      {
        "wallet_address": "0xdef...",
        "member_level": "normal",
        "depth": 2,
        "total_earnings": "800.30",
        "team_size": 2
      }
    ],
    "total_count": 45,
    "max_depth_reached": 5
  }
}
```

---

#### 2.4 获取层级关系树
**前端使用位置**：推荐关系图

```
GET /api/member/hierarchy?address={walletAddress}
```

**功能**：获取用户的完整上下级关系

**SQL查询**：
```sql
-- 获取上级链
WITH RECURSIVE parent_chain AS (
  SELECT 
    wallet_address,
    parent_wallet,
    0 as level
  FROM wallets
  WHERE LOWER(wallet_address) = LOWER($1)
  
  UNION ALL
  
  SELECT 
    w.wallet_address,
    w.parent_wallet,
    pc.level + 1
  FROM wallets w
  INNER JOIN parent_chain pc ON LOWER(w.wallet_address) = LOWER(pc.parent_wallet)
  WHERE pc.level < 10
)
SELECT * FROM parent_chain;

-- 获取下级链（使用hierarchy表）
SELECT * FROM hierarchy
WHERE LOWER(parent_wallet) = LOWER($1)
ORDER BY level, wallet_address;
```

**响应**：
```json
{
  "success": true,
  "data": {
    "upline": [
      {
        "wallet_address": "0x123...",
        "level": 1
      },
      {
        "wallet_address": "0x456...",
        "level": 2
      }
    ],
    "downline": [
      {
        "wallet_address": "0xabc...",
        "level": 1
      },
      {
        "wallet_address": "0xdef...",
        "level": 2
      }
    ]
  }
}
```

---

#### 2.5 获取用户设备列表
**前端使用位置**：`app/member/page.tsx` (设备管理页面)

```
GET /api/user/devices?address={walletAddress}
```

**功能**：获取用户的所有设备及其收益数据

**SQL查询**：
```sql
SELECT 
  ar.device_id,
  COUNT(*) as record_count,
  SUM(ar.net_income_ashva) as total_earnings,
  SUM(ar.daily_flow_gb) as total_flow_gb,
  MAX(ar.record_date) as last_active_date,
  AVG(ar.net_income_ashva) as avg_daily_income
FROM assigned_records ar
WHERE LOWER(ar.wallet_address) = LOWER($1)
GROUP BY ar.device_id
ORDER BY last_active_date DESC;
```

**响应**：
```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "device_id": "DEV001",
        "record_count": 45,
        "total_earnings": "320.50",
        "total_flow_gb": "1250.75",
        "last_active_date": "2024-03-15",
        "avg_daily_income": "7.12"
      }
    ],
    "total_devices": 3
  }
}
```

---

#### 2.6 获取会员列表（分页）
**前端使用位置**：管理后台

```
GET /api/members?page={page}&limit={limit}&level={level}
```

**查询参数**：
- `page` (optional): 页码，默认1
- `limit` (optional): 每页数量，默认20
- `level` (optional): 筛选会员等级

**SQL查询**：
```sql
SELECT 
  w.*,
  COUNT(DISTINCT n.node_id) as node_count,
  COUNT(DISTINCT child.wallet_address) as direct_referrals
FROM wallets w
LEFT JOIN nodes n ON w.wallet_address = n.wallet_address
LEFT JOIN wallets child ON LOWER(child.parent_wallet) = LOWER(w.wallet_address)
WHERE ($1 IS NULL OR w.member_level = $1)
GROUP BY w.id
ORDER BY w.created_at DESC
LIMIT $2 OFFSET $3;
```

**响应**：
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
        "member_level": "partner",
        "ashva_balance": "1250.5",
        "total_earnings": "5420.35",
        "team_size": 15,
        "node_count": 3,
        "direct_referrals": 8,
        "created_at": "2024-01-15T08:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "total_pages": 8
    }
  }
}
```

---

#### 2.7 获取会员统计数据
**前端使用位置**：数据看板

```
GET /api/members/stats
```

**功能**：获取平台整体会员统计

**SQL查询**：
```sql
SELECT 
  COUNT(*) as total_members,
  SUM(CASE WHEN member_level = 'normal' THEN 1 ELSE 0 END) as normal_count,
  SUM(CASE WHEN member_level = 'partner' THEN 1 ELSE 0 END) as partner_count,
  SUM(CASE WHEN member_level = 'global_partner' THEN 1 ELSE 0 END) as global_partner_count,
  SUM(ashva_balance) as total_balance,
  SUM(total_earnings) as platform_total_earnings,
  AVG(team_size) as avg_team_size
FROM wallets;
```

**响应**：
```json
{
  "success": true,
  "data": {
    "total_members": 1250,
    "normal_count": 1000,
    "partner_count": 200,
    "global_partner_count": 50,
    "total_balance": "125000.50",
    "platform_total_earnings": "500000.75",
    "avg_team_size": 8.5
  }
}
```

---

#### 2.8 按等级筛选会员
**前端使用位置**：管理后台筛选

```
GET /api/members/by-level?level={level}
```

**功能**：获取特定等级的所有会员

**SQL查询**：
```sql
SELECT * FROM wallets
WHERE member_level = $1
ORDER BY total_earnings DESC;
```

---

#### 2.9 获取团队详细数据
**前端使用位置**：`app/member/team-details/page.tsx`

```
GET /api/member/team-details?address={walletAddress}
```

**功能**：获取团队的详细统计数据

**SQL查询**：
```sql
WITH team_members AS (
  SELECT w.*
  FROM wallets w
  WHERE LOWER(w.parent_wallet) = LOWER($1)
)
SELECT 
  COUNT(*) as total_members,
  SUM(ashva_balance) as total_balance,
  SUM(total_earnings) as total_earnings,
  AVG(total_earnings) as avg_earnings,
  COUNT(DISTINCT CASE WHEN member_level = 'partner' THEN wallet_address END) as partner_count
FROM team_members;
```

**响应**：
```json
{
  "success": true,
  "data": {
    "total_members": 15,
    "total_balance": "8500.75",
    "total_earnings": "25000.50",
    "avg_earnings": "1666.70",
    "partner_count": 3
  }
}
```

---

### 模块3：节点管理（12个接口）

#### 3.1 获取用户节点列表
**前端使用位置**：`app/nodes/page.tsx` (节点页面)

```
GET /api/nodes?address={walletAddress}
```

**功能**：获取用户的所有节点

**SQL查询**：
```sql
SELECT 
  n.*,
  sr.staked_amount,
  sr.lock_period_days,
  sr.unlock_date,
  sr.rewards_earned
FROM nodes n
LEFT JOIN staking_records sr ON n.node_id = sr.node_id AND sr.status = 'active'
WHERE LOWER(n.wallet_address) = LOWER($1)
ORDER BY n.created_at DESC;
```

**响应**：
```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "node_id": "NODE001",
        "node_type": "cloud",
        "status": "active",
        "purchase_price": "100.00",
        "staking_amount": "50.00",
        "staking_status": "staked",
        "cpu_cores": 4,
        "memory_gb": 8,
        "storage_gb": 100,
        "cpu_usage_percentage": "45.20",
        "memory_usage_percentage": "60.50",
        "uptime_percentage": "99.50",
        "total_earnings": "250.75",
        "is_transferable": true,
        "created_at": "2024-01-20T10:00:00Z"
      }
    ],
    "total_count": 3
  }
}
```

---

#### 3.2 获取单个节点详情
**前端使用位置**：节点详情页

```
GET /api/nodes/{nodeId}
```

**SQL查询**：
```sql
SELECT 
  n.*,
  w.member_level,
  sr.staked_amount,
  sr.rewards_earned,
  COUNT(ar.id) as earnings_record_count
FROM nodes n
LEFT JOIN wallets w ON n.wallet_address = w.wallet_address
LEFT JOIN staking_records sr ON n.node_id = sr.node_id AND sr.status = 'active'
LEFT JOIN assigned_records ar ON ar.device_id = n.node_id
WHERE n.node_id = $1
GROUP BY n.id, w.member_level, sr.staked_amount, sr.rewards_earned;
```

**响应**：
```json
{
  "success": true,
  "data": {
    "node_id": "NODE001",
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
    "node_type": "cloud",
    "status": "active",
    "purchase_price": "100.00",
    "staking_amount": "50.00",
    "total_earnings": "250.75",
    "cpu_usage_percentage": "45.20",
    "uptime_percentage": "99.50",
    "earnings_record_count": 45,
    "install_command": "curl -sSL https://... | bash"
  }
}
```

---

#### 3.3 购买云节点
**前端使用位置**：`app/purchase/page.tsx` (购买页面)

```
POST /api/purchase/cloud-node
```

**请求体**：
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
  "nodeType": "cloud",
  "specs": {
    "cpu_cores": 4,
    "memory_gb": 8,
    "storage_gb": 100
  },
  "purchasePrice": "100.00",
  "stakingAmount": "50.00",
  "txHash": "0x..."
}
```

**业务逻辑**：
1. 验证钱包余额是否足够
2. 验证交易hash是否有效
3. 生成唯一的node_id
4. 创建节点记录（status = 'deploying'）
5. 扣除钱包余额
6. 创建质押记录
7. 生成安装命令
8. 触发佣金分配

**SQL查询**：
```sql
-- 1. 检查余额
SELECT ashva_balance FROM wallets
WHERE LOWER(wallet_address) = LOWER($1);

-- 2. 插入节点记录
INSERT INTO nodes (
  node_id, wallet_address, node_type, status,
  purchase_price, staking_amount, staking_required_usd,
  cpu_cores, memory_gb, storage_gb, install_command, tx_hash
) VALUES (
  $1, $2, $3, 'deploying', $4, $5, $6, $7, $8, $9, $10, $11
) RETURNING *;

-- 3. 扣除余额
UPDATE wallets
SET ashva_balance = ashva_balance - $2
WHERE LOWER(wallet_address) = LOWER($1);

-- 4. 插入质押记录
INSERT INTO staking_records (
  wallet_address, node_id, staked_amount, staked_amount_usd,
  lock_period_days, unlock_date, status, stake_tx_hash
) VALUES ($1, $2, $3, $4, $5, $6, 'active', $7);
```

**响应**：
```json
{
  "success": true,
  "data": {
    "node_id": "NODE123456",
    "status": "deploying",
    "install_command": "curl -sSL https://install.example.com/node?id=NODE123456 | bash",
    "estimated_activation_time": "2024-03-20T12:00:00Z"
  }
}
```

---

#### 3.4 购买镜像节点
**前端使用位置**：`app/purchase/page.tsx`

```
POST /api/purchase/image-node
```

**请求体**：
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
  "nodeType": "image",
  "purchasePrice": "50.00",
  "txHash": "0x..."
}
```

**业务逻辑**：与云节点类似，但镜像节点不需要质押

---

#### 3.5 更新节点状态
**前端使用位置**：管理员操作

```
PUT /api/nodes/{nodeId}/status
```

**请求体**：
```json
{
  "status": "active" | "deploying" | "stopped" | "error"
}
```

**SQL查询**：
```sql
UPDATE nodes
SET status = $2, updated_at = CURRENT_TIMESTAMP
WHERE node_id = $1
RETURNING *;
```

---

#### 3.6 获取购买记录
**前端使用位置**：订单列表

```
GET /api/purchases?address={walletAddress}&page={page}
```

**SQL查询**：
```sql
SELECT 
  n.node_id,
  n.node_type,
  n.purchase_price,
  n.status,
  n.tx_hash,
  n.created_at
FROM nodes n
WHERE LOWER(n.wallet_address) = LOWER($1)
ORDER BY n.created_at DESC
LIMIT $2 OFFSET $3;
```

---

#### 3.7 获取购买统计
**前端使用位置**：数据统计

```
GET /api/purchases/summary?address={walletAddress}
```

**SQL查询**：
```sql
SELECT 
  COUNT(*) as total_purchases,
  SUM(purchase_price) as total_spent,
  SUM(CASE WHEN node_type = 'cloud' THEN 1 ELSE 0 END) as cloud_nodes,
  SUM(CASE WHEN node_type = 'image' THEN 1 ELSE 0 END) as image_nodes,
  SUM(total_earnings) as total_node_earnings
FROM nodes
WHERE LOWER(wallet_address) = LOWER($1);
```

**响应**：
```json
{
  "success": true,
  "data": {
    "total_purchases": 5,
    "total_spent": "450.00",
    "cloud_nodes": 3,
    "image_nodes": 2,
    "total_node_earnings": "1250.50"
  }
}
```

---

#### 3.8 云节点列表（管理员）
**前端使用位置**：`app/admin/cloud-nodes/page.tsx`

```
GET /api/admin/cloud-nodes
```

**SQL查询**：
```sql
SELECT 
  n.*,
  w.member_level,
  w.wallet_address as owner_wallet
FROM nodes n
LEFT JOIN wallets w ON n.wallet_address = w.wallet_address
WHERE n.node_type = 'cloud'
ORDER BY n.created_at DESC;
```

---

#### 3.9 同步节点数据
**前端使用位置**：外部系统同步

```
POST /api/sync/node-data
```

**请求体**：
```json
{
  "node_id": "NODE001",
  "cpu_usage": 45.2,
  "memory_usage": 60.5,
  "storage_used": 35.8,
  "uptime": 99.5,
  "data_transferred_gb": 150.5
}
```

**SQL查询**：
```sql
UPDATE nodes
SET 
  cpu_usage_percentage = $2,
  memory_usage_percentage = $3,
  storage_used_percentage = $4,
  uptime_percentage = $5,
  data_transferred_gb = data_transferred_gb + $6,
  updated_at = CURRENT_TIMESTAMP
WHERE node_id = $1
RETURNING *;
```

---

### 模块4：设备与收益记录（8个接口）

#### 4.1 获取设备分配记录
**前端使用位置**：设备收益列表

```
GET /api/assigned-records?address={walletAddress}&startDate={date}&endDate={date}
```

**查询参数**：
- `address` (required): 钱包地址
- `startDate` (optional): 开始日期 (YYYY-MM-DD)
- `endDate` (optional): 结束日期 (YYYY-MM-DD)
- `page` (optional): 页码
- `limit` (optional): 每页数量

**SQL查询**：
```sql
SELECT 
  ar.*,
  n.node_type,
  n.status as node_status
FROM assigned_records ar
LEFT JOIN nodes n ON ar.device_id = n.node_id
WHERE LOWER(ar.wallet_address) = LOWER($1)
  AND ($2 IS NULL OR ar.record_date >= $2)
  AND ($3 IS NULL OR ar.record_date <= $3)
ORDER BY ar.record_date DESC
LIMIT $4 OFFSET $5;
```

**响应**：
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": 1,
        "device_id": "NODE001",
        "record_date": "2024-03-15",
        "daily_income_ashva": "8.50",
        "daily_fine_ashva": "0.20",
        "net_income_ashva": "8.30",
        "daily_flow_gb": "35.5",
        "ashva_price_usd": "2.50",
        "daily_income_cny": "150.00",
        "node_type": "cloud",
        "node_status": "active"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150
    }
  }
}
```

---

#### 4.2 获取收益汇总
**前端使用位置**：收益统计

```
GET /api/assigned-records/summary?address={walletAddress}&period={period}
```

**查询参数**：
- `address` (required): 钱包地址
- `period` (optional): 'day' | 'week' | 'month' | 'all'

**SQL查询**：
```sql
SELECT 
  COUNT(DISTINCT device_id) as active_devices,
  COUNT(*) as total_records,
  SUM(daily_income_ashva) as total_income,
  SUM(daily_fine_ashva) as total_fines,
  SUM(net_income_ashva) as total_net_income,
  SUM(daily_flow_gb) as total_flow_gb,
  AVG(net_income_ashva) as avg_daily_income,
  MIN(record_date) as first_record_date,
  MAX(record_date) as last_record_date
FROM assigned_records
WHERE LOWER(wallet_address) = LOWER($1)
  AND ($2 IS NULL OR record_date >= CURRENT_DATE - INTERVAL '1 ' || $2);
```

**响应**：
```json
{
  "success": true,
  "data": {
    "active_devices": 3,
    "total_records": 135,
    "total_income": "1150.50",
    "total_fines": "25.30",
    "total_net_income": "1125.20",
    "total_flow_gb": "4850.75",
    "avg_daily_income": "8.33",
    "first_record_date": "2024-01-01",
    "last_record_date": "2024-03-15"
  }
}
```

---

#### 4.3 同步设备记录
**前端使用位置**：数据同步

```
POST /api/assigned-records/sync
```

**请求体**：
```json
{
  "records": [
    {
      "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
      "device_id": "NODE001",
      "record_date": "2024-03-15",
      "daily_income_ashva": "8.50",
      "daily_fine_ashva": "0.20",
      "daily_flow_gb": "35.5",
      "ashva_price_usd": "2.50"
    }
  ]
}
```

**业务逻辑**：
1. 批量插入或更新记录（使用 UPSERT）
2. 计算 net_income_ashva = daily_income_ashva - daily_fine_ashva
3. 更新钱包的 total_earnings
4. 触发佣金分配

**SQL查询**：
```sql
INSERT INTO assigned_records (
  wallet_address, device_id, record_date,
  daily_income_ashva, daily_fine_ashva, net_income_ashva,
  daily_flow_gb, ashva_price_usd, price_source
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
ON CONFLICT (wallet_address, device_id, record_date)
DO UPDATE SET
  daily_income_ashva = EXCLUDED.daily_income_ashva,
  daily_fine_ashva = EXCLUDED.daily_fine_ashva,
  net_income_ashva = EXCLUDED.net_income_ashva,
  daily_flow_gb = EXCLUDED.daily_flow_gb,
  updated_at = CURRENT_TIMESTAMP;

-- 更新钱包总收益
UPDATE wallets
SET total_earnings = total_earnings + $2
WHERE LOWER(wallet_address) = LOWER($1);
```

---

#### 4.4 获取分配任务列表
**前端使用位置**：任务列表

```
GET /api/assignments?address={walletAddress}
```

---

#### 4.5 获取分配统计
**前端使用位置**：统计看板

```
GET /api/assignments/stats
```

---

#### 4.6 客户设备查询
**前端使用位置**：客服系统

```
GET /api/customer/devices?address={walletAddress}
```

---

#### 4.7 删除分配记录
**前端使用位置**：管理员操作

```
DELETE /api/cloud-node-assignments/{id}
```

---

#### 4.8 同步设备状态
**前端使用位置**：定时任务

```
POST /api/sync-device-status
```

---

### 模块5：收益与佣金（9个接口）

#### 5.1 获取收益汇总
**前端使用位置**：会员中心

```
GET /api/earnings/summary?address={walletAddress}
```

**SQL查询**：
```sql
SELECT 
  SUM(ar.net_income_ashva) as device_earnings,
  SUM(n.total_earnings) as node_earnings,
  SUM(cr.amount) as commission_earnings,
  (SELECT distributable_commission FROM wallets WHERE LOWER(wallet_address) = LOWER($1)) as available_commission,
  (SELECT total_withdrawn FROM wallets WHERE LOWER(wallet_address) = LOWER($1)) as total_withdrawn
FROM assigned_records ar
LEFT JOIN nodes n ON ar.wallet_address = n.wallet_address
LEFT JOIN commission_records cr ON ar.wallet_address = cr.wallet_address
WHERE LOWER(ar.wallet_address) = LOWER($1);
```

**响应**：
```json
{
  "success": true,
  "data": {
    "device_earnings": "1125.20",
    "node_earnings": "850.50",
    "commission_earnings": "320.80",
    "total_earnings": "2296.50",
    "available_commission": "180.50",
    "total_withdrawn": "1500.00",
    "current_balance": "796.50"
  }
}
```

---

#### 5.2 获取收益明细
**前端使用位置**：收益详情页

```
GET /api/earnings/breakdown?address={walletAddress}&startDate={date}&endDate={date}
```

**SQL查询**：
```sql
SELECT 
  record_date as date,
  'device' as type,
  device_id as source,
  net_income_ashva as amount
FROM assigned_records
WHERE LOWER(wallet_address) = LOWER($1)
  AND record_date BETWEEN $2 AND $3

UNION ALL

SELECT 
  created_at::date as date,
  'commission' as type,
  from_wallet as source,
  amount
FROM commission_records
WHERE LOWER(wallet_address) = LOWER($1)
  AND created_at::date BETWEEN $2 AND $3

ORDER BY date DESC;
```

**响应**：
```json
{
  "success": true,
  "data": {
    "breakdown": [
      {
        "date": "2024-03-15",
        "type": "device",
        "source": "NODE001",
        "amount": "8.30"
      },
      {
        "date": "2024-03-15",
        "type": "commission",
        "source": "0xabc...",
        "amount": "2.50"
      }
    ]
  }
}
```

---

#### 5.3 获取佣金记录
**前端使用位置**：`app/commissions/page.tsx` (佣金页面)

```
GET /api/commissions?address={walletAddress}
```

**SQL查询**：
```sql
SELECT 
  cr.*,
  w.member_level as from_member_level
FROM commission_records cr
LEFT JOIN wallets w ON cr.from_wallet = w.wallet_address
WHERE LOWER(cr.wallet_address) = LOWER($1)
ORDER BY cr.created_at DESC
LIMIT 100;
```

**响应**：
```json
{
  "success": true,
  "data": {
    "commissions": [
      {
        "id": 1,
        "from_wallet": "0xabc...",
        "amount": "2.50",
        "commission_level": 1,
        "transaction_type": "device_earning",
        "from_member_level": "normal",
        "created_at": "2024-03-15T10:30:00Z"
      }
    ],
    "total_amount": "320.80"
  }
}
```

---

#### 5.4 获取佣金详细
**前端使用位置**：佣金明细

```
GET /api/commissions/details?address={walletAddress}&level={level}
```

**查询参数**：
- `address` (required): 钱包地址
- `level` (optional): 筛选佣金层级（1, 2, 3等）

**SQL查询**：
```sql
SELECT 
  commission_level,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount,
  COUNT(DISTINCT from_wallet) as unique_sources
FROM commission_records
WHERE LOWER(wallet_address) = LOWER($1)
  AND ($2 IS NULL OR commission_level = $2)
GROUP BY commission_level
ORDER BY commission_level;
```

**响应**：
```json
{
  "success": true,
  "data": {
    "details_by_level": [
      {
        "commission_level": 1,
        "transaction_count": 45,
        "total_amount": "180.50",
        "avg_amount": "4.01",
        "unique_sources": 8
      },
      {
        "commission_level": 2,
        "transaction_count": 120,
        "total_amount": "140.30",
        "avg_amount": "1.17",
        "unique_sources": 15
      }
    ]
  }
}
```

---

#### 5.5 获取佣金配置
**前端使用位置**：`app/commission-manage/page.tsx` (佣金管理页)

```
GET /api/commission-config?address={walletAddress}
```

**SQL查询**：
```sql
SELECT 
  cd.*,
  w.member_level as to_member_level,
  w.wallet_address as to_wallet_address
FROM commission_distribution cd
LEFT JOIN wallets w ON cd.to_wallet = w.wallet_address
WHERE LOWER(cd.from_wallet) = LOWER($1)
ORDER BY cd.level, cd.percentage DESC;
```

**响应**：
```json
{
  "success": true,
  "data": {
    "config": [
      {
        "to_wallet": "0x123...",
        "level": 1,
        "percentage": "0.0800",
        "rate": "0.0800",
        "to_member_level": "partner"
      },
      {
        "to_wallet": "0x456...",
        "level": 2,
        "percentage": "0.0500",
        "rate": "0.0500",
        "to_member_level": "normal"
      }
    ],
    "self_commission_rate": "0.1000"
  }
}
```

---

#### 5.6 更新佣金配置
**前端使用位置**：`app/commission-manage/page.tsx`

```
PUT /api/commission-config
```

**请求体**：
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
  "config": [
    {
      "to_wallet": "0x123...",
      "level": 1,
      "percentage": "0.0800"
    },
    {
      "to_wallet": "0x456...",
      "level": 2,
      "percentage": "0.0500"
    }
  ]
}
```

**业务逻辑**：
1. 验证总百分比不超过会员等级的 commission_total_percentage
2. 验证to_wallet都在自己的下级团队中
3. 删除旧配置
4. 插入新配置

**SQL查询**：
```sql
-- 1. 验证总百分比
SELECT commission_total_percentage
FROM wallets w
JOIN member_level_config mlc ON w.member_level = mlc.level_name
WHERE LOWER(w.wallet_address) = LOWER($1);

-- 2. 删除旧配置
DELETE FROM commission_distribution
WHERE LOWER(from_wallet) = LOWER($1);

-- 3. 插入新配置
INSERT INTO commission_distribution (from_wallet, to_wallet, level, percentage, rate)
VALUES ($1, $2, $3, $4, $4);
```

**响应**：
```json
{
  "success": true,
  "data": {
    "updated": true,
    "config_count": 2
  }
}
```

---

#### 5.7 创建佣金配置
**前端使用位置**：首次设置

```
POST /api/commission-config
```

---

#### 5.8 删除佣金配置
**前端使用位置**：管理操作

```
DELETE /api/commission-config/{id}
```

---

#### 5.9 收益计算调试
**前端使用位置**：开发调试

```
GET /api/test/earnings-debug?address={walletAddress}
```

---

### 模块6：提现管理（3个接口）

#### 6.1 创建提现申请
**前端使用位置**：`app/withdraw/page.tsx` (提现页面)

```
POST /api/withdraw
```

**请求体**：
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
  "amount": "100.00",
  "amountUsd": "250.00"
}
```

**业务逻辑**：
1. 验证余额是否足够（distributable_commission）
2. 检查是否有pending的提现申请
3. 验证提现金额是否达到最低限额
4. 创建提现记录（status = 'pending'）
5. 扣除可提现余额，增加pending_withdrawal

**SQL查询**：
```sql
-- 1. 检查余额
SELECT distributable_commission, pending_withdrawal
FROM wallets
WHERE LOWER(wallet_address) = LOWER($1);

-- 2. 插入提现记录
INSERT INTO withdrawal_records (
  wallet_address, amount, amount_usd, status
) VALUES ($1, $2, $3, 'pending')
RETURNING *;

-- 3. 更新钱包余额
UPDATE wallets
SET 
  distributable_commission = distributable_commission - $2,
  pending_withdrawal = pending_withdrawal + $2,
  updated_at = CURRENT_TIMESTAMP
WHERE LOWER(wallet_address) = LOWER($1);
```

**响应**：
```json
{
  "success": true,
  "data": {
    "withdrawal_id": 123,
    "status": "pending",
    "amount": "100.00",
    "estimated_processing_time": "1-3 business days"
  }
}
```

---

#### 6.2 获取提现历史
**前端使用位置**：`app/withdraw/page.tsx` (提现记录)

```
GET /api/withdraw/history?address={walletAddress}
```

**SQL查询**：
```sql
SELECT * FROM withdrawal_records
WHERE LOWER(wallet_address) = LOWER($1)
ORDER BY created_at DESC
LIMIT 50;
```

**响应**：
```json
{
  "success": true,
  "data": {
    "withdrawals": [
      {
        "id": 123,
        "amount": "100.00",
        "amount_usd": "250.00",
        "status": "completed",
        "tx_hash": "0x...",
        "processed_at": "2024-03-16T10:00:00Z",
        "created_at": "2024-03-15T15:30:00Z"
      }
    ]
  }
}
```

---

#### 6.3 审批提现（管理员）
**前端使用位置**：管理后台

```
POST /api/withdraw/approve
```

**请求体**：
```json
{
  "withdrawalId": 123,
  "action": "approve" | "reject",
  "txHash": "0x...",
  "note": "Optional note"
}
```

**业务逻辑**：
1. 更新提现记录状态
2. 如果approve：更新tx_hash和processed_at，增加total_withdrawn，减少pending_withdrawal
3. 如果reject：退还pending_withdrawal到distributable_commission

**SQL查询**：
```sql
-- 如果approve
UPDATE withdrawal_records
SET 
  status = 'completed',
  tx_hash = $2,
  processed_at = CURRENT_TIMESTAMP
WHERE id = $1;

UPDATE wallets
SET 
  pending_withdrawal = pending_withdrawal - $2,
  total_withdrawn = total_withdrawn + $2
WHERE LOWER(wallet_address) = LOWER($1);

-- 如果reject
UPDATE withdrawal_records
SET status = 'rejected'
WHERE id = $1;

UPDATE wallets
SET 
  pending_withdrawal = pending_withdrawal - $2,
  distributable_commission = distributable_commission + $2
WHERE LOWER(wallet_address) = LOWER($1);
```

---

### 模块7：节点转让市场（5个接口）

#### 7.1 获取转让市场列表
**前端使用位置**：市场页面

```
GET /api/transfer/marketplace?page={page}&limit={limit}
```

**SQL查询**：
```sql
SELECT 
  nl.*,
  n.node_type,
  n.cpu_cores,
  n.memory_gb,
  n.storage_gb,
  n.total_earnings,
  w.member_level as seller_level
FROM node_listings nl
LEFT JOIN nodes n ON nl.node_id = n.node_id
LEFT JOIN wallets w ON nl.seller_wallet = w.wallet_address
WHERE nl.status = 'active'
ORDER BY nl.created_at DESC
LIMIT $1 OFFSET $2;
```

**响应**：
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "listing_id": "LIST001",
        "node_id": "NODE001",
        "node_type": "cloud",
        "asking_price": "120.00",
        "cpu_cores": 4,
        "memory_gb": 8,
        "total_earnings": "250.75",
        "seller_level": "partner",
        "created_at": "2024-03-10T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "total": 25
    }
  }
}
```

---

#### 7.2 创建转让挂单
**前端使用位置**：出售节点

```
POST /api/transfer/create-listing
```

**请求体**：
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
  "nodeId": "NODE001",
  "askingPrice": "120.00",
  "description": "High performance cloud node"
}
```

**业务逻辑**：
1. 验证节点属于该钱包
2. 验证节点 is_transferable = true
3. 验证节点没有pending的挂单
4. 创建挂单记录
5. 更新节点状态

**SQL查询**：
```sql
-- 1. 验证节点
SELECT * FROM nodes
WHERE node_id = $1 
  AND LOWER(wallet_address) = LOWER($2)
  AND is_transferable = TRUE;

-- 2. 插入挂单
INSERT INTO node_listings (
  listing_id, node_id, seller_wallet, asking_price, description, status
) VALUES ($1, $2, $3, $4, $5, 'active')
RETURNING *;
```

**响应**：
```json
{
  "success": true,
  "data": {
    "listing_id": "LIST123",
    "status": "active"
  }
}
```

---

#### 7.3 获取我的挂单
**前端使用位置**：我的挂单页面

```
GET /api/transfer/my-listings?address={walletAddress}
```

---

#### 7.4 取消挂单
**前端使用位置**：取消出售

```
DELETE /api/transfer/cancel-listing/{listingId}
```

---

#### 7.5 购买挂单节点
**前端使用位置**：购买操作

```
POST /api/transfer/purchase
```

**请求体**：
```json
{
  "listingId": "LIST001",
  "buyerWallet": "0xdef...",
  "txHash": "0x..."
}
```

**业务逻辑**：
1. 验证挂单状态为active
2. 验证买家余额足够
3. 转移节点所有权
4. 更新挂单状态为sold
5. 转账给卖家
6. 记录交易

**SQL查询**：
```sql
-- 1. 更新节点所有者
UPDATE nodes
SET wallet_address = $2
WHERE node_id = $1;

-- 2. 更新挂单状态
UPDATE node_listings
SET 
  status = 'sold',
  buyer_wallet = $2,
  sold_at = CURRENT_TIMESTAMP
WHERE listing_id = $1;

-- 3. 买家扣款
UPDATE wallets
SET ashva_balance = ashva_balance - $2
WHERE LOWER(wallet_address) = LOWER($1);

-- 4. 卖家收款
UPDATE wallets
SET ashva_balance = ashva_balance + $2
WHERE LOWER(wallet_address) = LOWER($1);
```

---

### 模块8：价格预言机（2个接口）

#### 8.1 获取ASHVA实时价格
**前端使用位置**：`app/withdraw/page.tsx`，多处使用

```
GET /api/ashva-price
```

**功能**：获取ASHVA的实时USD价格

**业务逻辑**：
1. 从多个价格源获取价格（DEX、CEX、预言机）
2. 计算加权平均价格
3. 缓存5分钟
4. 返回价格和数据源

**价格源示例**：
- Uniswap V3 池
- 中心化交易所API
- Chainlink预言机

**响应**：
```json
{
  "success": true,
  "data": {
    "price_usd": "2.50",
    "price_cny": "18.00",
    "sources": [
      {
        "name": "Uniswap",
        "price": "2.48",
        "weight": 0.5
      },
      {
        "name": "Binance",
        "price": "2.52",
        "weight": 0.5
      }
    ],
    "timestamp": "2024-03-15T15:30:00Z",
    "cached": false
  }
}
```

**实现示例**：
```typescript
async function getAshvaPrice() {
  // 1. 检查缓存
  const cached = await cache.get('ashva_price');
  if (cached && Date.now() - cached.timestamp < 300000) {
    return cached;
  }
  
  // 2. 从Uniswap获取价格
  const uniswapPrice = await getUniswapPrice();
  
  // 3. 从CEX获取价格
  const binancePrice = await getBinancePrice();
  
  // 4. 计算加权平均
  const avgPrice = (uniswapPrice * 0.5) + (binancePrice * 0.5);
  
  // 5. 缓存结果
  await cache.set('ashva_price', { price: avgPrice, timestamp: Date.now() });
  
  return avgPrice;
}
```

---

#### 8.2 价格预言机数据源
**前端使用位置**：价格聚合

```
GET /api/ashva-price-oracle
```

---

### 模块9：管理后台（5个接口）

#### 9.1 管理后台统计数据
**前端使用位置**：管理看板

```
GET /api/admin/dashboard-stats
```

**SQL查询**：
```sql
SELECT 
  (SELECT COUNT(*) FROM wallets) as total_users,
  (SELECT COUNT(*) FROM nodes) as total_nodes,
  (SELECT SUM(ashva_balance) FROM wallets) as total_balance,
  (SELECT SUM(total_earnings) FROM wallets) as total_earnings,
  (SELECT COUNT(*) FROM withdrawal_records WHERE status = 'pending') as pending_withdrawals,
  (SELECT SUM(amount) FROM withdrawal_records WHERE status = 'completed') as total_withdrawn;
```

**响应**：
```json
{
  "success": true,
  "data": {
    "total_users": 1250,
    "total_nodes": 3500,
    "total_balance": "125000.50",
    "total_earnings": "500000.75",
    "pending_withdrawals": 15,
    "total_withdrawn": "350000.00"
  }
}
```

---

#### 9.2 用户管理列表
**前端使用位置**：用户管理

```
GET /api/admin/users?page={page}&search={keyword}
```

---

#### 9.3 云节点管理
**前端使用位置**：`app/admin/cloud-nodes/page.tsx`

```
GET /api/admin/cloud-nodes
```

---

#### 9.4 收益报表
**前端使用位置**：财务报表

```
GET /api/admin/revenue-report?startDate={date}&endDate={date}
```

**SQL查询**：
```sql
SELECT 
  DATE_TRUNC('day', created_at) as date,
  SUM(amount) as daily_revenue,
  COUNT(*) as transaction_count
FROM commission_records
WHERE created_at BETWEEN $1 AND $2
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date;
```

---

#### 9.5 系统日志
**前端使用位置**：日志查看

```
GET /api/admin/system-logs?page={page}
```

---

### 模块10：其他辅助接口（4个接口）

#### 10.1 获取订单列表
**前端使用位置**：订单管理

```
GET /api/orders?address={walletAddress}
```

---

#### 10.2 验证钱包签名
**前端使用位置**：登录验证

```
POST /api/auth/verify-signature
```

**请求体**：
```json
{
  "message": "Sign this message to authenticate...",
  "signature": "0x...",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2"
}
```

**验证逻辑**（使用ethers.js）：
```typescript
import { ethers } from 'ethers';

function verifySignature(message: string, signature: string, address: string): boolean {
  const recoveredAddress = ethers.verifyMessage(message, signature);
  return recoveredAddress.toLowerCase() === address.toLowerCase();
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "valid": true
  }
}
```

---

#### 10.3 手动更新状态
**前端使用位置**：管理员工具

```
POST /api/manual-update-status
```

---

#### 10.4 镜像节点统计
**前端使用位置**：数据分析

```
GET /api/image-node-purchases/stats
```

---

## 认证机制详解

### JWT Token生成

```typescript
import jwt from 'jsonwebtoken';

function generateToken(walletAddress: string): string {
  const payload = {
    wallet: walletAddress.toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + (24 * 3600) // 24小时过期
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET!);
}
```

### JWT验证中间件

```typescript
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}
```

---

## 错误处理规范

### 统一错误响应格式

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### 常见错误代码

| HTTP状态码 | 错误代码 | 说明 |
|-----------|---------|------|
| 400 | INVALID_REQUEST | 请求参数错误 |
| 401 | UNAUTHORIZED | 未授权或Token过期 |
| 403 | FORBIDDEN | 权限不足 |
| 404 | NOT_FOUND | 资源不存在 |
| 409 | CONFLICT | 资源冲突（如重复创建） |
| 500 | INTERNAL_ERROR | 服务器内部错误 |

### 错误处理示例

```typescript
try {
  // 业务逻辑
} catch (error) {
  console.error('Error:', error);
  
  if (error.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      success: false,
      error: 'Resource already exists',
      code: 'CONFLICT'
    });
  }
  
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
}
```

---

## CORS配置

```typescript
import cors from 'cors';

app.use(cors({
  origin: [
    'https://member.yourdomain.com',
    'http://localhost:3000' // 开发环境
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 部署指南

### 方式1：Vercel部署

1. 创建新的Vercel项目
2. 连接GitHub仓库
3. 配置环境变量
4. 部署

```bash
vercel deploy --prod
```

### 方式2：Docker部署

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
```

```bash
docker build -t web3-api .
docker run -p 4000:4000 --env-file .env web3-api
```

### 方式3：Railway部署

1. 访问 railway.app
2. 创建新项目
3. 连接GitHub
4. 配置环境变量
5. 自动部署

---

## 性能优化建议

### 1. 数据库索引

```sql
-- 钱包地址索引
CREATE INDEX idx_wallets_address ON wallets(LOWER(wallet_address));
CREATE INDEX idx_wallets_parent ON wallets(LOWER(parent_wallet));

-- 节点索引
CREATE INDEX idx_nodes_wallet ON nodes(LOWER(wallet_address));
CREATE INDEX idx_nodes_status ON nodes(status);

-- 记录索引
CREATE INDEX idx_assigned_records_wallet_date ON assigned_records(wallet_address, record_date);
CREATE INDEX idx_commission_records_wallet ON commission_records(wallet_address);
```

### 2. 缓存策略

```typescript
// Redis缓存示例
const cacheMiddleware = async (req, res, next) => {
  const key = `cache:${req.path}:${JSON.stringify(req.query)}`;
  
  const cached = await redis.get(key);
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  // 修改res.json以缓存结果
  const originalJson = res.json;
  res.json = function(data) {
    redis.setex(key, 300, JSON.stringify(data)); // 缓存5分钟
    originalJson.call(this, data);
  };
  
  next();
};
```

### 3. 连接池配置

```typescript
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!, {
  fetchConnectionCache: true,
  poolQueryViaFetch: true
});
```

---

## 测试指南

### API测试示例（使用curl）

```bash
# 1. 钱包连接
curl -X POST http://localhost:4000/api/wallet/connect \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
    "signature": "0x...",
    "message": "Sign this message..."
  }'

# 2. 获取会员信息
curl -X GET "http://localhost:4000/api/member?address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. 获取节点列表
curl -X GET "http://localhost:4000/api/nodes?address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 前端集成示例

### API客户端（前端）

```typescript
// lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:4000';

class ApiClient {
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`,
        ...options.headers,
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  }

  // 会员相关
  async getMemberData(wallet: string) {
    return this.request(`/api/member?address=${wallet}`);
  }

  async getMemberTeam(wallet: string) {
    return this.request(`/api/team?address=${wallet}`);
  }

  // 节点相关
  async getNodes(wallet: string) {
    return this.request(`/api/nodes?address=${wallet}`);
  }

  async purchaseCloudNode(data: any) {
    return this.request('/api/purchase/cloud-node', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 提现相关
  async createWithdrawal(data: any) {
    return this.request('/api/withdraw', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  private getAuthToken(): string {
    return localStorage.getItem('auth_token') || '';
  }
}

export const apiClient = new ApiClient();
```

### 使用示例

```typescript
// app/member/page.tsx
'use client'
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export default function MemberPage() {
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await apiClient.getMemberData(walletAddress);
        setMemberData(data.data);
      } catch (error) {
        console.error('Failed to fetch member data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [walletAddress]);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Member Dashboard</h1>
      <p>Balance: {memberData?.ashva_balance} ASHVA</p>
      <p>Level: {memberData?.level_display_name}</p>
      <p>Total Earnings: {memberData?.total_earnings}</p>
    </div>
  );
}
```

---

## 常见问题解答

### Q1: 如何切换API地址？

**A**: 在前端项目的环境变量中修改 `NEXT_PUBLIC_BACKEND_API_URL`

```env
# 开发环境
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:4000

# 生产环境
NEXT_PUBLIC_BACKEND_API_URL=https://api.yourdomain.com
```

### Q2: JWT Token过期怎么办？

**A**: 前端需要实现Token刷新机制，或者在401错误时重新登录

```typescript
async request(endpoint: string, options: RequestInit = {}) {
  try {
    return await this.fetchWithAuth(endpoint, options);
  } catch (error) {
    if (error.status === 401) {
      // Token过期，清除并重定向到登录
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    throw error;
  }
}
```

### Q3: 如何处理并发请求？

**A**: 使用连接池和限流中间件

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 最多100个请求
});

app.use('/api/', limiter);
```

### Q4: 数据库连接池如何配置？

**A**: Neon自动处理连接池，无需额外配置。如需优化，可使用 `fetchConnectionCache`

---

## 技术栈

- **后端框架**: Express.js / Next.js API Routes
- **语言**: TypeScript
- **数据库**: Neon PostgreSQL
- **认证**: JWT + 钱包签名
- **区块链**: ethers.js
- **缓存**: Redis（可选）
- **部署**: Vercel / Docker / Railway

---

## 开发团队联系方式

如有任何问题，请联系：
- API文档维护：[Your Email]
- 技术支持：[Support Email]

---

**文档版本**: v1.0  
**最后更新**: 2024-03-15  
**总接口数**: 55个核心接口  
**数据库表数**: 10张表

---

## 附录

### A. 完整的环境变量清单

```env
# 数据库
DATABASE_URL=postgresql://user:password@host:5432/database

# 服务器
PORT=4000
NODE_ENV=production

# 区块链
RPC_URL=https://mainnet.base.org
ASHVA_CONTRACT_ADDRESS=0x...

# JWT
JWT_SECRET=your-secret-key-minimum-32-characters

# CORS
CORS_ORIGINS=https://member.yourdomain.com,http://localhost:3000

# Redis（可选）
REDIS_URL=redis://localhost:6379

# 价格API（可选）
BINANCE_API_KEY=your-api-key
```

### B. 项目启动命令

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm start

# 运行测试
npm test
```

### C. Git提交规范

```
feat: 新增功能
fix: 修复bug
docs: 文档更新
refactor: 代码重构
test: 测试相关
chore: 构建/工具变动
```

---

**祝开发顺利！**
