# Web3 Membership Backend API - 完整开发指导文档

> 这是一份完整的后端API开发指南，可以直接复制给另一个v0项目来创建后端系统
> 
> 版本：v1.0  
> 创建日期：2024-01-24

---

## 项目概述

**项目名称**：Web3会员管理系统后端API  
**技术栈**：Express.js + TypeScript + PostgreSQL (Neon)  
**部署方式**：Vercel / Railway / Docker  
**API版本**：v1

### 核心功能

- 钱包连接与认证（JWT Token）
- 会员信息管理
- 推荐关系管理
- 节点购买与管理
- 收益与佣金计算
- 提现管理
- 节点转让市场

---

## 第一部分：数据库Schema

### 完整数据库表结构（10张表）

#### 1. wallets - 钱包主表

存储用户基本信息、余额、等级、推荐关系

```sql
CREATE TABLE wallets (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(255) UNIQUE NOT NULL,
  ashva_balance NUMERIC(20, 2) DEFAULT 0,
  member_level VARCHAR(50) DEFAULT 'normal',
  parent_wallet VARCHAR(255),
  total_earnings NUMERIC(20, 2) DEFAULT 0,
  distributable_commission NUMERIC(20, 2) DEFAULT 0,
  distributed_commission NUMERIC(20, 2) DEFAULT 0,
  self_commission_rate NUMERIC(5, 4) DEFAULT 0,
  commission_rate_level1 NUMERIC(5, 4) DEFAULT 0,
  commission_rate_level2 NUMERIC(5, 4) DEFAULT 0,
  pending_withdrawal NUMERIC(20, 2) DEFAULT 0,
  total_withdrawn NUMERIC(20, 2) DEFAULT 0,
  team_size INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_wallets_address ON wallets(wallet_address);
CREATE INDEX idx_wallets_parent ON wallets(parent_wallet);
CREATE INDEX idx_wallets_level ON wallets(member_level);
```

**字段说明**：
- `wallet_address`: 用户钱包地址（唯一）
- `ashva_balance`: ASHVA代币余额
- `member_level`: 会员等级（normal, bronze_partner, silver_partner, gold_partner, global_partner）
- `parent_wallet`: 推荐人钱包地址
- `total_earnings`: 总收益
- `distributable_commission`: 可分配佣金
- `distributed_commission`: 已分配佣金

#### 2. nodes - 节点表

存储云节点和镜像节点信息

```sql
CREATE TABLE nodes (
  id SERIAL PRIMARY KEY,
  node_id VARCHAR(255) UNIQUE NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  node_type VARCHAR(50) NOT NULL,  -- 'cloud' 或 'image'
  status VARCHAR(50) DEFAULT 'pending',
  purchase_price NUMERIC(20, 2),
  staking_amount NUMERIC(20, 2),
  staking_required_usd NUMERIC(20, 2),
  staking_status VARCHAR(50),
  total_earnings NUMERIC(20, 2) DEFAULT 0,
  cpu_cores INTEGER,
  memory_gb INTEGER,
  storage_gb INTEGER,
  cpu_usage_percentage NUMERIC(5, 2),
  memory_usage_percentage NUMERIC(5, 2),
  storage_used_percentage NUMERIC(5, 2),
  uptime_percentage NUMERIC(5, 2),
  data_transferred_gb NUMERIC(20, 2),
  tx_hash VARCHAR(255),
  install_command TEXT,
  is_transferable BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_nodes_wallet ON nodes(wallet_address);
CREATE INDEX idx_nodes_status ON nodes(status);
CREATE INDEX idx_nodes_type ON nodes(node_type);
```

#### 3. assigned_records - 设备分配记录表

存储节点每日收益和流量数据

```sql
CREATE TABLE assigned_records (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(255) NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  record_date DATE NOT NULL,
  daily_income_ashva NUMERIC(20, 2) DEFAULT 0,
  daily_fine_ashva NUMERIC(20, 2) DEFAULT 0,
  net_income_ashva NUMERIC(20, 2) DEFAULT 0,
  daily_income_cny NUMERIC(20, 2) DEFAULT 0,
  daily_fine_cny NUMERIC(20, 2) DEFAULT 0,
  ashva_price_usd NUMERIC(10, 6),
  cny_to_usd_rate NUMERIC(10, 6),
  price_source VARCHAR(50),
  daily_flow_gb NUMERIC(20, 2) DEFAULT 0,
  assigned_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_assigned_wallet ON assigned_records(wallet_address);
CREATE INDEX idx_assigned_date ON assigned_records(record_date);
```

#### 4. hierarchy - 层级关系表

存储完整的推荐层级关系

```sql
CREATE TABLE hierarchy (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(255) NOT NULL,
  parent_wallet VARCHAR(255) NOT NULL,
  level INTEGER NOT NULL,  -- 层级（1=直推，2=二级...）
  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_hierarchy_wallet ON hierarchy(wallet_address);
CREATE INDEX idx_hierarchy_parent ON hierarchy(parent_wallet);
```

#### 5. commission_distribution - 佣金分配配置表

存储用户自定义的佣金分配规则

```sql
CREATE TABLE commission_distribution (
  id SERIAL PRIMARY KEY,
  from_wallet VARCHAR(255) NOT NULL,
  to_wallet VARCHAR(255) NOT NULL,
  level INTEGER NOT NULL,
  percentage NUMERIC(5, 4),
  rate NUMERIC(5, 4),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 6. commission_records - 佣金记录表

存储所有佣金交易记录

```sql
CREATE TABLE commission_records (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(255) NOT NULL,
  from_wallet VARCHAR(255) NOT NULL,
  amount NUMERIC(20, 2) NOT NULL,
  commission_level INTEGER,
  transaction_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 7. member_level_config - 会员等级配置表

存储不同等级的配置信息

```sql
CREATE TABLE member_level_config (
  id SERIAL PRIMARY KEY,
  level_name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  max_depth INTEGER NOT NULL,  -- 最大层级深度
  commission_total_percentage NUMERIC(5, 4),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 插入默认等级配置
INSERT INTO member_level_config (level_name, display_name, max_depth, commission_total_percentage) VALUES
  ('normal', '普通会员', 0, 0.0000),
  ('bronze_partner', '铜牌合伙人', 3, 0.1500),
  ('silver_partner', '银牌合伙人', 8, 0.2500),
  ('gold_partner', '金牌合伙人', 18, 0.3500),
  ('global_partner', '全球合伙人', 999, 0.5000);
```

#### 8. node_listings - 节点转让挂单表

存储节点转让的买卖信息

```sql
CREATE TABLE node_listings (
  id SERIAL PRIMARY KEY,
  listing_id VARCHAR(255) UNIQUE NOT NULL,
  node_id VARCHAR(255) NOT NULL,
  seller_wallet VARCHAR(255) NOT NULL,
  buyer_wallet VARCHAR(255),
  asking_price NUMERIC(20, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',  -- 'active', 'sold', 'cancelled'
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  sold_at TIMESTAMP
);
```

#### 9. withdrawal_records - 提现记录表

存储提现申请和处理记录

```sql
CREATE TABLE withdrawal_records (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(255) NOT NULL,
  amount NUMERIC(20, 2) NOT NULL,
  amount_usd NUMERIC(20, 2),
  status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'processing', 'completed', 'rejected'
  tx_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);
```

#### 10. staking_records - 质押记录表

存储节点质押信息

```sql
CREATE TABLE staking_records (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(255) NOT NULL,
  node_id VARCHAR(255) NOT NULL,
  staked_amount NUMERIC(20, 2) NOT NULL,
  staked_amount_usd NUMERIC(20, 2),
  lock_period_days INTEGER,
  unlock_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active',  -- 'active', 'unlocked', 'withdrawn'
  rewards_earned NUMERIC(20, 2) DEFAULT 0,
  stake_tx_hash VARCHAR(255),
  unstake_tx_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  unstaked_at TIMESTAMP
);
```

---

## 第二部分：API接口详细规范

### 模块1：用户认证与钱包管理（6个接口）

#### 1.1 钱包连接验证

**接口路径**: `POST /api/v1/wallet/connect`  
**优先级**: ⭐⭐⭐ 最高优先级  
**功能**: 验证钱包地址，检查ASHVA余额，返回JWT token

**请求参数**:
```typescript
{
  walletAddress: string;      // 钱包地址（必填）
  signature?: string;         // 签名（可选）
  message?: string;          // 签名消息（可选）
}
```

**业务逻辑**:
1. 验证钱包地址格式（以0x开头的42字符）
2. 查询链上ASHVA余额（通过Moralis API或RPC）
3. 查询或创建数据库中的钱包记录
4. 检查ASHVA余额是否 >= 1,000,000（最低要求）
5. 计算ASHVA的USD价值
6. 生成JWT token（有效期24小时）
7. 返回完整的钱包信息

**SQL查询示例**:
```sql
-- 查询钱包信息
SELECT 
  wallet_address,
  ashva_balance,
  member_level,
  parent_wallet,
  total_earnings,
  created_at
FROM wallets 
WHERE LOWER(wallet_address) = LOWER($1);

-- 如果不存在则插入
INSERT INTO wallets (wallet_address, ashva_balance, member_level)
VALUES ($1, $2, 'normal')
ON CONFLICT (wallet_address) 
DO UPDATE SET 
  ashva_balance = $2,
  updated_at = NOW();
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "ashvaBalance": 53187465.24,
    "ashvaBalanceUSD": 3660.89,
    "memberLevel": "global_partner",
    "hasReferrer": true,
    "isRegistered": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**JWT Token payload**:
```typescript
{
  wallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  memberLevel: "global_partner",
  iat: 1706083200,
  exp: 1706169600  // 24小时后过期
}
```

---

#### 1.2 验证ASHVA余额

**接口路径**: `GET /api/v1/wallet/verify-ashva`  
**优先级**: ⭐⭐⭐  
**功能**: 验证钱包ASHVA余额是否满足最低要求

**查询参数**:
```
?walletAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**业务逻辑**:
1. 验证钱包地址格式
2. 通过Moralis API查询链上ASHVA余额
3. 获取ASHVA当前USD价格
4. 检查是否 >= 1,000,000 ASHVA
5. 返回验证结果

**区块链查询（Moralis API）**:
```typescript
// 使用Moralis API查询ERC20余额
const response = await fetch(
  `https://deep-index.moralis.io/api/v2.2/${walletAddress}/erc20?chain=base`,
  {
    headers: {
      'X-API-Key': process.env.MORALIS_API_KEY
    }
  }
);

const tokens = await response.json();
const ashvaToken = tokens.find(t => 
  t.token_address.toLowerCase() === ASHVA_CONTRACT_ADDRESS.toLowerCase()
);
const balance = parseFloat(ashvaToken.balance) / 10**18; // 转换为人类可读
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "ashvaBalance": 53187465.24,
    "ashvaBalanceUSD": 3660.89,
    "meetsMinimum": true,
    "minimumRequired": 1000000
  }
}
```

---

#### 1.3 获取钱包基本信息

**接口路径**: `GET /api/v1/wallet/info`  
**优先级**: ⭐⭐  
**认证**: 需要JWT token  
**功能**: 获取钱包的完整信息

**查询参数**:
```
?walletAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**SQL查询**:
```sql
SELECT 
  w.wallet_address,
  w.member_level,
  mlc.display_name as member_level_display,
  w.total_earnings,
  w.distributable_commission,
  w.distributed_commission,
  w.parent_wallet,
  w.created_at as registered_at,
  w.updated_at as last_active_at
FROM wallets w
LEFT JOIN member_level_config mlc ON w.member_level = mlc.level_name
WHERE LOWER(w.wallet_address) = LOWER($1);
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "memberLevel": "global_partner",
    "memberLevelDisplay": "全球合伙人",
    "totalEarnings": 150000.50,
    "distributableCommission": 25000.00,
    "distributedCommission": 10000.00,
    "parentWallet": "0x1234567890abcdef1234567890abcdef12345678",
    "registeredAt": "2024-01-01T00:00:00Z",
    "lastActiveAt": "2024-01-24T10:30:00Z"
  }
}
```

---

#### 1.4 获取推荐人状态

**接口路径**: `GET /api/v1/wallet/referral-status`  
**优先级**: ⭐⭐  
**功能**: 获取钱包的推荐人信息和推荐统计

**SQL查询**:
```sql
-- 获取推荐人信息
SELECT 
  w.parent_wallet as referrer_address,
  pw.member_level as referrer_level,
  COUNT(DISTINCT cw.wallet_address) as referred_count
FROM wallets w
LEFT JOIN wallets pw ON w.parent_wallet = pw.wallet_address
LEFT JOIN wallets cw ON cw.parent_wallet = w.wallet_address
WHERE LOWER(w.wallet_address) = LOWER($1)
GROUP BY w.parent_wallet, pw.member_level;
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "hasReferrer": true,
    "referrerAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "referrerLevel": "global_partner",
    "canChangeReferrer": false,
    "referralCode": "ABC123",
    "referredCount": 15
  }
}
```

---

#### 1.5 更新推荐人关系

**接口路径**: `POST /api/v1/wallet/update-referral`  
**优先级**: ⭐⭐  
**功能**: 设置或更新推荐人关系

**请求参数**:
```typescript
{
  walletAddress: string;        // 用户钱包地址
  parentWallet: string;         // 推荐人钱包地址
}
```

**业务逻辑**:
1. 验证两个钱包地址格式
2. 检查用户是否已有推荐人（如果有，拒绝修改）
3. 验证推荐人钱包是否存在且已注册
4. 检查是否会形成循环推荐（A推荐B，B不能推荐A）
5. 更新wallets表的parent_wallet字段
6. 更新hierarchy表，建立层级关系
7. 返回更新结果

**SQL操作**:
```sql
-- 1. 检查是否已有推荐人
SELECT parent_wallet FROM wallets 
WHERE LOWER(wallet_address) = LOWER($1);

-- 2. 验证推荐人是否存在
SELECT wallet_address FROM wallets 
WHERE LOWER(wallet_address) = LOWER($2);

-- 3. 更新推荐关系
UPDATE wallets 
SET parent_wallet = $2, updated_at = NOW()
WHERE LOWER(wallet_address) = LOWER($1);

-- 4. 插入层级关系
INSERT INTO hierarchy (wallet_address, parent_wallet, level)
VALUES ($1, $2, 1);

-- 递归插入更高层级
WITH RECURSIVE parent_chain AS (
  SELECT parent_wallet, 2 as level
  FROM wallets
  WHERE LOWER(wallet_address) = LOWER($2)
  
  UNION ALL
  
  SELECT w.parent_wallet, pc.level + 1
  FROM wallets w
  INNER JOIN parent_chain pc ON w.wallet_address = pc.parent_wallet
  WHERE w.parent_wallet IS NOT NULL AND pc.level < 999
)
INSERT INTO hierarchy (wallet_address, parent_wallet, level)
SELECT $1, parent_wallet, level FROM parent_chain;
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "parentWallet": "0x1234567890abcdef1234567890abcdef12345678",
    "updatedAt": "2024-01-24T10:30:00Z"
  },
  "message": "推荐人设置成功"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "该钱包已有推荐人，无法修改",
  "code": "REFERRER_ALREADY_SET"
}
```

---

#### 1.6 同步钱包数据

**接口路径**: `POST /api/v1/wallet/sync`  
**优先级**: ⭐  
**功能**: 从区块链同步最新的钱包数据（管理员功能）

**请求参数**:
```typescript
{
  walletAddress: string;
  forceSync?: boolean;         // 强制同步（默认false）
}
```

**业务逻辑**:
1. 查询链上ASHVA余额
2. 重新计算会员等级（根据节点数量和质押金额）
3. 更新数据库中的余额和等级信息
4. 返回同步的字段列表

**会员等级判定逻辑**:
```typescript
function calculateMemberLevel(totalStaking: number, nodeCount: number): string {
  if (totalStaking >= 1000000 && nodeCount >= 50) return 'global_partner';
  if (totalStaking >= 500000 && nodeCount >= 20) return 'gold_partner';
  if (totalStaking >= 100000 && nodeCount >= 10) return 'silver_partner';
  if (totalStaking >= 10000 && nodeCount >= 3) return 'bronze_partner';
  return 'normal';
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "syncedAt": "2024-01-24T10:30:00Z",
    "updatedFields": ["ashvaBalance", "memberLevel"]
  },
  "message": "钱包数据同步成功"
}
```

---

## 第三部分：技术实现指南

### 3.1 项目结构

```
backend-api/
├── src/
│   ├── controllers/           # 控制器层（处理HTTP请求）
│   │   └── walletController.ts
│   ├── services/              # 服务层（业务逻辑）
│   │   ├── walletService.ts
│   │   ├── priceService.ts
│   │   └── blockchainService.ts
│   ├── routes/                # 路由定义
│   │   └── wallet.routes.ts
│   ├── middleware/            # 中间件
│   │   ├── auth.ts            # JWT认证
│   │   ├── validation.ts      # 参数验证
│   │   └── errorHandler.ts    # 错误处理
│   ├── utils/                 # 工具函数
│   │   ├── database.ts        # 数据库连接
│   │   ├── constants.ts       # 常量定义
│   │   └── logger.ts          # 日志
│   ├── types/                 # TypeScript类型
│   │   └── index.ts
│   └── server.ts              # 服务器入口
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

### 3.2 核心依赖包

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "@neondatabase/serverless": "^0.9.0",
    "jsonwebtoken": "^9.0.2",
    "ethers": "^6.10.0",
    "axios": "^1.6.5",
    "express-rate-limit": "^7.1.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/jsonwebtoken": "^9.0.5",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0",
    "nodemon": "^3.0.2"
  }
}
```

### 3.3 环境变量配置

创建 `.env` 文件：

```env
# 数据库连接
DATABASE_URL=postgresql://user:password@host:5432/database

# 服务器配置
PORT=4000
NODE_ENV=production

# 区块链配置
RPC_URL=https://mainnet.base.org
ASHVA_CONTRACT_ADDRESS=0x8fce07A7F48886B53d295774c6F18BA53A86B6D

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# CORS配置
CORS_ORIGINS=https://member.yourdomain.com,http://localhost:3000

# Moralis API
MORALIS_API_KEY=your-moralis-api-key-here

# 价格API
ASHVA_PRICE_API=https://api.coingecko.com/api/v3/simple/price
```

### 3.4 核心代码实现

#### 数据库连接（src/utils/database.ts）

```typescript
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default sql;
```

#### JWT认证中间件（src/middleware/auth.ts）

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    wallet: string;
    memberLevel: string;
  };
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'INVALID_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = {
      wallet: decoded.wallet,
      memberLevel: decoded.memberLevel
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
}
```

#### 区块链服务（src/services/blockchainService.ts）

```typescript
import axios from 'axios';

const MORALIS_API_KEY = process.env.MORALIS_API_KEY!;
const ASHVA_CONTRACT = process.env.ASHVA_CONTRACT_ADDRESS!;

export async function getAshvaBalance(walletAddress: string): Promise<number> {
  try {
    const response = await axios.get(
      `https://deep-index.moralis.io/api/v2.2/${walletAddress}/erc20`,
      {
        params: { chain: 'base' },
        headers: { 'X-API-Key': MORALIS_API_KEY }
      }
    );

    const ashvaToken = response.data.find(
      (token: any) => token.token_address.toLowerCase() === ASHVA_CONTRACT.toLowerCase()
    );

    if (!ashvaToken) return 0;

    return parseFloat(ashvaToken.balance) / 10**18;
  } catch (error) {
    console.error('Error fetching ASHVA balance:', error);
    throw new Error('Failed to fetch blockchain data');
  }
}
```

#### 价格服务（src/services/priceService.ts）

```typescript
import axios from 'axios';

let priceCache = {
  price: 0,
  timestamp: 0
};

const CACHE_DURATION = 5 * 60 * 1000; // 5分钟

export async function getAshvaPrice(): Promise<number> {
  const now = Date.now();

  if (priceCache.price && (now - priceCache.timestamp) < CACHE_DURATION) {
    return priceCache.price;
  }

  try {
    // 从CoinGecko或其他价格API获取
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: 'ashva',
          vs_currencies: 'usd'
        }
      }
    );

    const price = response.data.ashva?.usd || 0.0000689;

    priceCache = {
      price,
      timestamp: now
    };

    return price;
  } catch (error) {
    console.error('Error fetching ASHVA price:', error);
    return 0.0000689; // 返回默认价格
  }
}
```

#### 钱包服务（src/services/walletService.ts）

```typescript
import sql from '../utils/database';
import { getAshvaBalance } from './blockchainService';
import { getAshvaPrice } from './priceService';
import jwt from 'jsonwebtoken';

export async function connectWallet(walletAddress: string) {
  // 1. 查询链上余额
  const ashvaBalance = await getAshvaBalance(walletAddress);
  const ashvaPrice = await getAshvaPrice();
  const ashvaBalanceUSD = ashvaBalance * ashvaPrice;

  // 2. 查询或创建数据库记录
  let wallet = await sql`
    SELECT 
      wallet_address,
      member_level,
      parent_wallet,
      created_at
    FROM wallets
    WHERE LOWER(wallet_address) = LOWER(${walletAddress})
  `;

  if (wallet.length === 0) {
    // 创建新钱包
    await sql`
      INSERT INTO wallets (wallet_address, ashva_balance, member_level)
      VALUES (${walletAddress}, ${ashvaBalance}, 'normal')
    `;
    
    wallet = await sql`
      SELECT * FROM wallets
      WHERE LOWER(wallet_address) = LOWER(${walletAddress})
    `;
  } else {
    // 更新余额
    await sql`
      UPDATE wallets
      SET ashva_balance = ${ashvaBalance}, updated_at = NOW()
      WHERE LOWER(wallet_address) = LOWER(${walletAddress})
    `;
  }

  const walletData = wallet[0];

  // 3. 生成JWT token
  const token = jwt.sign(
    {
      wallet: walletAddress,
      memberLevel: walletData.member_level
    },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  return {
    walletAddress,
    ashvaBalance,
    ashvaBalanceUSD,
    memberLevel: walletData.member_level,
    hasReferrer: !!walletData.parent_wallet,
    isRegistered: true,
    token
  };
}

export async function verifyAshvaBalance(walletAddress: string) {
  const ashvaBalance = await getAshvaBalance(walletAddress);
  const ashvaPrice = await getAshvaPrice();
  const minimumRequired = 1000000;

  return {
    walletAddress,
    ashvaBalance,
    ashvaBalanceUSD: ashvaBalance * ashvaPrice,
    meetsMinimum: ashvaBalance >= minimumRequired,
    minimumRequired
  };
}

export async function getWalletInfo(walletAddress: string) {
  const result = await sql`
    SELECT 
      w.wallet_address,
      w.member_level,
      mlc.display_name as member_level_display,
      w.total_earnings,
      w.distributable_commission,
      w.distributed_commission,
      w.parent_wallet,
      w.created_at as registered_at,
      w.updated_at as last_active_at
    FROM wallets w
    LEFT JOIN member_level_config mlc ON w.member_level = mlc.level_name
    WHERE LOWER(w.wallet_address) = LOWER(${walletAddress})
  `;

  if (result.length === 0) {
    throw new Error('Wallet not found');
  }

  return result[0];
}

export async function getReferralStatus(walletAddress: string) {
  const result = await sql`
    SELECT 
      w.parent_wallet as referrer_address,
      pw.member_level as referrer_level,
      COUNT(DISTINCT cw.wallet_address) as referred_count
    FROM wallets w
    LEFT JOIN wallets pw ON w.parent_wallet = pw.wallet_address
    LEFT JOIN wallets cw ON cw.parent_wallet = w.wallet_address
    WHERE LOWER(w.wallet_address) = LOWER(${walletAddress})
    GROUP BY w.parent_wallet, pw.member_level
  `;

  const data = result[0] || {};

  return {
    hasReferrer: !!data.referrer_address,
    referrerAddress: data.referrer_address || null,
    referrerLevel: data.referrer_level || null,
    canChangeReferrer: !data.referrer_address,
    referralCode: walletAddress.slice(2, 8).toUpperCase(),
    referredCount: parseInt(data.referred_count) || 0
  };
}

export async function updateReferral(walletAddress: string, parentWallet: string) {
  // 1. 检查是否已有推荐人
  const existing = await sql`
    SELECT parent_wallet FROM wallets
    WHERE LOWER(wallet_address) = LOWER(${walletAddress})
  `;

  if (existing[0]?.parent_wallet) {
    throw new Error('REFERRER_ALREADY_SET');
  }

  // 2. 验证推荐人是否存在
  const parent = await sql`
    SELECT wallet_address FROM wallets
    WHERE LOWER(wallet_address) = LOWER(${parentWallet})
  `;

  if (parent.length === 0) {
    throw new Error('INVALID_REFERRER');
  }

  // 3. 更新推荐关系
  await sql`
    UPDATE wallets
    SET parent_wallet = ${parentWallet}, updated_at = NOW()
    WHERE LOWER(wallet_address) = LOWER(${walletAddress})
  `;

  // 4. 插入层级关系
  await sql`
    INSERT INTO hierarchy (wallet_address, parent_wallet, level)
    VALUES (${walletAddress}, ${parentWallet}, 1)
  `;

  return {
    walletAddress,
    parentWallet,
    updatedAt: new Date().toISOString()
  };
}

export async function syncWallet(walletAddress: string, forceSync: boolean = false) {
  const ashvaBalance = await getAshvaBalance(walletAddress);
  
  await sql`
    UPDATE wallets
    SET ashva_balance = ${ashvaBalance}, updated_at = NOW()
    WHERE LOWER(wallet_address) = LOWER(${walletAddress})
  `;

  return {
    walletAddress,
    syncedAt: new Date().toISOString(),
    updatedFields: ['ashvaBalance']
  };
}
```

#### 控制器（src/controllers/walletController.ts）

```typescript
import { Request, Response } from 'express';
import * as walletService from '../services/walletService';

export async function connectWallet(req: Request, res: Response) {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }

    const data = await walletService.connectWallet(walletAddress);

    res.json({
      success: true,
      data
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to connect wallet',
      code: 'WALLET_CONNECT_ERROR'
    });
  }
}

export async function verifyAshva(req: Request, res: Response) {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }

    const data = await walletService.verifyAshvaBalance(walletAddress);

    res.json({
      success: true,
      data
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify ASHVA balance',
      code: 'VERIFICATION_ERROR'
    });
  }
}

export async function getWalletInfo(req: Request, res: Response) {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }

    const data = await walletService.getWalletInfo(walletAddress);

    res.json({
      success: true,
      data
    });
  } catch (error: any) {
    if (error.message === 'Wallet not found') {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found',
        code: 'WALLET_NOT_FOUND'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get wallet info',
      code: 'WALLET_INFO_ERROR'
    });
  }
}

export async function getReferralStatus(req: Request, res: Response) {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }

    const data = await walletService.getReferralStatus(walletAddress);

    res.json({
      success: true,
      data
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get referral status',
      code: 'REFERRAL_STATUS_ERROR'
    });
  }
}

export async function updateReferral(req: Request, res: Response) {
  try {
    const { walletAddress, parentWallet } = req.body;

    if (!walletAddress || !parentWallet) {
      return res.status(400).json({
        success: false,
        error: 'Both walletAddress and parentWallet are required'
      });
    }

    const data = await walletService.updateReferral(walletAddress, parentWallet);

    res.json({
      success: true,
      data,
      message: '推荐人设置成功'
    });
  } catch (error: any) {
    if (error.message === 'REFERRER_ALREADY_SET') {
      return res.status(400).json({
        success: false,
        error: '该钱包已有推荐人，无法修改',
        code: 'REFERRER_ALREADY_SET'
      });
    }

    if (error.message === 'INVALID_REFERRER') {
      return res.status(400).json({
        success: false,
        error: '推荐人地址无效',
        code: 'INVALID_REFERRER'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update referral',
      code: 'UPDATE_REFERRAL_ERROR'
    });
  }
}

export async function syncWallet(req: Request, res: Response) {
  try {
    const { walletAddress, forceSync } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }

    const data = await walletService.syncWallet(walletAddress, forceSync);

    res.json({
      success: true,
      data,
      message: '钱包数据同步成功'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync wallet',
      code: 'SYNC_WALLET_ERROR'
    });
  }
}
```

#### 路由配置（src/routes/wallet.routes.ts）

```typescript
import express from 'express';
import * as walletController from '../controllers/walletController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// 公开接口（不需要认证）
router.post('/connect', walletController.connectWallet);
router.get('/verify-ashva', walletController.verifyAshva);

// 需要认证的接口
router.get('/info', authMiddleware, walletController.getWalletInfo);
router.get('/referral-status', authMiddleware, walletController.getReferralStatus);
router.post('/update-referral', authMiddleware, walletController.updateReferral);
router.post('/sync', authMiddleware, walletController.syncWallet);

export default router;
```

#### 服务器入口（src/server.ts）

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import walletRoutes from './routes/wallet.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// 中间件
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API路由
app.use('/api/v1/wallet', walletRoutes);

// 错误处理
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API documentation: http://localhost:${PORT}/api/v1`);
});

export default app;
```

---

## 第四部分：部署指南

### 4.1 Vercel部署（推荐）

1. **安装Vercel CLI**:
```bash
npm install -g vercel
```

2. **创建vercel.json**:
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
    "NODE_ENV": "production"
  }
}
```

3. **部署**:
```bash
vercel --prod
```

4. **配置环境变量**:
在Vercel Dashboard中添加所有环境变量

### 4.2 Docker部署

**Dockerfile**:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 4000

CMD ["node", "dist/server.js"]
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "4000:4000"
    env_file:
      - .env
    restart: unless-stopped
```

**部署命令**:
```bash
docker-compose up -d
```

### 4.3 Railway部署

1. 连接GitHub仓库
2. 选择项目
3. 添加环境变量
4. 自动部署

---

## 第五部分：测试指南

### 5.1 使用curl测试

```bash
# 1. 钱包连接
curl -X POST http://localhost:4000/api/v1/wallet/connect \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'

# 2. 验证余额
curl http://localhost:4000/api/v1/wallet/verify-ashva?walletAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# 3. 获取钱包信息（需要token）
curl http://localhost:4000/api/v1/wallet/info?walletAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5.2 Postman集合

导入以下JSON到Postman:

```json
{
  "info": {
    "name": "Web3 Membership API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Wallet Connect",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"walletAddress\": \"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb\"\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/wallet/connect",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "wallet", "connect"]
        }
      }
    }
  ]
}
```

---

## 第六部分：前端集成指南

### 6.1 前端环境变量

在前端项目（v0项目A）中添加：

```env
NEXT_PUBLIC_BACKEND_API_URL=https://api.yourdomain.com
```

### 6.2 API客户端示例

前端应该使用以下客户端调用后端API：

```typescript
// lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

class ApiClient {
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}/api/v1${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`,
        ...options.headers,
      },
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data.data;
  }

  async connectWallet(walletAddress: string) {
    return this.request('/wallet/connect', {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    });
  }

  async verifyAshva(walletAddress: string) {
    return this.request(`/wallet/verify-ashva?walletAddress=${walletAddress}`);
  }

  async getWalletInfo(walletAddress: string) {
    return this.request(`/wallet/info?walletAddress=${walletAddress}`);
  }

  async getReferralStatus(walletAddress: string) {
    return this.request(`/wallet/referral-status?walletAddress=${walletAddress}`);
  }

  async updateReferral(walletAddress: string, parentWallet: string) {
    return this.request('/wallet/update-referral', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, parentWallet }),
    });
  }

  async syncWallet(walletAddress: string, forceSync = false) {
    return this.request('/wallet/sync', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, forceSync }),
    });
  }

  private getAuthToken(): string {
    return localStorage.getItem('auth_token') || '';
  }
}

export const apiClient = new ApiClient();
```

---

## 第七部分：常见问题

### Q1: 如何处理CORS错误？
A: 确保后端的CORS配置包含前端域名：
```typescript
app.use(cors({
  origin: ['https://member.yourdomain.com', 'http://localhost:3000'],
  credentials: true
}));
```

### Q2: JWT token过期怎么办？
A: 前端需要处理401错误，提示用户重新登录：
```typescript
if (response.status === 401) {
  localStorage.removeItem('auth_token');
  window.location.href = '/login';
}
```

### Q3: 如何调试数据库查询？
A: 在开发环境启用SQL日志：
```typescript
const result = await sql`SELECT * FROM wallets`;
console.log('[SQL]', result);
```

### Q4: 价格数据不准确怎么办？
A: 配置多个价格源，使用平均值：
```typescript
const prices = await Promise.all([
  getCoinGeckoPrice(),
  getCoinMarketCapPrice(),
  getDexScreenerPrice()
]);
const averagePrice = prices.reduce((a, b) => a + b) / prices.length;
```

---

## 第八部分：下一步计划

完成这6个接口后，按以下顺序继续开发：

1. **会员信息模块**（4个接口）
   - GET /api/v1/members/:wallet
   - GET /api/v1/members/:wallet/team
   - GET /api/v1/members/:wallet/global-team
   - GET /api/v1/members/:wallet/devices

2. **节点管理模块**（3个接口）
   - GET /api/v1/nodes
   - POST /api/v1/purchases/cloud-node
   - POST /api/v1/purchases/image-node

3. **收益与佣金模块**（3个接口）
   - GET /api/v1/earnings/:wallet/summary
   - GET /api/v1/commissions/:wallet
   - GET/PUT /api/v1/commissions/:wallet/config

---

## 联系与协作

- **前端项目**: v0项目A
- **后端项目**: 当前文档所在的v0项目B
- **协作方式**: 通过API契约文档同步
- **更新频率**: 每次API变更后更新文档

---

**文档版本**: v1.0  
**最后更新**: 2024-01-24  
**维护者**: v0 AI Assistant
