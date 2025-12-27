# Web3 Membership Backend API - 完整开发文档

## 文档说明

这是 Web3 会员管理系统的完整后端 API 开发文档，包含 55 个核心接口的详细规范。

**适用场景：** 在新的 v0 项目中开发独立的后端 API 服务

**技术栈：** Express.js + TypeScript + Neon PostgreSQL

**API 版本：** v1

**Base URL：** `https://api.yourdomain.com/api/v1`

---

## 目录

- [1. 数据库结构](#1-数据库结构)
- [2. 认证与授权](#2-认证与授权)
- [3. API 接口规范](#3-api-接口规范)
  - [3.1 用户认证与钱包管理 (6个)](#31-用户认证与钱包管理)
  - [3.2 会员信息管理 (9个)](#32-会员信息管理)
  - [3.3 节点管理 (12个)](#33-节点管理)
  - [3.4 设备与收益记录 (8个)](#34-设备与收益记录)
  - [3.5 收益与佣金 (9个)](#35-收益与佣金)
  - [3.6 提现管理 (3个)](#36-提现管理)
  - [3.7 节点转让市场 (5个)](#37-节点转让市场)
  - [3.8 价格预言机 (2个)](#38-价格预言机)
  - [3.9 管理后台 (5个)](#39-管理后台)
- [4. 错误处理](#4-错误处理)
- [5. 部署指南](#5-部署指南)

---

## 1. 数据库结构

### 1.1 数据库连接

```typescript
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)
```

### 1.2 数据库表结构（10张表）

#### 表1：wallets - 钱包主表

```sql
CREATE TABLE wallets (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  ashva_balance NUMERIC(20, 8) DEFAULT 0,
  member_level VARCHAR(50) DEFAULT 'free',
  parent_wallet VARCHAR(42),
  total_earnings NUMERIC(20, 8) DEFAULT 0,
  distributable_commission NUMERIC(20, 8) DEFAULT 0,
  distributed_commission NUMERIC(20, 8) DEFAULT 0,
  self_commission_rate NUMERIC(5, 4) DEFAULT 0,
  commission_rate_level1 NUMERIC(5, 4) DEFAULT 0,
  commission_rate_level2 NUMERIC(5, 4) DEFAULT 0,
  pending_withdrawal NUMERIC(20, 8) DEFAULT 0,
  total_withdrawn NUMERIC(20, 8) DEFAULT 0,
  team_size INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 表2：nodes - 节点表

```sql
CREATE TABLE nodes (
  id SERIAL PRIMARY KEY,
  node_id VARCHAR(100) UNIQUE NOT NULL,
  wallet_address VARCHAR(42) NOT NULL,
  node_type VARCHAR(20) CHECK (node_type IN ('cloud', 'image')),
  status VARCHAR(20) DEFAULT 'pending',
  purchase_price NUMERIC(20, 8),
  staking_amount NUMERIC(20, 8),
  staking_required_usd NUMERIC(20, 2),
  staking_status VARCHAR(20),
  total_earnings NUMERIC(20, 8) DEFAULT 0,
  cpu_cores INTEGER,
  memory_gb INTEGER,
  storage_gb INTEGER,
  cpu_usage_percentage NUMERIC(5, 2),
  memory_usage_percentage NUMERIC(5, 2),
  storage_used_percentage NUMERIC(5, 2),
  data_transferred_gb NUMERIC(20, 4),
  uptime_percentage NUMERIC(5, 2),
  is_transferable BOOLEAN DEFAULT true,
  tx_hash VARCHAR(66),
  install_command TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 表3：assigned_records - 设备分配记录表

```sql
CREATE TABLE assigned_records (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  device_id VARCHAR(100) NOT NULL,
  daily_income_ashva NUMERIC(20, 8) DEFAULT 0,
  daily_fine_ashva NUMERIC(20, 8) DEFAULT 0,
  net_income_ashva NUMERIC(20, 8) DEFAULT 0,
  daily_income_cny NUMERIC(20, 2) DEFAULT 0,
  daily_fine_cny NUMERIC(20, 2) DEFAULT 0,
  daily_flow_gb NUMERIC(20, 4) DEFAULT 0,
  ashva_price_usd NUMERIC(20, 8),
  cny_to_usd_rate NUMERIC(10, 4),
  price_source VARCHAR(50),
  record_date DATE NOT NULL,
  assigned_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(wallet_address, device_id, record_date)
);
```

#### 表4：hierarchy - 层级关系表

```sql
CREATE TABLE hierarchy (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  parent_wallet VARCHAR(42) NOT NULL,
  level INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(wallet_address, parent_wallet, level)
);
```

#### 表5：commission_distribution - 佣金分配配置表

```sql
CREATE TABLE commission_distribution (
  id SERIAL PRIMARY KEY,
  from_wallet VARCHAR(42) NOT NULL,
  to_wallet VARCHAR(42) NOT NULL,
  level INTEGER NOT NULL,
  percentage NUMERIC(5, 4) NOT NULL,
  rate NUMERIC(5, 4) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(from_wallet, to_wallet, level)
);
```

#### 表6：commission_records - 佣金记录表

```sql
CREATE TABLE commission_records (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  from_wallet VARCHAR(42) NOT NULL,
  amount NUMERIC(20, 8) NOT NULL,
  commission_level INTEGER NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 表7：member_level_config - 会员等级配置表

```sql
CREATE TABLE member_level_config (
  id SERIAL PRIMARY KEY,
  level_name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  max_depth INTEGER NOT NULL,
  commission_total_percentage NUMERIC(5, 4) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 表8：node_listings - 节点转让挂单表

```sql
CREATE TABLE node_listings (
  id SERIAL PRIMARY KEY,
  listing_id VARCHAR(100) UNIQUE NOT NULL,
  node_id VARCHAR(100) NOT NULL,
  seller_wallet VARCHAR(42) NOT NULL,
  buyer_wallet VARCHAR(42),
  asking_price NUMERIC(20, 8) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  sold_at TIMESTAMP
);
```

#### 表9：withdrawal_records - 提现记录表

```sql
CREATE TABLE withdrawal_records (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  amount NUMERIC(20, 8) NOT NULL,
  amount_usd NUMERIC(20, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  tx_hash VARCHAR(66),
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);
```

#### 表10：staking_records - 质押记录表

```sql
CREATE TABLE staking_records (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  node_id VARCHAR(100) NOT NULL,
  staked_amount NUMERIC(20, 8) NOT NULL,
  staked_amount_usd NUMERIC(20, 2) NOT NULL,
  lock_period_days INTEGER NOT NULL,
  unlock_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  rewards_earned NUMERIC(20, 8) DEFAULT 0,
  stake_tx_hash VARCHAR(66),
  unstake_tx_hash VARCHAR(66),
  created_at TIMESTAMP DEFAULT NOW(),
  unstaked_at TIMESTAMP
);
```

---

## 2. 认证与授权

### 2.1 JWT Token 认证

所有API（除了登录接口）都需要在请求头中携带JWT Token：

```
Authorization: Bearer <jwt_token>
```

### 2.2 Token 生成

```typescript
import jwt from 'jsonwebtoken'

function generateToken(walletAddress: string): string {
  return jwt.sign(
    { 
      wallet: walletAddress,
      exp: Math.floor(Date.now() / 1000) + 24 * 3600 
    },
    process.env.JWT_SECRET!
  )
}
```

### 2.3 Token 验证中间件

```typescript
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized: No token provided' 
    })
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { wallet: string }
    req.user = { wallet: decoded.wallet }
    next()
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized: Invalid token' 
    })
  }
}
```

---

## 3. API 接口规范

### 3.1 用户认证与钱包管理

#### 3.1.1 钱包连接验证

**接口：** `POST /api/v1/wallet/connect`

**优先级：** ⭐⭐⭐ 必须最先实现

**功能：** 验证钱包签名，检查ASHVA余额，生成JWT Token

**请求参数：**

```typescript
{
  walletAddress: string    // 钱包地址
  signature?: string       // 钱包签名（可选）
  message?: string         // 签名消息（可选）
}
```

**业务逻辑：**

1. 验证钱包地址格式（0x开头，42位）
2. 查询链上ASHVA余额
3. 检查数据库中是否存在该钱包记录
4. 如果不存在，创建新记录
5. 生成JWT Token返回

**SQL查询：**

```sql
-- 检查钱包是否存在
SELECT * FROM wallets WHERE LOWER(wallet_address) = LOWER($1)

-- 如果不存在，创建新钱包
INSERT INTO wallets (wallet_address, ashva_balance, member_level, created_at)
VALUES ($1, $2, 'free', NOW())
RETURNING *
```

**链上余额查询：**

```typescript
import { ethers } from 'ethers'

async function getAshvaBalance(walletAddress: string): Promise<number> {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
  const contract = new ethers.Contract(
    process.env.ASHVA_CONTRACT_ADDRESS!,
    ['function balanceOf(address) view returns (uint256)'],
    provider
  )
  
  const balance = await contract.balanceOf(walletAddress)
  return parseFloat(ethers.formatUnits(balance, 18))
}
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    token: string              // JWT Token
    wallet: {
      address: string
      ashvaBalance: number
      memberLevel: string
      totalEarnings: number
      createdAt: string
    }
  }
}
```

**完整实现代码：**

```typescript
// controllers/walletController.ts
export async function connectWallet(req: Request, res: Response) {
  try {
    const { walletAddress, signature, message } = req.body
    
    // 1. 验证钱包地址格式
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      })
    }
    
    // 2. 查询链上ASHVA余额
    const ashvaBalance = await getAshvaBalance(walletAddress)
    
    // 3. 查询或创建钱包记录
    let wallet = await sql`
      SELECT * FROM wallets 
      WHERE LOWER(wallet_address) = LOWER(${walletAddress})
    `
    
    if (wallet.length === 0) {
      // 创建新钱包
      wallet = await sql`
        INSERT INTO wallets (
          wallet_address, 
          ashva_balance, 
          member_level, 
          created_at
        )
        VALUES (${walletAddress}, ${ashvaBalance}, 'free', NOW())
        RETURNING *
      `
    } else {
      // 更新余额
      wallet = await sql`
        UPDATE wallets 
        SET ashva_balance = ${ashvaBalance}, updated_at = NOW()
        WHERE LOWER(wallet_address) = LOWER(${walletAddress})
        RETURNING *
      `
    }
    
    // 4. 生成JWT Token
    const token = generateToken(walletAddress)
    
    // 5. 返回响应
    res.json({
      success: true,
      data: {
        token,
        wallet: {
          address: wallet[0].wallet_address,
          ashvaBalance: parseFloat(wallet[0].ashva_balance),
          memberLevel: wallet[0].member_level,
          totalEarnings: parseFloat(wallet[0].total_earnings),
          createdAt: wallet[0].created_at
        }
      }
    })
    
  } catch (error) {
    console.error('Connect wallet error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to connect wallet'
    })
  }
}
```

---

#### 3.1.2 验证ASHVA余额

**接口：** `GET /api/v1/wallet/verify-ashva`

**优先级：** ⭐⭐⭐

**功能：** 验证钱包的链上ASHVA余额

**请求参数：**

```
Query: wallet=0x...
```

**业务逻辑：**

1. 查询链上ASHVA合约余额
2. 与数据库记录对比
3. 如果差异超过阈值，更新数据库

**SQL查询：**

```sql
UPDATE wallets 
SET ashva_balance = $1, updated_at = NOW()
WHERE LOWER(wallet_address) = LOWER($2)
RETURNING *
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    walletAddress: string
    ashvaBalance: number       // 链上余额
    lastUpdated: string
  }
}
```

**完整实现：**

```typescript
export async function verifyAshvaBalance(req: Request, res: Response) {
  try {
    const { wallet } = req.query
    
    if (!wallet || !ethers.isAddress(wallet as string)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      })
    }
    
    // 查询链上余额
    const ashvaBalance = await getAshvaBalance(wallet as string)
    
    // 更新数据库
    const result = await sql`
      UPDATE wallets 
      SET ashva_balance = ${ashvaBalance}, updated_at = NOW()
      WHERE LOWER(wallet_address) = LOWER(${wallet})
      RETURNING *
    `
    
    res.json({
      success: true,
      data: {
        walletAddress: wallet,
        ashvaBalance: ashvaBalance,
        lastUpdated: result[0]?.updated_at || new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Verify ASHVA balance error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to verify balance'
    })
  }
}
```

---

#### 3.1.3 获取钱包基本信息

**接口：** `GET /api/v1/wallet/info`

**优先级：** ⭐⭐

**功能：** 获取钱包基本信息（不含团队和收益）

**请求参数：**

```
Query: wallet=0x...
```

**SQL查询：**

```sql
SELECT 
  wallet_address,
  ashva_balance,
  member_level,
  parent_wallet,
  team_size,
  created_at
FROM wallets
WHERE LOWER(wallet_address) = LOWER($1)
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    address: string
    ashvaBalance: number
    memberLevel: string
    parentWallet: string | null
    teamSize: number
    createdAt: string
  }
}
```

---

#### 3.1.4 获取推荐人状态

**接口：** `GET /api/v1/wallet/referral-status`

**优先级：** ⭐⭐

**功能：** 查询钱包的推荐人关系状态

**请求参数：**

```
Query: wallet=0x...
```

**SQL查询：**

```sql
SELECT 
  wallet_address,
  parent_wallet,
  member_level
FROM wallets
WHERE LOWER(wallet_address) = LOWER($1)
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    hasReferrer: boolean
    referrerAddress: string | null
    canSetReferrer: boolean
    memberLevel: string
  }
}
```

**业务规则：**

- 如果 `parent_wallet` 为空，可以设置推荐人
- 如果已有推荐人，不可修改

---

#### 3.1.5 更新推荐人关系

**接口：** `POST /api/v1/wallet/update-referral`

**优先级：** ⭐⭐

**功能：** 设置或更新钱包的推荐人

**请求参数：**

```typescript
{
  walletAddress: string      // 当前用户钱包
  referrerAddress: string    // 推荐人钱包
}
```

**业务逻辑：**

1. 验证两个钱包地址不相同
2. 验证推荐人钱包存在
3. 验证当前钱包尚未设置推荐人
4. 更新推荐关系
5. 创建层级关系记录
6. 更新推荐人的团队人数

**SQL查询：**

```sql
-- 1. 检查推荐人是否存在
SELECT * FROM wallets WHERE LOWER(wallet_address) = LOWER($1)

-- 2. 检查当前钱包是否已有推荐人
SELECT parent_wallet FROM wallets WHERE LOWER(wallet_address) = LOWER($1)

-- 3. 更新推荐关系
UPDATE wallets 
SET parent_wallet = $1, updated_at = NOW()
WHERE LOWER(wallet_address) = LOWER($2)

-- 4. 插入层级关系
INSERT INTO hierarchy (wallet_address, parent_wallet, level)
VALUES ($1, $2, 1)

-- 5. 更新推荐人团队人数
UPDATE wallets 
SET team_size = team_size + 1, updated_at = NOW()
WHERE LOWER(wallet_address) = LOWER($1)
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    message: string
    wallet: {
      address: string
      parentWallet: string
      updatedAt: string
    }
  }
}
```

**完整实现：**

```typescript
export async function updateReferral(req: Request, res: Response) {
  try {
    const { walletAddress, referrerAddress } = req.body
    
    // 1. 验证地址
    if (!ethers.isAddress(walletAddress) || !ethers.isAddress(referrerAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      })
    }
    
    if (walletAddress.toLowerCase() === referrerAddress.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot refer yourself'
      })
    }
    
    // 2. 检查推荐人是否存在
    const referrer = await sql`
      SELECT * FROM wallets 
      WHERE LOWER(wallet_address) = LOWER(${referrerAddress})
    `
    
    if (referrer.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Referrer wallet not found'
      })
    }
    
    // 3. 检查当前钱包是否已有推荐人
    const current = await sql`
      SELECT parent_wallet FROM wallets 
      WHERE LOWER(wallet_address) = LOWER(${walletAddress})
    `
    
    if (current.length > 0 && current[0].parent_wallet) {
      return res.status(400).json({
        success: false,
        error: 'Referrer already set'
      })
    }
    
    // 4. 更新推荐关系
    const updated = await sql`
      UPDATE wallets 
      SET parent_wallet = ${referrerAddress}, updated_at = NOW()
      WHERE LOWER(wallet_address) = LOWER(${walletAddress})
      RETURNING *
    `
    
    // 5. 插入层级关系
    await sql`
      INSERT INTO hierarchy (wallet_address, parent_wallet, level, created_at)
      VALUES (${walletAddress}, ${referrerAddress}, 1, NOW())
      ON CONFLICT DO NOTHING
    `
    
    // 6. 更新推荐人团队人数
    await sql`
      UPDATE wallets 
      SET team_size = team_size + 1, updated_at = NOW()
      WHERE LOWER(wallet_address) = LOWER(${referrerAddress})
    `
    
    res.json({
      success: true,
      data: {
        message: 'Referrer updated successfully',
        wallet: {
          address: updated[0].wallet_address,
          parentWallet: updated[0].parent_wallet,
          updatedAt: updated[0].updated_at
        }
      }
    })
    
  } catch (error) {
    console.error('Update referral error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update referrer'
    })
  }
}
```

---

#### 3.1.6 同步钱包数据

**接口：** `POST /api/v1/wallet/sync`

**优先级：** ⭐ 管理员功能

**功能：** 从区块链同步钱包数据到数据库

**请求参数：**

```typescript
{
  walletAddress: string
}
```

**业务逻辑：**

1. 查询链上ASHVA余额
2. 查询节点总收益
3. 更新数据库记录

**响应格式：**

```typescript
{
  success: true,
  data: {
    message: string
    syncedData: {
      ashvaBalance: number
      totalEarnings: number
      lastSynced: string
    }
  }
}
```

---

### 3.2 会员信息管理

#### 3.2.1 获取会员完整信息

**接口：** `GET /api/v1/members/:wallet`

**优先级：** ⭐⭐⭐

**功能：** 获取会员的完整信息（余额、等级、收益、团队等）

**请求参数：**

```
Path: wallet (钱包地址)
```

**业务逻辑：**

1. 查询钱包基本信息
2. 查询节点总收益
3. 查询佣金收益
4. 查询团队人数
5. 计算总收益（节点收益 + 佣金）

**SQL查询：**

```sql
-- 1. 钱包基本信息
SELECT * FROM wallets WHERE LOWER(wallet_address) = LOWER($1)

-- 2. 节点总收益
SELECT COALESCE(SUM(total_income), 0) as total_node_income
FROM assigned_records ar
INNER JOIN nodes n ON ar.node_id = n.node_id
WHERE LOWER(n.wallet_address) = LOWER($1)

-- 3. 佣金总收益（从wallets表的total_earnings获取）
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    wallet: {
      address: string
      ashvaBalance: number
      memberLevel: string
      parentWallet: string | null
      teamSize: number
      createdAt: string
    },
    earnings: {
      totalEarnings: number         // 总收益
      nodeIncome: number            // 节点收益
      commissionIncome: number      // 佣金收益
      distributableCommission: number  // 可分配佣金
      distributedCommission: number    // 已分配佣金
    },
    withdrawal: {
      totalWithdrawn: number
      pendingWithdrawal: number
    }
  }
}
```

**完整实现：**

```typescript
export async function getMemberInfo(req: Request, res: Response) {
  try {
    const { wallet } = req.params
    
    if (!ethers.isAddress(wallet)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      })
    }
    
    // 1. 查询钱包信息
    const walletInfo = await sql`
      SELECT * FROM wallets 
      WHERE LOWER(wallet_address) = LOWER(${wallet})
    `
    
    if (walletInfo.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      })
    }
    
    // 2. 查询节点收益
    const nodeIncome = await sql`
      SELECT COALESCE(SUM(n.total_earnings), 0) as total
      FROM nodes n
      WHERE LOWER(n.wallet_address) = LOWER(${wallet})
    `
    
    const w = walletInfo[0]
    
    res.json({
      success: true,
      data: {
        wallet: {
          address: w.wallet_address,
          ashvaBalance: parseFloat(w.ashva_balance),
          memberLevel: w.member_level,
          parentWallet: w.parent_wallet,
          teamSize: w.team_size,
          createdAt: w.created_at
        },
        earnings: {
          totalEarnings: parseFloat(w.total_earnings),
          nodeIncome: parseFloat(nodeIncome[0].total),
          commissionIncome: parseFloat(w.total_earnings) - parseFloat(nodeIncome[0].total),
          distributableCommission: parseFloat(w.distributable_commission),
          distributedCommission: parseFloat(w.distributed_commission)
        },
        withdrawal: {
          totalWithdrawn: parseFloat(w.total_withdrawn),
          pendingWithdrawal: parseFloat(w.pending_withdrawal)
        }
      }
    })
    
  } catch (error) {
    console.error('Get member info error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get member info'
    })
  }
}
```

---

#### 3.2.2 获取直推团队列表

**接口：** `GET /api/v1/members/:wallet/team`

**优先级：** ⭐⭐⭐

**功能：** 获取钱包的直推团队成员列表

**SQL查询：**

```sql
SELECT 
  wallet_address,
  ashva_balance,
  member_level,
  total_earnings,
  team_size,
  created_at
FROM wallets
WHERE LOWER(parent_wallet) = LOWER($1)
ORDER BY created_at DESC
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    total: number
    members: Array<{
      address: string
      ashvaBalance: number
      memberLevel: string
      totalEarnings: number
      teamSize: number
      joinedAt: string
    }>
  }
}
```

---

#### 3.2.3 获取全局团队（多级）

**接口：** `GET /api/v1/members/:wallet/global-team`

**优先级：** ⭐⭐⭐

**功能：** 获取钱包的全部下级团队（递归查询）

**SQL查询（使用递归CTE）：**

```sql
WITH RECURSIVE team_tree AS (
  -- 基础查询：直推成员
  SELECT 
    wallet_address,
    parent_wallet,
    ashva_balance,
    member_level,
    total_earnings,
    team_size,
    1 as level,
    created_at
  FROM wallets
  WHERE LOWER(parent_wallet) = LOWER($1)
  
  UNION ALL
  
  -- 递归查询：下级成员
  SELECT 
    w.wallet_address,
    w.parent_wallet,
    w.ashva_balance,
    w.member_level,
    w.total_earnings,
    w.team_size,
    tt.level + 1,
    w.created_at
  FROM wallets w
  INNER JOIN team_tree tt ON LOWER(w.parent_wallet) = LOWER(tt.wallet_address)
  WHERE tt.level < 10  -- 限制最大层级
)
SELECT * FROM team_tree ORDER BY level, created_at
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    total: number
    totalByLevel: {
      level1: number
      level2: number
      level3: number
      // ...
    },
    members: Array<{
      address: string
      parentWallet: string
      level: number
      ashvaBalance: number
      memberLevel: string
      totalEarnings: number
      teamSize: number
      joinedAt: string
    }>
  }
}
```

---

#### 3.2.4 获取层级关系树

**接口：** `GET /api/v1/members/:wallet/hierarchy`

**优先级：** ⭐⭐

**功能：** 获取完整的层级关系树结构

**SQL查询：**

```sql
SELECT * FROM hierarchy
WHERE LOWER(wallet_address) = LOWER($1)
ORDER BY level ASC
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    hierarchy: Array<{
      walletAddress: string
      parentWallet: string
      level: number
      createdAt: string
    }>
  }
}
```

---

#### 3.2.5 获取会员列表（分页）

**接口：** `GET /api/v1/members/list`

**优先级：** ⭐⭐ 管理后台使用

**请求参数：**

```
Query: 
  page=1
  limit=20
  level=free|node_owner|partner|global_partner
  sortBy=created_at|ashva_balance|total_earnings
  order=asc|desc
```

**SQL查询：**

```sql
SELECT 
  wallet_address,
  ashva_balance,
  member_level,
  total_earnings,
  team_size,
  created_at
FROM wallets
WHERE ($1::text IS NULL OR member_level = $1)
ORDER BY 
  CASE WHEN $2 = 'ashva_balance' THEN ashva_balance END DESC,
  CASE WHEN $2 = 'total_earnings' THEN total_earnings END DESC,
  CASE WHEN $2 = 'created_at' THEN created_at END DESC
LIMIT $3 OFFSET $4
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    total: number
    page: number
    limit: number
    members: Array<{
      address: string
      ashvaBalance: number
      memberLevel: string
      totalEarnings: number
      teamSize: number
      createdAt: string
    }>
  }
}
```

---

#### 3.2.6 获取会员统计数据

**接口：** `GET /api/v1/members/stats`

**优先级：** ⭐⭐

**SQL查询：**

```sql
SELECT 
  COUNT(*) as total_members,
  COUNT(*) FILTER (WHERE member_level = 'free') as free_count,
  COUNT(*) FILTER (WHERE member_level = 'node_owner') as node_owner_count,
  COUNT(*) FILTER (WHERE member_level = 'partner') as partner_count,
  COUNT(*) FILTER (WHERE member_level = 'global_partner') as global_partner_count,
  SUM(ashva_balance) as total_ashva,
  SUM(total_earnings) as total_earnings
FROM wallets
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    totalMembers: number
    byLevel: {
      free: number
      nodeOwner: number
      partner: number
      globalPartner: number
    },
    totalAshva: number
    totalEarnings: number
  }
}
```

---

#### 3.2.7 按等级筛选会员

**接口：** `GET /api/v1/members/by-level`

**优先级：** ⭐

**请求参数：**

```
Query: level=free|node_owner|partner|global_partner
```

**SQL查询：**

```sql
SELECT * FROM wallets
WHERE member_level = $1
ORDER BY created_at DESC
```

---

#### 3.2.8 获取用户设备列表

**接口：** `GET /api/v1/members/:wallet/devices`

**优先级：** ⭐⭐⭐

**功能：** 获取用户的所有设备及其收益信息

**SQL查询：**

```sql
SELECT 
  ar.id,
  ar.device_id,
  ar.daily_income_ashva,
  ar.daily_fine_ashva,
  ar.net_income_ashva,
  ar.daily_flow_gb,
  ar.record_date,
  ar.assigned_at,
  n.node_id,
  n.node_type,
  n.status,
  n.total_earnings
FROM assigned_records ar
INNER JOIN nodes n ON ar.device_id = n.node_id
WHERE LOWER(ar.wallet_address) = LOWER($1)
ORDER BY ar.record_date DESC
LIMIT 100
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    total: number
    devices: Array<{
      id: number
      deviceId: string
      nodeId: string
      nodeType: string
      status: string
      dailyIncomeAshva: number
      dailyFineAshva: number
      netIncomeAshva: number
      dailyFlowGb: number
      totalEarnings: number
      recordDate: string
      assignedAt: string
    }>
  }
}
```

---

#### 3.2.9 获取团队详细数据

**接口：** `GET /api/v1/members/:wallet/team-details`

**优先级：** ⭐⭐

**功能：** 获取团队的详细统计和层级分布

**业务逻辑：**

1. 统计各层级人数
2. 统计各层级总收益
3. 统计各层级节点数

**SQL查询：**

```sql
WITH team_stats AS (
  SELECT 
    h.level,
    COUNT(*) as member_count,
    SUM(w.total_earnings) as total_earnings,
    (SELECT COUNT(*) FROM nodes n WHERE LOWER(n.wallet_address) = LOWER(w.wallet_address)) as node_count
  FROM hierarchy h
  INNER JOIN wallets w ON LOWER(h.wallet_address) = LOWER(w.wallet_address)
  WHERE LOWER(h.parent_wallet) = LOWER($1)
  GROUP BY h.level
)
SELECT * FROM team_stats ORDER BY level
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    totalMembers: number
    totalEarnings: number
    byLevel: Array<{
      level: number
      memberCount: number
      totalEarnings: number
      nodeCount: number
    }>
  }
}
```

---

### 3.3 节点管理

#### 3.3.1 获取用户节点列表

**接口：** `GET /api/v1/nodes`

**优先级：** ⭐⭐⭐

**请求参数：**

```
Query: 
  wallet=0x...
  type=cloud|image
  status=pending|active|inactive
```

**SQL查询：**

```sql
SELECT 
  node_id,
  node_type,
  status,
  purchase_price,
  staking_amount,
  staking_status,
  total_earnings,
  cpu_cores,
  memory_gb,
  storage_gb,
  is_transferable,
  created_at
FROM nodes
WHERE LOWER(wallet_address) = LOWER($1)
  AND ($2::text IS NULL OR node_type = $2)
  AND ($3::text IS NULL OR status = $3)
ORDER BY created_at DESC
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    total: number
    nodes: Array<{
      nodeId: string
      nodeType: string
      status: string
      purchasePrice: number
      stakingAmount: number
      stakingStatus: string
      totalEarnings: number
      specs: {
        cpuCores: number
        memoryGb: number
        storageGb: number
      },
      isTransferable: boolean
      createdAt: string
    }>
  }
}
```

---

#### 3.3.2 获取单个节点详情

**接口：** `GET /api/v1/nodes/:nodeId`

**优先级：** ⭐⭐⭐

**SQL查询：**

```sql
SELECT * FROM nodes WHERE node_id = $1
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    nodeId: string
    walletAddress: string
    nodeType: string
    status: string
    purchasePrice: number
    stakingAmount: number
    stakingRequiredUsd: number
    stakingStatus: string
    totalEarnings: number
    specs: {
      cpuCores: number
      memoryGb: number
      storageGb: number
      cpuUsage: number
      memoryUsage: number
      storageUsed: number
    },
    performance: {
      dataTransferredGb: number
      uptimePercentage: number
    },
    txHash: string
    installCommand: string
    isTransferable: boolean
    createdAt: string
    updatedAt: string
  }
}
```

---

#### 3.3.3 更新节点状态

**接口：** `PUT /api/v1/nodes/:nodeId/status`

**优先级：** ⭐⭐ 管理员功能

**请求参数：**

```typescript
{
  status: string  // pending|active|inactive|maintenance
}
```

**SQL查询：**

```sql
UPDATE nodes
SET status = $1, updated_at = NOW()
WHERE node_id = $2
RETURNING *
```

---

#### 3.3.4 购买云节点

**接口：** `POST /api/v1/purchases/cloud-node`

**优先级：** ⭐⭐⭐

**请求参数：**

```typescript
{
  walletAddress: string
  nodeType: string        // 例如：basic|standard|premium
  paymentTxHash: string   // 支付交易哈希
  stakingAmount: number   // 质押金额
}
```

**业务逻辑：**

1. 验证支付交易（可选）
2. 生成唯一的node_id
3. 创建节点记录
4. 创建质押记录
5. 生成安装命令

**SQL查询：**

```sql
-- 1. 插入节点记录
INSERT INTO nodes (
  node_id,
  wallet_address,
  node_type,
  status,
  purchase_price,
  staking_amount,
  staking_status,
  cpu_cores,
  memory_gb,
  storage_gb,
  tx_hash,
  install_command,
  created_at
)
VALUES ($1, $2, 'cloud', 'pending', $3, $4, 'pending', $5, $6, $7, $8, $9, NOW())
RETURNING *

-- 2. 插入质押记录
INSERT INTO staking_records (
  wallet_address,
  node_id,
  staked_amount,
  staked_amount_usd,
  lock_period_days,
  unlock_date,
  status,
  stake_tx_hash,
  created_at
)
VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, NOW())
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    message: string
    node: {
      nodeId: string
      nodeType: string
      status: string
      purchasePrice: number
      stakingAmount: number
      installCommand: string
      createdAt: string
    }
  }
}
```

**完整实现：**

```typescript
export async function purchaseCloudNode(req: Request, res: Response) {
  try {
    const { walletAddress, nodeType, paymentTxHash, stakingAmount } = req.body
    
    // 1. 验证参数
    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      })
    }
    
    // 2. 生成节点ID
    const nodeId = `CN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // 3. 根据节点类型确定配置
    const nodeConfigs = {
      basic: { cpu: 2, memory: 4, storage: 100, price: 100 },
      standard: { cpu: 4, memory: 8, storage: 200, price: 200 },
      premium: { cpu: 8, memory: 16, storage: 500, price: 500 }
    }
    
    const config = nodeConfigs[nodeType] || nodeConfigs.basic
    
    // 4. 生成安装命令
    const installCommand = `curl -sSL https://install.yourplatform.com/node.sh | bash -s -- ${nodeId}`
    
    // 5. 插入节点记录
    const node = await sql`
      INSERT INTO nodes (
        node_id,
        wallet_address,
        node_type,
        status,
        purchase_price,
        staking_amount,
        staking_status,
        cpu_cores,
        memory_gb,
        storage_gb,
        tx_hash,
        install_command,
        created_at
      )
      VALUES (
        ${nodeId},
        ${walletAddress},
        'cloud',
        'pending',
        ${config.price},
        ${stakingAmount},
        'pending',
        ${config.cpu},
        ${config.memory},
        ${config.storage},
        ${paymentTxHash},
        ${installCommand},
        NOW()
      )
      RETURNING *
    `
    
    // 6. 插入质押记录
    const unlockDate = new Date()
    unlockDate.setDate(unlockDate.getDate() + 90) // 90天锁定期
    
    await sql`
      INSERT INTO staking_records (
        wallet_address,
        node_id,
        staked_amount,
        staked_amount_usd,
        lock_period_days,
        unlock_date,
        status,
        stake_tx_hash,
        created_at
      )
      VALUES (
        ${walletAddress},
        ${nodeId},
        ${stakingAmount},
        ${stakingAmount * 0.5},
        90,
        ${unlockDate.toISOString()},
        'active',
        ${paymentTxHash},
        NOW()
      )
    `
    
    res.json({
      success: true,
      data: {
        message: 'Cloud node purchased successfully',
        node: {
          nodeId: node[0].node_id,
          nodeType: node[0].node_type,
          status: node[0].status,
          purchasePrice: parseFloat(node[0].purchase_price),
          stakingAmount: parseFloat(node[0].staking_amount),
          installCommand: node[0].install_command,
          createdAt: node[0].created_at
        }
      }
    })
    
  } catch (error) {
    console.error('Purchase cloud node error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to purchase cloud node'
    })
  }
}
```

---

#### 3.3.5 购买镜像节点

**接口：** `POST /api/v1/purchases/image-node`

**优先级：** ⭐⭐⭐

**请求参数：**

```typescript
{
  walletAddress: string
  imageType: string       // 例如：windows|linux|custom
  paymentTxHash: string
  stakingAmount: number
}
```

**业务逻辑：** 与云节点类似，但 `node_type` 为 'image'

**SQL查询：**

```sql
INSERT INTO nodes (
  node_id,
  wallet_address,
  node_type,
  status,
  purchase_price,
  staking_amount,
  tx_hash,
  created_at
)
VALUES ($1, $2, 'image', 'pending', $3, $4, $5, NOW())
RETURNING *
```

---

#### 3.3.6 获取购买记录

**接口：** `GET /api/v1/purchases/list`

**优先级：** ⭐⭐

**请求参数：**

```
Query: 
  wallet=0x...
  type=cloud|image
  limit=20
  offset=0
```

**SQL查询：**

```sql
SELECT 
  node_id,
  node_type,
  purchase_price,
  staking_amount,
  status,
  tx_hash,
  created_at
FROM nodes
WHERE LOWER(wallet_address) = LOWER($1)
  AND ($2::text IS NULL OR node_type = $2)
ORDER BY created_at DESC
LIMIT $3 OFFSET $4
```

---

#### 3.3.7 获取购买统计

**接口：** `GET /api/v1/purchases/summary`

**优先级：** ⭐⭐

**SQL查询：**

```sql
SELECT 
  COUNT(*) as total_purchases,
  COUNT(*) FILTER (WHERE node_type = 'cloud') as cloud_count,
  COUNT(*) FILTER (WHERE node_type = 'image') as image_count,
  SUM(purchase_price) as total_spent,
  SUM(staking_amount) as total_staked
FROM nodes
WHERE LOWER(wallet_address) = LOWER($1)
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    totalPurchases: number
    cloudNodeCount: number
    imageNodeCount: number
    totalSpent: number
    totalStaked: number
  }
}
```

---

#### 3.3.8 处理支付回调

**接口：** `POST /api/v1/purchases/webhook`

**优先级：** ⭐

**功能：** 接收支付网关的回调通知

**请求参数：**

```typescript
{
  txHash: string
  amount: number
  status: string
  nodeId?: string
}
```

**业务逻辑：**

1. 验证回调签名（可选）
2. 更新节点状态
3. 触发节点激活流程

---

#### 3.3.9 云节点列表（管理员）

**接口：** `GET /api/v1/cloud-nodes/list`

**优先级：** ⭐⭐ 管理后台

**SQL查询：**

```sql
SELECT 
  n.*,
  w.wallet_address as owner_address,
  w.member_level
FROM nodes n
LEFT JOIN wallets w ON LOWER(n.wallet_address) = LOWER(w.wallet_address)
WHERE node_type = 'cloud'
ORDER BY created_at DESC
LIMIT $1 OFFSET $2
```

---

#### 3.3.10 调试购买流程

**接口：** `GET /api/v1/cloud-node-purchases/debug`

**优先级：** ⭐ 开发调试

**功能：** 返回购买流程的调试信息

---

#### 3.3.11 健康检查

**接口：** `GET /api/v1/cloud-node-purchases/health`

**优先级：** ⭐ 监控

**响应格式：**

```typescript
{
  success: true,
  data: {
    status: "healthy",
    timestamp: string
  }
}
```

---

#### 3.3.12 同步节点数据

**接口：** `POST /api/v1/sync/node-data`

**优先级：** ⭐⭐

**功能：** 从外部系统同步节点状态和收益数据

**请求参数：**

```typescript
{
  nodeId: string
  status?: string
  totalEarnings?: number
  cpuUsage?: number
  memoryUsage?: number
  storageUsed?: number
  dataTransferred?: number
  uptime?: number
}
```

**SQL查询：**

```sql
UPDATE nodes
SET 
  status = COALESCE($1, status),
  total_earnings = COALESCE($2, total_earnings),
  cpu_usage_percentage = COALESCE($3, cpu_usage_percentage),
  memory_usage_percentage = COALESCE($4, memory_usage_percentage),
  storage_used_percentage = COALESCE($5, storage_used_percentage),
  data_transferred_gb = COALESCE($6, data_transferred_gb),
  uptime_percentage = COALESCE($7, uptime_percentage),
  updated_at = NOW()
WHERE node_id = $8
RETURNING *
```

---

### 3.4 设备与收益记录

#### 3.4.1 获取设备分配记录

**接口：** `GET /api/v1/assigned-records`

**优先级：** ⭐⭐⭐

**请求参数：**

```
Query:
  wallet=0x...
  startDate=2024-01-01
  endDate=2024-12-31
  limit=100
  offset=0
```

**SQL查询：**

```sql
SELECT 
  id,
  device_id,
  daily_income_ashva,
  daily_fine_ashva,
  net_income_ashva,
  daily_income_cny,
  daily_fine_cny,
  daily_flow_gb,
  ashva_price_usd,
  record_date,
  assigned_at
FROM assigned_records
WHERE LOWER(wallet_address) = LOWER($1)
  AND ($2::date IS NULL OR record_date >= $2)
  AND ($3::date IS NULL OR record_date <= $3)
ORDER BY record_date DESC, device_id
LIMIT $4 OFFSET $5
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    total: number
    records: Array<{
      id: number
      deviceId: string
      dailyIncomeAshva: number
      dailyFineAshva: number
      netIncomeAshva: number
      dailyIncomeCny: number
      dailyFineCny: number
      dailyFlowGb: number
      ashvaPriceUsd: number
      recordDate: string
      assignedAt: string
    }>
  }
}
```

---

#### 3.4.2 获取收益汇总

**接口：** `GET /api/v1/assigned-records/summary`

**优先级：** ⭐⭐

**请求参数：**

```
Query:
  wallet=0x...
  startDate=2024-01-01
  endDate=2024-12-31
```

**SQL查询：**

```sql
SELECT 
  COUNT(DISTINCT device_id) as device_count,
  COUNT(DISTINCT record_date) as day_count,
  SUM(daily_income_ashva) as total_income,
  SUM(daily_fine_ashva) as total_fines,
  SUM(net_income_ashva) as total_net_income,
  SUM(daily_flow_gb) as total_flow,
  AVG(ashva_price_usd) as avg_price
FROM assigned_records
WHERE LOWER(wallet_address) = LOWER($1)
  AND record_date >= $2
  AND record_date <= $3
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    deviceCount: number
    dayCount: number
    totalIncome: number
    totalFines: number
    totalNetIncome: number
    totalFlowGb: number
    avgPriceUsd: number
  }
}
```

---

#### 3.4.3 同步设备记录

**接口：** `POST /api/v1/assigned-records/sync`

**优先级：** ⭐⭐

**功能：** 从外部系统同步设备收益数据

**请求参数：**

```typescript
{
  walletAddress: string
  deviceId: string
  recordDate: string
  dailyIncomeAshva: number
  dailyFineAshva: number
  dailyFlowGb: number
  ashvaPriceUsd: number
}
```

**SQL查询：**

```sql
INSERT INTO assigned_records (
  wallet_address,
  device_id,
  daily_income_ashva,
  daily_fine_ashva,
  net_income_ashva,
  daily_flow_gb,
  ashva_price_usd,
  record_date,
  created_at
)
VALUES ($1, $2, $3, $4, $3 - $4, $5, $6, $7, NOW())
ON CONFLICT (wallet_address, device_id, record_date)
DO UPDATE SET
  daily_income_ashva = EXCLUDED.daily_income_ashva,
  daily_fine_ashva = EXCLUDED.daily_fine_ashva,
  net_income_ashva = EXCLUDED.net_income_ashva,
  daily_flow_gb = EXCLUDED.daily_flow_gb,
  ashva_price_usd = EXCLUDED.ashva_price_usd,
  updated_at = NOW()
RETURNING *
```

---

#### 3.4.4 获取分配任务列表

**接口：** `GET /api/v1/assignments/list`

**优先级：** ⭐⭐

**功能：** 获取待分配或已分配的设备任务

---

#### 3.4.5 获取分配统计

**接口：** `GET /api/v1/assignments/stats`

**优先级：** ⭐

**SQL查询：**

```sql
SELECT 
  COUNT(DISTINCT device_id) as total_devices,
  COUNT(DISTINCT wallet_address) as total_wallets,
  SUM(net_income_ashva) as total_earnings
FROM assigned_records
WHERE record_date >= CURRENT_DATE - INTERVAL '30 days'
```

---

#### 3.4.6 客户设备查询

**接口：** `GET /api/v1/customer/devices`

**优先级：** ⭐⭐ 客服系统使用

**功能：** 客服人员查询用户设备信息

---

#### 3.4.7 删除分配记录

**接口：** `DELETE /api/v1/cloud-node-assignments/delete`

**优先级：** ⭐ 管理员功能

**请求参数：**

```typescript
{
  recordId: number
}
```

**SQL查询：**

```sql
DELETE FROM assigned_records WHERE id = $1
```

---

#### 3.4.8 同步设备状态

**接口：** `POST /api/v1/sync-device-status`

**优先级：** ⭐

**功能：** 定时任务同步设备在线状态

---

### 3.5 收益与佣金

#### 3.5.1 获取收益汇总

**接口：** `GET /api/v1/earnings/:wallet/summary`

**优先级：** ⭐⭐⭐

**功能：** 获取用户的完整收益汇总

**SQL查询：**

```sql
-- 1. 节点总收益
SELECT COALESCE(SUM(total_earnings), 0) as total_node_income
FROM nodes
WHERE LOWER(wallet_address) = LOWER($1)

-- 2. 佣金总收益
SELECT total_earnings FROM wallets
WHERE LOWER(wallet_address) = LOWER($1)

-- 3. 今日收益
SELECT COALESCE(SUM(net_income_ashva), 0) as today_income
FROM assigned_records
WHERE LOWER(wallet_address) = LOWER($1)
  AND record_date = CURRENT_DATE

-- 4. 本月收益
SELECT COALESCE(SUM(net_income_ashva), 0) as month_income
FROM assigned_records
WHERE LOWER(wallet_address) = LOWER($1)
  AND record_date >= DATE_TRUNC('month', CURRENT_DATE)
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    totalEarnings: number        // 总收益
    nodeIncome: number           // 节点收益
    commissionIncome: number     // 佣金收益
    todayIncome: number          // 今日收益
    monthIncome: number          // 本月收益
    availableBalance: number     // 可提现余额
  }
}
```

**完整实现：**

```typescript
export async function getEarningsSummary(req: Request, res: Response) {
  try {
    const { wallet } = req.params
    
    if (!ethers.isAddress(wallet)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      })
    }
    
    // 1. 节点总收益
    const nodeIncome = await sql`
      SELECT COALESCE(SUM(total_earnings), 0) as total
      FROM nodes
      WHERE LOWER(wallet_address) = LOWER(${wallet})
    `
    
    // 2. 钱包信息（包含佣金）
    const walletInfo = await sql`
      SELECT total_earnings, distributable_commission
      FROM wallets
      WHERE LOWER(wallet_address) = LOWER(${wallet})
    `
    
    if (walletInfo.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      })
    }
    
    // 3. 今日收益
    const todayIncome = await sql`
      SELECT COALESCE(SUM(net_income_ashva), 0) as total
      FROM assigned_records
      WHERE LOWER(wallet_address) = LOWER(${wallet})
        AND record_date = CURRENT_DATE
    `
    
    // 4. 本月收益
    const monthIncome = await sql`
      SELECT COALESCE(SUM(net_income_ashva), 0) as total
      FROM assigned_records
      WHERE LOWER(wallet_address) = LOWER(${wallet})
        AND record_date >= DATE_TRUNC('month', CURRENT_DATE)
    `
    
    const totalNodeIncome = parseFloat(nodeIncome[0].total)
    const totalEarnings = parseFloat(walletInfo[0].total_earnings)
    const commissionIncome = totalEarnings - totalNodeIncome
    
    res.json({
      success: true,
      data: {
        totalEarnings: totalEarnings,
        nodeIncome: totalNodeIncome,
        commissionIncome: commissionIncome,
        todayIncome: parseFloat(todayIncome[0].total),
        monthIncome: parseFloat(monthIncome[0].total),
        availableBalance: parseFloat(walletInfo[0].distributable_commission)
      }
    })
    
  } catch (error) {
    console.error('Get earnings summary error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get earnings summary'
    })
  }
}
```

---

#### 3.5.2 获取收益明细

**接口：** `GET /api/v1/earnings/:wallet/breakdown`

**优先级：** ⭐⭐

**功能：** 获取按日期、设备分组的收益明细

**SQL查询：**

```sql
SELECT 
  record_date,
  device_id,
  daily_income_ashva,
  daily_fine_ashva,
  net_income_ashva,
  daily_flow_gb
FROM assigned_records
WHERE LOWER(wallet_address) = LOWER($1)
  AND record_date >= $2
  AND record_date <= $3
ORDER BY record_date DESC, device_id
```

---

#### 3.5.3 获取佣金记录

**接口：** `GET /api/v1/commissions/:wallet`

**优先级：** ⭐⭐⭐

**功能：** 获取用户的佣金收入记录

**SQL查询：**

```sql
SELECT 
  id,
  from_wallet,
  amount,
  commission_level,
  transaction_type,
  created_at
FROM commission_records
WHERE LOWER(wallet_address) = LOWER($1)
ORDER BY created_at DESC
LIMIT $2 OFFSET $3
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    total: number
    records: Array<{
      id: number
      fromWallet: string
      amount: number
      commissionLevel: number
      transactionType: string
      createdAt: string
    }>
  }
}
```

---

#### 3.5.4 获取佣金详细

**接口：** `GET /api/v1/commissions/:wallet/details`

**优先级：** ⭐⭐

**功能：** 获取佣金的详细统计和分组

**SQL查询：**

```sql
SELECT 
  commission_level,
  COUNT(*) as record_count,
  SUM(amount) as total_amount
FROM commission_records
WHERE LOWER(wallet_address) = LOWER($1)
GROUP BY commission_level
ORDER BY commission_level
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    totalCommission: number
    byLevel: Array<{
      level: number
      recordCount: number
      totalAmount: number
    }>
  }
}
```

---

#### 3.5.5 获取佣金配置

**接口：** `GET /api/v1/commissions/:wallet/config`

**优先级：** ⭐⭐⭐

**功能：** 获取用户的佣金分配配置

**SQL查询：**

```sql
SELECT 
  to_wallet,
  level,
  percentage,
  rate,
  created_at,
  updated_at
FROM commission_distribution
WHERE LOWER(from_wallet) = LOWER($1)
ORDER BY level, to_wallet
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    configs: Array<{
      toWallet: string
      level: number
      percentage: number
      rate: number
      createdAt: string
      updatedAt: string
    }>
  }
}
```

---

#### 3.5.6 更新佣金配置

**接口：** `PUT /api/v1/commissions/:wallet/config`

**优先级：** ⭐⭐⭐

**功能：** 更新用户的佣金分配规则

**请求参数：**

```typescript
{
  configs: Array<{
    toWallet: string
    level: number
    percentage: number
    rate: number
  }>
}
```

**业务逻辑：**

1. 验证总百分比不超过100%
2. 验证目标钱包存在
3. 删除旧配置
4. 插入新配置

**SQL查询：**

```sql
-- 1. 删除旧配置
DELETE FROM commission_distribution
WHERE LOWER(from_wallet) = LOWER($1)

-- 2. 插入新配置
INSERT INTO commission_distribution (
  from_wallet,
  to_wallet,
  level,
  percentage,
  rate,
  created_at
)
VALUES ($1, $2, $3, $4, $5, NOW())
```

**完整实现：**

```typescript
export async function updateCommissionConfig(req: Request, res: Response) {
  try {
    const { wallet } = req.params
    const { configs } = req.body
    
    if (!ethers.isAddress(wallet)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      })
    }
    
    // 1. 验证总百分比
    const totalPercentage = configs.reduce((sum, c) => sum + c.percentage, 0)
    if (totalPercentage > 1) {
      return res.status(400).json({
        success: false,
        error: 'Total percentage cannot exceed 100%'
      })
    }
    
    // 2. 验证所有目标钱包存在
    for (const config of configs) {
      if (!ethers.isAddress(config.toWallet)) {
        return res.status(400).json({
          success: false,
          error: `Invalid wallet address: ${config.toWallet}`
        })
      }
      
      const exists = await sql`
        SELECT 1 FROM wallets 
        WHERE LOWER(wallet_address) = LOWER(${config.toWallet})
      `
      
      if (exists.length === 0) {
        return res.status(404).json({
          success: false,
          error: `Wallet not found: ${config.toWallet}`
        })
      }
    }
    
    // 3. 删除旧配置
    await sql`
      DELETE FROM commission_distribution
      WHERE LOWER(from_wallet) = LOWER(${wallet})
    `
    
    // 4. 插入新配置
    for (const config of configs) {
      await sql`
        INSERT INTO commission_distribution (
          from_wallet,
          to_wallet,
          level,
          percentage,
          rate,
          created_at,
          updated_at
        )
        VALUES (
          ${wallet},
          ${config.toWallet},
          ${config.level},
          ${config.percentage},
          ${config.rate},
          NOW(),
          NOW()
        )
      `
    }
    
    res.json({
      success: true,
      data: {
        message: 'Commission configuration updated successfully',
        configCount: configs.length
      }
    })
    
  } catch (error) {
    console.error('Update commission config error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update commission configuration'
    })
  }
}
```

---

#### 3.5.7 创建佣金配置

**接口：** `POST /api/v1/commissions/:wallet/config`

**优先级：** ⭐⭐

**功能：** 首次创建佣金分配配置

---

#### 3.5.8 删除佣金配置

**接口：** `DELETE /api/v1/commissions/:wallet/config`

**优先级：** ⭐⭐

**功能：** 删除指定的佣金分配配置

**请求参数：**

```typescript
{
  toWallet: string
  level: number
}
```

**SQL查询：**

```sql
DELETE FROM commission_distribution
WHERE LOWER(from_wallet) = LOWER($1)
  AND LOWER(to_wallet) = LOWER($2)
  AND level = $3
```

---

#### 3.5.9 收益计算调试

**接口：** `GET /api/v1/test/earnings-debug`

**优先级：** ⭐ 开发调试

**功能：** 返回收益计算的详细过程，用于调试

---

### 3.6 提现管理

#### 3.6.1 创建提现申请

**接口：** `POST /api/v1/withdrawals`

**优先级：** ⭐⭐⭐

**请求参数：**

```typescript
{
  walletAddress: string
  amount: number           // ASHVA数量
}
```

**业务逻辑：**

1. 验证提现金额 > 最低限额
2. 验证可用余额充足
3. 查询当前ASHVA价格
4. 计算USD金额
5. 创建提现记录
6. 更新钱包pending_withdrawal

**SQL查询：**

```sql
-- 1. 检查可用余额
SELECT distributable_commission, pending_withdrawal
FROM wallets
WHERE LOWER(wallet_address) = LOWER($1)

-- 2. 创建提现记录
INSERT INTO withdrawal_records (
  wallet_address,
  amount,
  amount_usd,
  status,
  created_at
)
VALUES ($1, $2, $3, 'pending', NOW())
RETURNING *

-- 3. 更新钱包
UPDATE wallets
SET 
  pending_withdrawal = pending_withdrawal + $1,
  distributable_commission = distributable_commission - $1,
  updated_at = NOW()
WHERE LOWER(wallet_address) = LOWER($2)
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    message: string
    withdrawal: {
      id: number
      amount: number
      amountUsd: number
      status: string
      createdAt: string
    }
  }
}
```

**完整实现：**

```typescript
export async function createWithdrawal(req: Request, res: Response) {
  try {
    const { walletAddress, amount } = req.body
    
    // 1. 验证金额
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid withdrawal amount'
      })
    }
    
    const MIN_WITHDRAWAL = 10 // 最低提现额
    if (amount < MIN_WITHDRAWAL) {
      return res.status(400).json({
        success: false,
        error: `Minimum withdrawal amount is ${MIN_WITHDRAWAL} ASHVA`
      })
    }
    
    // 2. 检查可用余额
    const wallet = await sql`
      SELECT distributable_commission, pending_withdrawal
      FROM wallets
      WHERE LOWER(wallet_address) = LOWER(${walletAddress})
    `
    
    if (wallet.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      })
    }
    
    const availableBalance = parseFloat(wallet[0].distributable_commission)
    
    if (amount > availableBalance) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. Available: ${availableBalance} ASHVA`
      })
    }
    
    // 3. 获取当前ASHVA价格
    const ashvaPrice = await getAshvaPrice()
    const amountUsd = amount * ashvaPrice
    
    // 4. 创建提现记录
    const withdrawal = await sql`
      INSERT INTO withdrawal_records (
        wallet_address,
        amount,
        amount_usd,
        status,
        created_at
      )
      VALUES (${walletAddress}, ${amount}, ${amountUsd}, 'pending', NOW())
      RETURNING *
    `
    
    // 5. 更新钱包余额
    await sql`
      UPDATE wallets
      SET 
        pending_withdrawal = pending_withdrawal + ${amount},
        distributable_commission = distributable_commission - ${amount},
        updated_at = NOW()
      WHERE LOWER(wallet_address) = LOWER(${walletAddress})
    `
    
    res.json({
      success: true,
      data: {
        message: 'Withdrawal request created successfully',
        withdrawal: {
          id: withdrawal[0].id,
          amount: parseFloat(withdrawal[0].amount),
          amountUsd: parseFloat(withdrawal[0].amount_usd),
          status: withdrawal[0].status,
          createdAt: withdrawal[0].created_at
        }
      }
    })
    
  } catch (error) {
    console.error('Create withdrawal error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create withdrawal request'
    })
  }
}
```

---

#### 3.6.2 获取提现历史

**接口：** `GET /api/v1/withdrawals/:wallet/history`

**优先级：** ⭐⭐⭐

**请求参数：**

```
Query:
  limit=20
  offset=0
  status=pending|approved|rejected|completed
```

**SQL查询：**

```sql
SELECT 
  id,
  amount,
  amount_usd,
  status,
  tx_hash,
  created_at,
  processed_at
FROM withdrawal_records
WHERE LOWER(wallet_address) = LOWER($1)
  AND ($2::text IS NULL OR status = $2)
ORDER BY created_at DESC
LIMIT $3 OFFSET $4
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    total: number
    withdrawals: Array<{
      id: number
      amount: number
      amountUsd: number
      status: string
      txHash: string | null
      createdAt: string
      processedAt: string | null
    }>
  }
}
```

---

#### 3.6.3 审批提现（管理员）

**接口：** `POST /api/v1/withdrawals/:id/approve`

**优先级：** ⭐⭐

**请求参数：**

```typescript
{
  action: string        // approve|reject
  txHash?: string       // 交易哈希（approve时必须）
  reason?: string       // 拒绝原因（reject时可选）
}
```

**业务逻辑：**

1. 查询提现记录
2. 验证状态为pending
3. 如果批准：更新状态为completed，记录tx_hash
4. 如果拒绝：更新状态为rejected，退回余额

**SQL查询：**

```sql
-- 批准
UPDATE withdrawal_records
SET 
  status = 'completed',
  tx_hash = $1,
  processed_at = NOW()
WHERE id = $2
RETURNING *

UPDATE wallets
SET 
  pending_withdrawal = pending_withdrawal - $1,
  total_withdrawn = total_withdrawn + $1,
  updated_at = NOW()
WHERE LOWER(wallet_address) = LOWER($2)

-- 拒绝
UPDATE withdrawal_records
SET 
  status = 'rejected',
  processed_at = NOW()
WHERE id = $1
RETURNING *

UPDATE wallets
SET 
  pending_withdrawal = pending_withdrawal - $1,
  distributable_commission = distributable_commission + $1,
  updated_at = NOW()
WHERE LOWER(wallet_address) = LOWER($2)
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    message: string
    withdrawal: {
      id: number
      status: string
      txHash: string | null
      processedAt: string
    }
  }
}
```

---

### 3.7 节点转让市场

#### 3.7.1 获取转让市场列表

**接口：** `GET /api/v1/marketplace/listings`

**优先级：** ⭐⭐

**请求参数：**

```
Query:
  status=active|sold|cancelled
  nodeType=cloud|image
  minPrice=100
  maxPrice=1000
  limit=20
  offset=0
```

**SQL查询：**

```sql
SELECT 
  nl.listing_id,
  nl.node_id,
  nl.seller_wallet,
  nl.asking_price,
  nl.status,
  nl.description,
  nl.created_at,
  n.node_type,
  n.cpu_cores,
  n.memory_gb,
  n.storage_gb,
  n.total_earnings
FROM node_listings nl
INNER JOIN nodes n ON nl.node_id = n.node_id
WHERE nl.status = COALESCE($1, nl.status)
  AND ($2::text IS NULL OR n.node_type = $2)
  AND ($3::numeric IS NULL OR nl.asking_price >= $3)
  AND ($4::numeric IS NULL OR nl.asking_price <= $4)
ORDER BY nl.created_at DESC
LIMIT $5 OFFSET $6
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    total: number
    listings: Array<{
      listingId: string
      nodeId: string
      sellerWallet: string
      askingPrice: number
      status: string
      description: string
      nodeType: string
      specs: {
        cpuCores: number
        memoryGb: number
        storageGb: number
      },
      totalEarnings: number
      createdAt: string
    }>
  }
}
```

---

#### 3.7.2 创建转让挂单

**接口：** `POST /api/v1/marketplace/listings`

**优先级：** ⭐⭐

**请求参数：**

```typescript
{
  nodeId: string
  askingPrice: number
  description?: string
}
```

**业务逻辑：**

1. 验证节点所有权
2. 验证节点可转让（is_transferable = true）
3. 生成listing_id
4. 创建挂单记录

**SQL查询：**

```sql
-- 1. 验证节点所有权和可转让性
SELECT * FROM nodes
WHERE node_id = $1
  AND LOWER(wallet_address) = LOWER($2)
  AND is_transferable = true

-- 2. 创建挂单
INSERT INTO node_listings (
  listing_id,
  node_id,
  seller_wallet,
  asking_price,
  status,
  description,
  created_at
)
VALUES ($1, $2, $3, $4, 'active', $5, NOW())
RETURNING *
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    message: string
    listing: {
      listingId: string
      nodeId: string
      askingPrice: number
      status: string
      createdAt: string
    }
  }
}
```

---

#### 3.7.3 获取我的挂单

**接口：** `GET /api/v1/marketplace/listings/:wallet`

**优先级：** ⭐⭐

**SQL查询：**

```sql
SELECT 
  nl.*,
  n.node_type,
  n.status as node_status
FROM node_listings nl
INNER JOIN nodes n ON nl.node_id = n.node_id
WHERE LOWER(nl.seller_wallet) = LOWER($1)
ORDER BY nl.created_at DESC
```

---

#### 3.7.4 取消挂单

**接口：** `DELETE /api/v1/marketplace/listings/:id`

**优先级：** ⭐⭐

**业务逻辑：**

1. 验证挂单所有权
2. 验证挂单状态为active
3. 更新状态为cancelled

**SQL查询：**

```sql
UPDATE node_listings
SET status = 'cancelled', updated_at = NOW()
WHERE listing_id = $1
  AND LOWER(seller_wallet) = LOWER($2)
  AND status = 'active'
RETURNING *
```

---

#### 3.7.5 购买挂单节点

**接口：** `POST /api/v1/marketplace/purchase`

**优先级：** ⭐⭐

**请求参数：**

```typescript
{
  listingId: string
  buyerWallet: string
  paymentTxHash: string
}
```

**业务逻辑：**

1. 验证挂单存在且状态为active
2. 验证买家不是卖家
3. 验证支付交易（可选）
4. 更新挂单状态为sold
5. 更新节点所有权
6. 记录sold_at时间

**SQL查询：**

```sql
-- 1. 更新挂单
UPDATE node_listings
SET 
  status = 'sold',
  buyer_wallet = $1,
  sold_at = NOW()
WHERE listing_id = $2
  AND status = 'active'
RETURNING *

-- 2. 更新节点所有权
UPDATE nodes
SET 
  wallet_address = $1,
  updated_at = NOW()
WHERE node_id = $2
RETURNING *
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    message: string
    transaction: {
      listingId: string
      nodeId: string
      buyerWallet: string
      sellerWallet: string
      price: number
      soldAt: string
    }
  }
}
```

---

### 3.8 价格预言机

#### 3.8.1 获取ASHVA实时价格

**接口：** `GET /api/v1/price/ashva`

**优先级：** ⭐⭐⭐

**功能：** 获取ASHVA代币的实时USD价格

**业务逻辑：**

1. 优先从缓存获取（Redis或内存，5分钟有效期）
2. 如果缓存过期，从链上或预言机查询
3. 更新缓存
4. 返回价格

**响应格式：**

```typescript
{
  success: true,
  data: {
    price: number         // USD价格
    source: string        // 价格来源：chainlink|dex|manual
    lastUpdated: string   // 最后更新时间
  }
}
```

**完整实现：**

```typescript
// 价格缓存
let priceCache = {
  price: 0.5,  // 默认价格
  timestamp: Date.now()
}

const CACHE_DURATION = 5 * 60 * 1000 // 5分钟

export async function getAshvaPrice(req: Request, res: Response) {
  try {
    // 1. 检查缓存
    if (Date.now() - priceCache.timestamp < CACHE_DURATION) {
      return res.json({
        success: true,
        data: {
          price: priceCache.price,
          source: 'cache',
          lastUpdated: new Date(priceCache.timestamp).toISOString()
        }
      })
    }
    
    // 2. 从链上查询（示例：使用Chainlink价格预言机）
    let price = 0.5 // 默认价格
    
    try {
      // 这里可以添加实际的价格查询逻辑
      // 例如：从DEX、CEX API、Chainlink等获取
      
      // 示例：从环境变量获取固定价格（用于测试）
      if (process.env.NEXT_PUBLIC_ASHVA_PRICE) {
        price = parseFloat(process.env.NEXT_PUBLIC_ASHVA_PRICE)
      }
    } catch (error) {
      console.error('Failed to fetch price from oracle:', error)
      // 使用缓存的价格
      price = priceCache.price
    }
    
    // 3. 更新缓存
    priceCache = {
      price,
      timestamp: Date.now()
    }
    
    res.json({
      success: true,
      data: {
        price,
        source: 'oracle',
        lastUpdated: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Get ASHVA price error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get ASHVA price'
    })
  }
}
```

---

#### 3.8.2 价格预言机数据源

**接口：** `GET /api/v1/price/oracle`

**优先级：** ⭐

**功能：** 获取价格预言机的所有数据源和聚合信息

**响应格式：**

```typescript
{
  success: true,
  data: {
    aggregatedPrice: number
    sources: Array<{
      name: string        // chainlink|uniswap|manual
      price: number
      weight: number      // 权重
      lastUpdated: string
    }>,
    updateFrequency: number  // 更新频率（秒）
  }
}
```

---

### 3.9 管理后台

#### 3.9.1 管理后台统计数据

**接口：** `GET /api/v1/admin/dashboard-stats`

**优先级：** ⭐⭐

**功能：** 获取管理后台首页的统计数据

**SQL查询：**

```sql
-- 1. 用户统计
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE member_level = 'free') as free_users,
  COUNT(*) FILTER (WHERE member_level != 'free') as premium_users
FROM wallets

-- 2. 节点统计
SELECT 
  COUNT(*) as total_nodes,
  COUNT(*) FILTER (WHERE node_type = 'cloud') as cloud_nodes,
  COUNT(*) FILTER (WHERE node_type = 'image') as image_nodes,
  COUNT(*) FILTER (WHERE status = 'active') as active_nodes
FROM nodes

-- 3. 收益统计
SELECT 
  SUM(total_earnings) as total_earnings,
  SUM(distributable_commission) as total_distributable,
  SUM(total_withdrawn) as total_withdrawn
FROM wallets

-- 4. 今日数据
SELECT 
  COUNT(DISTINCT wallet_address) as active_users_today,
  SUM(net_income_ashva) as income_today
FROM assigned_records
WHERE record_date = CURRENT_DATE
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    users: {
      total: number
      free: number
      premium: number
    },
    nodes: {
      total: number
      cloud: number
      image: number
      active: number
    },
    earnings: {
      total: number
      distributable: number
      withdrawn: number
    },
    today: {
      activeUsers: number
      income: number
    }
  }
}
```

---

#### 3.9.2 用户管理列表

**接口：** `GET /api/v1/admin/users`

**优先级：** ⭐⭐

**请求参数：**

```
Query:
  page=1
  limit=50
  level=free|node_owner|partner|global_partner
  search=0x...  (钱包地址搜索)
```

**SQL查询：**

```sql
SELECT 
  w.*,
  COUNT(n.id) as node_count,
  COUNT(h.id) as team_count
FROM wallets w
LEFT JOIN nodes n ON LOWER(w.wallet_address) = LOWER(n.wallet_address)
LEFT JOIN hierarchy h ON LOWER(w.wallet_address) = LOWER(h.parent_wallet)
WHERE ($1::text IS NULL OR w.member_level = $1)
  AND ($2::text IS NULL OR LOWER(w.wallet_address) LIKE LOWER($2))
GROUP BY w.id
ORDER BY w.created_at DESC
LIMIT $3 OFFSET $4
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    total: number
    page: number
    users: Array<{
      walletAddress: string
      ashvaBalance: number
      memberLevel: string
      totalEarnings: number
      nodeCount: number
      teamCount: number
      createdAt: string
    }>
  }
}
```

---

#### 3.9.3 云节点管理

**接口：** `GET /api/v1/admin/cloud-nodes`

**优先级：** ⭐⭐

**功能：** 管理员查看所有云节点状态

**SQL查询：**

```sql
SELECT 
  n.*,
  w.member_level,
  COUNT(ar.id) as record_count
FROM nodes n
LEFT JOIN wallets w ON LOWER(n.wallet_address) = LOWER(w.wallet_address)
LEFT JOIN assigned_records ar ON n.node_id = ar.device_id
WHERE n.node_type = 'cloud'
GROUP BY n.id, w.member_level
ORDER BY n.created_at DESC
LIMIT $1 OFFSET $2
```

---

#### 3.9.4 收益报表

**接口：** `GET /api/v1/admin/revenue-report`

**优先级：** ⭐⭐

**请求参数：**

```
Query:
  startDate=2024-01-01
  endDate=2024-12-31
  groupBy=day|week|month
```

**SQL查询：**

```sql
SELECT 
  DATE_TRUNC($1, record_date) as period,
  COUNT(DISTINCT wallet_address) as active_users,
  COUNT(DISTINCT device_id) as active_devices,
  SUM(daily_income_ashva) as total_income,
  SUM(daily_fine_ashva) as total_fines,
  SUM(net_income_ashva) as net_income,
  AVG(ashva_price_usd) as avg_price
FROM assigned_records
WHERE record_date >= $2 AND record_date <= $3
GROUP BY period
ORDER BY period DESC
```

**响应格式：**

```typescript
{
  success: true,
  data: {
    report: Array<{
      period: string
      activeUsers: number
      activeDevices: number
      totalIncome: number
      totalFines: number
      netIncome: number
      avgPrice: number
    }>
  }
}
```

---

#### 3.9.5 系统日志

**接口：** `GET /api/v1/admin/system-logs`

**优先级：** ⭐

**功能：** 查看系统操作日志（需要额外的日志表）

---

## 4. 错误处理

### 4.1 统一错误响应格式

```typescript
{
  success: false,
  error: string           // 错误消息
  code?: string          // 错误代码
  details?: any          // 详细信息
}
```

### 4.2 错误代码定义

```typescript
export const ErrorCodes = {
  // 400 Bad Request
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  
  // 401 Unauthorized
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // 404 Not Found
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  NODE_NOT_FOUND: 'NODE_NOT_FOUND',
  
  // 409 Conflict
  REFERRER_ALREADY_SET: 'REFERRER_ALREADY_SET',
  LISTING_ALREADY_SOLD: 'LISTING_ALREADY_SOLD',
  
  // 500 Internal Server Error
  DATABASE_ERROR: 'DATABASE_ERROR',
  BLOCKCHAIN_ERROR: 'BLOCKCHAIN_ERROR',
}
```

### 4.3 全局错误处理中间件

```typescript
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err)
  
  // 数据库错误
  if (err.message.includes('database')) {
    return res.status(500).json({
      success: false,
      error: 'Database error',
      code: 'DATABASE_ERROR'
    })
  }
  
  // 默认500错误
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  })
}
```

---

## 5. 部署指南

### 5.1 环境变量配置

创建 `.env` 文件：

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
JWT_SECRET=your-super-secret-key-change-this

# CORS
CORS_ORIGINS=https://member.yourdomain.com,https://admin.yourdomain.com

# 价格预言机
NEXT_PUBLIC_ASHVA_PRICE=0.5
```

### 5.2 Vercel 部署

1. 在项目根目录创建 `vercel.json`：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.ts"
    }
  ],
  "env": {
    "DATABASE_URL": "@database_url",
    "JWT_SECRET": "@jwt_secret"
  }
}
```

2. 部署命令：

```bash
npm install -g vercel
vercel --prod
```

### 5.3 Docker 部署

1. 创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
```

2. 创建 `docker-compose.yml`：

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped
```

3. 部署：

```bash
docker-compose up -d
```

### 5.4 Railway 部署

1. 连接 GitHub 仓库
2. 添加环境变量
3. 自动部署

### 5.5 健康检查端点

```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})
```

---

## 6. 测试指南

### 6.1 API 测试工具

推荐使用 **Postman** 或 **VS Code REST Client**

创建 `tests/api.http` 文件：

```http
### 健康检查
GET http://localhost:4000/health

### 钱包连接
POST http://localhost:4000/api/v1/wallet/connect
Content-Type: application/json

{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "signature": "0x..."
}

### 获取会员信息（需要Token）
GET http://localhost:4000/api/v1/members/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
Authorization: Bearer YOUR_JWT_TOKEN

### 获取节点列表
GET http://localhost:4000/api/v1/nodes?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
Authorization: Bearer YOUR_JWT_TOKEN

### 创建提现
POST http://localhost:4000/api/v1/withdrawals
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "amount": 100
}
```

### 6.2 单元测试示例

```typescript
import request from 'supertest'
import app from '../src/server'

describe('Wallet API', () => {
  it('should connect wallet successfully', async () => {
    const response = await request(app)
      .post('/api/v1/wallet/connect')
      .send({
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
      })
    
    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.token).toBeDefined()
  })
})
```

---

## 7. 开发建议

### 7.1 开发顺序

1. **第1周：** 实现认证模块（6个接口）
2. **第2周：** 实现会员信息模块（9个接口）
3. **第3周：** 实现节点管理模块（12个接口）
4. **第4周：** 实现收益和提现模块（12个接口）
5. **第5周：** 实现其他模块和优化

### 7.2 代码结构

```
src/
├── server.ts              # 服务器入口
├── routes/
│   ├── wallet.routes.ts   # 钱包路由
│   ├── member.routes.ts   # 会员路由
│   ├── node.routes.ts     # 节点路由
│   └── ...
├── controllers/
│   ├── walletController.ts
│   ├── memberController.ts
│   └── ...
├── services/
│   ├── walletService.ts   # 业务逻辑
│   ├── priceService.ts
│   └── ...
├── middleware/
│   ├── auth.ts            # 认证中间件
│   └── validation.ts      # 参数验证
└── utils/
    ├── database.ts        # 数据库连接
    └── constants.ts       # 常量定义
```

### 7.3 最佳实践

1. **使用TypeScript严格模式**
2. **统一错误处理**
3. **添加请求日志**
4. **实现限流保护**
5. **使用连接池管理数据库连接**
6. **添加API文档（Swagger）**

---

## 8. 联系和支持

如果在实现过程中遇到问题，请检查：

1. 数据库连接是否正常
2. 环境变量是否配置正确
3. JWT Token是否有效
4. SQL查询是否正确

---

**文档版本：** v1.0  
**最后更新：** 2024-01-XX  
**作者：** Web3 Membership Backend Team
