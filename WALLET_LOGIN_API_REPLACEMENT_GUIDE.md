# 钱包登录API替换指南

## 当前登录流程分析

### 登录流程图

```
用户点击连接钱包
     ↓
Dynamic Wallet 连接
     ↓
获取钱包地址 (address)
     ↓
前端查询区块链：获取ASHVA余额
     ↓
验证余额是否 > 0
     ↓ 【调用API】
POST /api/wallet/connect
{
  address: "0x...",
  balance: 1234.56,
  referralWallet: "0x..." (可选)
}
     ↓
后端处理：
1. 查询ASHVA价格
2. 计算USD价值
3. 判断会员等级
4. 检查是否新用户
5. 保存/更新数据库
6. 返回用户信息
     ↓
前端跳转到会员中心
```

---

## 当前使用的API

### 1. POST /api/wallet/connect - 钱包连接验证

**当前实现位置**: `app/api/wallet/connect/route.ts`

**功能说明**:
- 验证钱包地址和余额
- 判断是否新用户
- 设置推荐人关系
- 计算会员等级
- 保存到数据库

**请求格式**:
```json
POST /api/wallet/connect
Content-Type: application/json

{
  "address": "0x1234567890123456789012345678901234567890",
  "balance": 1234.56,
  "referralWallet": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" // 可选
}
```

**响应格式**:

**情况1：现有用户登录成功**
```json
{
  "success": true,
  "wallet": {
    "wallet_address": "0x...",
    "ashva_balance": 1234.56,
    "member_level": "market_partner",
    "commission_rate_level1": 25.0,
    "commission_rate_level2": 25.0,
    "parent_wallet": "0x...",
    "team_size": 5,
    "total_earnings": 100.5,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-10T00:00:00Z"
  },
  "balance": 1234.56,
  "usdValue": 0.102,
  "message": "欢迎回来",
  "isNewUser": false
}
```

**情况2：新用户需要输入推荐人**
```json
{
  "success": false,
  "needsReferral": true,
  "message": "请输入邀请人地址"
}
```

**情况3：新用户注册成功**
```json
{
  "success": true,
  "wallet": {
    "wallet_address": "0x...",
    "ashva_balance": 1234.56,
    "member_level": "normal",
    "commission_rate_level1": 3.0,
    "commission_rate_level2": 2.0,
    "parent_wallet": "0x...",
    "team_size": 0,
    "total_earnings": 0,
    "created_at": "2024-01-10T00:00:00Z",
    "updated_at": "2024-01-10T00:00:00Z"
  },
  "balance": 1234.56,
  "usdValue": 0.102,
  "message": "钱包已连接",
  "isNewUser": true
}
```

**错误响应**:
```json
// 400 Bad Request
{
  "error": "钱包地址不能为空"
}

{
  "error": "无效的余额数据"
}

{
  "error": "无效的推荐人地址格式"
}

{
  "error": "不能邀请自己"
}

// 500 Internal Server Error
{
  "error": "保存失败: 数据库连接错误"
}
```

---

## 后端实现逻辑详解

### 关键业务逻辑

```typescript
// 1. 获取ASHVA实时价格
const ashvaPrice = await fetch('/api/ashva-price').then(r => r.json())

// 2. 计算USD价值
const usdValue = balance * ashvaPrice

// 3. 判断会员等级
function determineMemberLevel(usdValue: number): string {
  if (usdValue >= 1000) {  // GLOBAL_PARTNER_THRESHOLD
    return "global_partner"
  } else if (usdValue >= 100) {  // MARKET_PARTNER_THRESHOLD
    return "market_partner"
  } else {
    return "normal"
  }
}

// 4. 设置佣金比例
let commissionRate1 = 3.0  // 一级佣金
let commissionRate2 = 2.0  // 二级佣金

if (memberLevel === "global_partner" || memberLevel === "market_partner") {
  commissionRate1 = 25.0
  commissionRate2 = 25.0
}

// 5. 检查是否现有用户
const existingUser = await db.query(`
  SELECT * FROM wallets 
  WHERE wallet_address = $1
`, [address.toLowerCase()])

if (existingUser.length > 0) {
  // 更新现有用户
  await db.query(`
    UPDATE wallets 
    SET ashva_balance = $1,
        member_level = $2,
        commission_rate_level1 = $3,
        commission_rate_level2 = $4,
        updated_at = CURRENT_TIMESTAMP
    WHERE wallet_address = $5
  `, [balance, memberLevel, commissionRate1, commissionRate2, address.toLowerCase()])
} else {
  // 创建新用户
  const DEFAULT_UPLINE = "0x0000000000000000000000000000000001"
  const parentWallet = referralWallet || DEFAULT_UPLINE
  
  await db.query(`
    INSERT INTO wallets (
      wallet_address, ashva_balance, member_level,
      commission_rate_level1, commission_rate_level2,
      parent_wallet, team_size, total_earnings,
      created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `, [address.toLowerCase(), balance, memberLevel, commissionRate1, commissionRate2, parentWallet])
  
  // 创建层级关系
  await db.query(`
    INSERT INTO hierarchy (wallet_address, parent_wallet, level, created_at)
    VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
  `, [address.toLowerCase(), parentWallet])
}
```

---

## 如何替换成外部API

### 方案：使用环境变量配置外部API

**步骤1：添加环境变量**

在 `.env.local` 中添加：
```env
NEXT_PUBLIC_BACKEND_API_URL=https://api.yourdomain.com
```

**步骤2：创建API客户端**

文件：`lib/api-client.ts`

```typescript
class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || ''
  }

  async connectWallet(data: {
    address: string
    balance: number
    referralWallet?: string
  }) {
    const response = await fetch(`${this.baseUrl}/api/v1/wallet/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '连接失败')
    }

    return response.json()
  }
}

export const apiClient = new ApiClient()
```

**步骤3：修改登录页面**

文件：`app/(auth)/page.tsx`

```typescript
// 修改前
const saveWalletToDatabase = async (address: string, balance: number, referralWallet?: string) => {
  const response = await fetch("/api/wallet/connect", {  // 本地API
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, balance, referralWallet }),
  })
  // ...
}

// 修改后
import { apiClient } from '@/lib/api-client'

const saveWalletToDatabase = async (address: string, balance: number, referralWallet?: string) => {
  const data = await apiClient.connectWallet({  // 外部API
    address,
    balance,
    referralWallet,
  })
  
  if (data.needsReferral) {
    return data
  }
  
  if (!data.success) {
    throw new Error(data.error || t("login.saveWalletFailed"))
  }
  
  return data
}
```

---

## 外部API需要实现的完整规范

### 接口规范

**端点**: `POST /api/v1/wallet/connect`

**请求头**:
```
Content-Type: application/json
Accept: application/json
```

**请求体**:
```typescript
interface WalletConnectRequest {
  address: string       // 钱包地址（必须是有效的以太坊地址）
  balance: number       // ASHVA余额（必须 >= 0）
  referralWallet?: string  // 推荐人地址（可选）
}
```

**验证规则**:
1. `address` 必须匹配正则: `/^0x[a-fA-F0-9]{40}$/`
2. `balance` 必须是非负数
3. `referralWallet` 如果提供，必须匹配正则: `/^0x[a-fA-F0-9]{40}$/`
4. `referralWallet` 不能等于 `address`（不能自己推荐自己）

**响应规范**:

**成功响应（200 OK）**:
```typescript
interface WalletConnectResponse {
  success: true
  wallet: {
    wallet_address: string
    ashva_balance: number
    member_level: 'normal' | 'market_partner' | 'global_partner'
    commission_rate_level1: number
    commission_rate_level2: number
    parent_wallet: string
    team_size: number
    total_earnings: number
    created_at: string
    updated_at: string
  }
  balance: number
  usdValue: number
  message: string
  isNewUser: boolean
}
```

**需要推荐人（202 Accepted）**:
```typescript
interface NeedsReferralResponse {
  success: false
  needsReferral: true
  message: string
}
```

**错误响应（400/500）**:
```typescript
interface ErrorResponse {
  error: string
}
```

---

## 数据库操作

### 需要的表

**1. wallets 表**
```sql
CREATE TABLE wallets (
  wallet_address VARCHAR(42) PRIMARY KEY,
  ashva_balance DECIMAL(20, 8) DEFAULT 0,
  member_level VARCHAR(20) DEFAULT 'normal',
  commission_rate_level1 DECIMAL(5, 2) DEFAULT 3.0,
  commission_rate_level2 DECIMAL(5, 2) DEFAULT 2.0,
  parent_wallet VARCHAR(42),
  team_size INTEGER DEFAULT 0,
  total_earnings DECIMAL(20, 8) DEFAULT 0,
  distributable_commission DECIMAL(20, 8) DEFAULT 0,
  distributed_commission DECIMAL(20, 8) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**2. hierarchy 表**
```sql
CREATE TABLE hierarchy (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  parent_wallet VARCHAR(42) NOT NULL,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(wallet_address, parent_wallet)
);
```

### SQL查询示例

**检查现有用户**:
```sql
SELECT * FROM wallets 
WHERE LOWER(wallet_address) = LOWER($1)
```

**更新现有用户**:
```sql
UPDATE wallets 
SET ashva_balance = $1,
    member_level = $2,
    commission_rate_level1 = $3,
    commission_rate_level2 = $4,
    updated_at = CURRENT_TIMESTAMP
WHERE LOWER(wallet_address) = $5
RETURNING *
```

**创建新用户**:
```sql
INSERT INTO wallets (
  wallet_address, ashva_balance, member_level,
  commission_rate_level1, commission_rate_level2,
  parent_wallet, team_size, total_earnings,
  created_at, updated_at
) VALUES (
  LOWER($1), $2, $3, $4, $5, LOWER($6), 0, 0,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
RETURNING *
```

**创建层级关系**:
```sql
INSERT INTO hierarchy (wallet_address, parent_wallet, level, created_at)
VALUES (LOWER($1), LOWER($2), 1, CURRENT_TIMESTAMP)
ON CONFLICT (wallet_address, parent_wallet) DO NOTHING
```

---

## 前端调用示例

### 完整的登录流程代码

```typescript
// app/(auth)/page.tsx

import { apiClient } from '@/lib/api-client'

const verifyAndLogin = async (walletAddress: string) => {
  try {
    setVerifying(true)
    setError("")

    // 1. 查询区块链获取余额
    const contract = new Contract(ASHVA_CONTRACT, ERC20_ABI, provider)
    const balance = await contract.balanceOf(walletAddress)
    const decimals = await contract.decimals()
    const formattedBalance = Number(balance) / 10 ** decimals

    // 2. 检查余额是否为0
    if (formattedBalance === 0) {
      router.push(`/require-token?wallet=${walletAddress}`)
      return
    }

    // 3. 获取推荐人地址（如果有）
    const storedReferralCode = localStorage.getItem("referralCode")

    // 4. 调用外部API连接钱包
    const result = await apiClient.connectWallet({
      address: walletAddress,
      balance: formattedBalance,
      referralWallet: storedReferralCode || undefined
    })

    // 5. 处理需要推荐人的情况
    if (result.needsReferral) {
      setShowReferralInput(true)
      setIsNewUser(true)
      return
    }

    // 6. 登录成功，跳转到会员中心
    if (storedReferralCode) {
      localStorage.removeItem("referralCode")
    }
    
    localStorage.setItem("walletAddress", walletAddress)
    router.push("/member")

  } catch (error: any) {
    setError(error.message || "连接失败")
  } finally {
    setVerifying(false)
  }
}
```

---

## 测试用例

### 测试1：现有用户登录

**请求**:
```bash
curl -X POST https://api.yourdomain.com/api/v1/wallet/connect \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x1234567890123456789012345678901234567890",
    "balance": 1500.50
  }'
```

**预期响应**:
```json
{
  "success": true,
  "wallet": {
    "wallet_address": "0x1234567890123456789012345678901234567890",
    "ashva_balance": 1500.50,
    "member_level": "global_partner",
    "commission_rate_level1": 25.0,
    "commission_rate_level2": 25.0,
    "parent_wallet": "0xabcd...",
    "team_size": 3,
    "total_earnings": 50.25
  },
  "balance": 1500.50,
  "usdValue": 0.124,
  "message": "欢迎回来",
  "isNewUser": false
}
```

### 测试2：新用户没有推荐人

**请求**:
```bash
curl -X POST https://api.yourdomain.com/api/v1/wallet/connect \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0xNEWUSER00000000000000000000000000000001",
    "balance": 100.00
  }'
```

**预期响应**:
```json
{
  "success": false,
  "needsReferral": true,
  "message": "请输入邀请人地址"
}
```

### 测试3：新用户带推荐人

**请求**:
```bash
curl -X POST https://api.yourdomain.com/api/v1/wallet/connect \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0xNEWUSER00000000000000000000000000000002",
    "balance": 50.00,
    "referralWallet": "0x1234567890123456789012345678901234567890"
  }'
```

**预期响应**:
```json
{
  "success": true,
  "wallet": {
    "wallet_address": "0xnewuser00000000000000000000000000000002",
    "ashva_balance": 50.00,
    "member_level": "normal",
    "commission_rate_level1": 3.0,
    "commission_rate_level2": 2.0,
    "parent_wallet": "0x1234567890123456789012345678901234567890",
    "team_size": 0,
    "total_earnings": 0
  },
  "balance": 50.00,
  "usdValue": 0.004,
  "message": "钱包已连接",
  "isNewUser": true
}
```

### 测试4：错误情况 - 自己推荐自己

**请求**:
```bash
curl -X POST https://api.yourdomain.com/api/v1/wallet/connect \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x1234567890123456789012345678901234567890",
    "balance": 100.00,
    "referralWallet": "0x1234567890123456789012345678901234567890"
  }'
```

**预期响应**:
```json
{
  "error": "不能邀请自己"
}
```

---

## 部署检查清单

### 后端API部署前检查

- [ ] 数据库连接已配置（Neon PostgreSQL）
- [ ] `wallets` 表已创建
- [ ] `hierarchy` 表已创建
- [ ] ASHVA价格API已实现（`/api/v1/price/ashva`）
- [ ] 会员等级阈值已配置（GLOBAL_PARTNER_THRESHOLD=1000, MARKET_PARTNER_THRESHOLD=100）
- [ ] 默认上级地址已配置（DEFAULT_UPLINE_ADDRESS）
- [ ] 错误处理已实现
- [ ] CORS已配置允许前端域名
- [ ] API已部署到生产环境

### 前端部署前检查

- [ ] `NEXT_PUBLIC_BACKEND_API_URL` 环境变量已设置
- [ ] `lib/api-client.ts` 已创建
- [ ] 登录页面已更新使用 `apiClient`
- [ ] 错误提示已国际化
- [ ] 测试新用户注册流程
- [ ] 测试现有用户登录流程
- [ ] 测试推荐人输入流程
- [ ] 测试余额为0的情况

---

## 常见问题

### Q1: 如何处理网络超时？

**答**: 前端实现重试机制：

```typescript
const retryWithBackoff = async (fn: () => Promise<any>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)))
    }
  }
}

const result = await retryWithBackoff(() => 
  apiClient.connectWallet({ address, balance })
)
```

### Q2: 如何处理并发请求？

**答**: 后端使用数据库事务和锁：

```sql
BEGIN;
SELECT * FROM wallets WHERE wallet_address = $1 FOR UPDATE;
-- 执行更新或插入操作
COMMIT;
```

### Q3: 如何验证推荐人地址是否存在？

**答**: 后端在创建新用户前检查：

```sql
SELECT wallet_address FROM wallets 
WHERE LOWER(wallet_address) = LOWER($1)
```

如果推荐人不存在且不是默认地址，返回错误。

### Q4: 前端如何知道用户已登录？

**答**: 检查localStorage中的walletAddress：

```typescript
const isLoggedIn = !!localStorage.getItem("walletAddress")
```

### Q5: 如何处理会员等级更新？

**答**: 每次登录时重新计算：

```typescript
const usdValue = balance * ashvaPrice
const newLevel = determineMemberLevel(usdValue)
// 更新数据库中的member_level
```

---

## 总结

### 当前API

- **端点**: `POST /api/wallet/connect`
- **位置**: `app/api/wallet/connect/route.ts`
- **功能**: 验证钱包、判断等级、保存数据库

### 替换步骤

1. 在外部后端实现 `POST /api/v1/wallet/connect`
2. 确保响应格式完全一致
3. 前端添加环境变量 `NEXT_PUBLIC_BACKEND_API_URL`
4. 前端创建 `lib/api-client.ts`
5. 修改登录页面使用 `apiClient.connectWallet()`
6. 测试所有登录场景
7. 部署上线

### 关键注意事项

- 所有钱包地址必须转换为小写存储（`address.toLowerCase()`）
- 必须实现推荐人验证逻辑
- 必须实现会员等级自动计算
- 必须实现ASHVA价格实时查询
- 必须处理新用户和老用户两种情况
- 必须创建层级关系记录（`hierarchy`表）
