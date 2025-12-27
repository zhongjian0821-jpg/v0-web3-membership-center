# Web3 Membership System - API 接口规范文档

> 此文档是前端（v0项目A）和后端（v0项目B）之间的协作契约
> 
> 版本：v1.0  
> 更新时间：2024-01-24

---

## 基础信息

### 后端服务地址

- **开发环境**: `http://localhost:4000`
- **生产环境**: `https://api.yourdomain.com`

### 通用规范

#### 请求头（Headers）

所有API请求必须包含：

```
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>  // 除登录接口外都需要
```

#### 响应格式

所有API响应统一格式：

```typescript
// 成功响应
{
  "success": true,
  "data": { ... },
  "message": "操作成功"  // 可选
}

// 错误响应
{
  "success": false,
  "error": "错误信息",
  "code": "ERROR_CODE"  // 错误代码
}
```

#### HTTP状态码

- `200` - 请求成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未授权（token无效或过期）
- `403` - 无权限
- `404` - 资源不存在
- `500` - 服务器内部错误

---

## 模块1：用户认证与钱包管理（6个接口）

### 1.1 钱包连接验证

**接口**: `POST /api/v1/wallet/connect`  
**优先级**: ⭐⭐⭐  
**前端使用**: 登录页面（app/(auth)/page.tsx）

**请求参数**:
```typescript
{
  walletAddress: string;      // 钱包地址（必填）
  signature?: string;         // 签名（可选，用于验证）
  message?: string;          // 签名消息（可选）
}
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

**前端实现示例**:
```typescript
const result = await apiClient.connectWallet({
  walletAddress: address,
  signature: signedMessage,
  message: originalMessage
});

// 保存 token
localStorage.setItem('auth_token', result.data.token);
```

---

### 1.2 验证ASHVA余额

**接口**: `GET /api/v1/wallet/verify-ashva`  
**优先级**: ⭐⭐⭐  
**前端使用**: 登录验证（app/(auth)/page.tsx）

**查询参数**:
```
?walletAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
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

### 1.3 获取钱包基本信息

**接口**: `GET /api/v1/wallet/info`  
**优先级**: ⭐⭐  
**前端使用**: 多处使用

**查询参数**:
```
?walletAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
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
    "parentWallet": "0x1234...",
    "registeredAt": "2024-01-01T00:00:00Z",
    "lastActiveAt": "2024-01-24T10:30:00Z"
  }
}
```

---

### 1.4 获取推荐人状态

**接口**: `GET /api/v1/wallet/referral-status`  
**优先级**: ⭐⭐  
**前端使用**: 推荐关系查询

**查询参数**:
```
?walletAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "hasReferrer": true,
    "referrerAddress": "0x1234567890abcdef...",
    "referrerLevel": "global_partner",
    "canChangeReferrer": false,
    "referralCode": "ABC123",
    "referredCount": 15
  }
}
```

---

### 1.5 更新推荐人关系

**接口**: `POST /api/v1/wallet/update-referral`  
**优先级**: ⭐⭐  
**前端使用**: 设置推荐人页面（app/set-referral/page.tsx）

**请求参数**:
```typescript
{
  walletAddress: string;        // 用户钱包地址
  parentWallet: string;         // 推荐人钱包地址
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "parentWallet": "0x1234567890abcdef...",
    "updatedAt": "2024-01-24T10:30:00Z"
  },
  "message": "推荐人设置成功"
}
```

**错误示例**:
```json
{
  "success": false,
  "error": "该钱包已有推荐人，无法修改",
  "code": "REFERRER_ALREADY_SET"
}
```

---

### 1.6 同步钱包数据

**接口**: `POST /api/v1/wallet/sync`  
**优先级**: ⭐  
**前端使用**: 管理员功能

**请求参数**:
```typescript
{
  walletAddress: string;
  forceSync?: boolean;         // 强制同步（默认false）
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

## TypeScript 类型定义

以下类型定义应在前后端项目中保持一致：

```typescript
// 会员等级枚举
export enum MemberLevel {
  NORMAL = 'normal',
  BRONZE_PARTNER = 'bronze_partner',
  SILVER_PARTNER = 'silver_partner', 
  GOLD_PARTNER = 'gold_partner',
  GLOBAL_PARTNER = 'global_partner'
}

// 钱包连接请求
export interface WalletConnectRequest {
  walletAddress: string;
  signature?: string;
  message?: string;
}

// 钱包连接响应
export interface WalletConnectResponse {
  walletAddress: string;
  ashvaBalance: number;
  ashvaBalanceUSD: number;
  memberLevel: MemberLevel;
  hasReferrer: boolean;
  isRegistered: boolean;
  token: string;
}

// 钱包信息
export interface WalletInfo {
  walletAddress: string;
  memberLevel: MemberLevel;
  memberLevelDisplay: string;
  totalEarnings: number;
  distributableCommission: number;
  distributedCommission: number;
  parentWallet: string | null;
  registeredAt: string;
  lastActiveAt: string;
}

// 推荐人状态
export interface ReferralStatus {
  hasReferrer: boolean;
  referrerAddress: string | null;
  referrerLevel: MemberLevel | null;
  canChangeReferrer: boolean;
  referralCode: string;
  referredCount: number;
}

// API响应包装
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}
```

---

## 环境变量配置

### 后端项目（v0项目B）需要的环境变量

```env
# 数据库连接
DATABASE_URL=postgresql://user:password@host:5432/database

# 服务器配置
PORT=4000
NODE_ENV=production

# 区块链配置
RPC_URL=https://mainnet.base.org
ASHVA_CONTRACT_ADDRESS=0x8fce07A7F48886B53d295774c6F18BA53A86B6D

# JWT认证
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# CORS配置
CORS_ORIGINS=https://member.yourdomain.com,http://localhost:3000

# Moralis API（用于链上数据查询）
MORALIS_API_KEY=your-moralis-api-key
```

### 前端项目（v0项目A）需要的环境变量

```env
# 后端API地址
NEXT_PUBLIC_BACKEND_API_URL=https://api.yourdomain.com

# 钱包连接
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your-client-id

# 合约地址
NEXT_PUBLIC_ASHVA_CONTRACT_ADDRESS=0x8fce07A7F48886B53d295774c6F18BA53A86B6D
NEXT_PUBLIC_RECIPIENT_WALLET=0x...

# Dynamic 认证（如果使用）
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your-env-id
```

---

## 错误代码规范

| 错误代码 | HTTP状态 | 说明 |
|---------|---------|------|
| `WALLET_NOT_FOUND` | 404 | 钱包地址不存在 |
| `INSUFFICIENT_BALANCE` | 400 | ASHVA余额不足 |
| `REFERRER_ALREADY_SET` | 400 | 推荐人已设置，无法修改 |
| `INVALID_REFERRER` | 400 | 推荐人地址无效 |
| `INVALID_TOKEN` | 401 | JWT token无效或过期 |
| `DATABASE_ERROR` | 500 | 数据库操作失败 |
| `BLOCKCHAIN_ERROR` | 500 | 区块链查询失败 |

---

## 测试用例

### Postman/HTTPie 测试示例

```bash
# 1. 钱包连接
curl -X POST https://api.yourdomain.com/api/v1/wallet/connect \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }'

# 2. 验证余额
curl -X GET "https://api.yourdomain.com/api/v1/wallet/verify-ashva?walletAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"

# 3. 获取钱包信息（需要token）
curl -X GET "https://api.yourdomain.com/api/v1/wallet/info?walletAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## 版本历史

- **v1.0** (2024-01-24) - 初始版本，包含6个钱包管理接口

---

## 联系方式

- **前端开发**: v0项目A
- **后端开发**: v0项目B
- **协作方式**: 通过此文档同步接口定义
