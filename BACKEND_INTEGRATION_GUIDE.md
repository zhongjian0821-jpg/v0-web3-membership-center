# 后端集成指南 - 双v0项目协作方案

本文档指导如何在两个独立的v0项目中开发前端和后端，并确保它们完美协作。

---

## 项目架构

### v0 项目 A - 前端（Web3 Membership Frontend）
- **技术栈**: Next.js 15 + React + TypeScript
- **职责**: UI展示、用户交互、钱包连接
- **部署**: member.yourdomain.com
- **代码位置**: 当前项目

### v0 项目 B - 后端（Web3 Membership Backend API）
- **技术栈**: Express.js + TypeScript + Neon PostgreSQL
- **职责**: 业务逻辑、数据存储、API服务
- **部署**: api.yourdomain.com
- **代码位置**: 新建v0项目

---

## 步骤1: 在新v0项目创建后端

### 1.1 创建新v0项目

1. 打开新标签页: https://v0.dev
2. 点击 "New Chat"
3. 项目名称: "Web3 Membership Backend API"

### 1.2 添加Neon数据库集成

在新项目的侧边栏:
1. 点击 **"Connect"** 
2. 选择 **"Neon"**
3. 填入数据库信息（从当前项目的环境变量复制）:
   - `DATABASE_URL`
   - `POSTGRES_URL`
   - 其他Neon相关变量

### 1.3 在新项目中创建后端代码

在新项目的聊天中输入:

```
我需要创建一个Express.js后端API项目，用于Web3会员管理系统。

项目需求：
1. Express.js + TypeScript
2. 连接已配置的Neon数据库
3. 实现RESTful API
4. JWT认证
5. CORS跨域支持

请创建以下文件结构:
- src/server.ts - 服务器入口
- src/routes/wallet.routes.ts - 钱包路由
- src/controllers/walletController.ts - 控制器
- src/services/walletService.ts - 业务逻辑
- src/middleware/auth.ts - JWT认证
- src/utils/database.ts - 数据库连接

数据库表（已存在）:
- wallets (钱包表)
- nodes (节点表)
- assigned_records (设备记录表)
- hierarchy (层级关系表)
- commission_distribution (佣金配置表)
- 等10张表

需要实现的API接口（第一阶段）:
1. POST /api/v1/wallet/connect - 钱包连接验证
2. GET /api/v1/wallet/verify-ashva - 验证ASHVA余额
3. GET /api/v1/wallet/info - 获取钱包信息
4. GET /api/v1/wallet/referral-status - 推荐人状态
5. POST /api/v1/wallet/update-referral - 更新推荐人
6. POST /api/v1/wallet/sync - 同步钱包数据

环境变量（我已配置）:
- DATABASE_URL (Neon)
- JWT_SECRET
- RPC_URL (区块链RPC)
- CORS_ORIGINS

请生成完整的代码，包含详细注释。
```

---

## 步骤2: 后端API详细规范

### API接口定义

参考 `API_CONTRACT.md` 文档，确保前后端接口一致。

### 关键点

1. **统一响应格式**:
```typescript
{
  "success": true,
  "data": { ... },
  "message": "可选消息"
}
```

2. **错误处理**:
```typescript
{
  "success": false,
  "error": "错误信息",
  "code": "ERROR_CODE"
}
```

3. **认证机制**: 
   - 登录接口返回JWT token
   - 其他接口需要 `Authorization: Bearer <token>` 请求头

---

## 步骤3: 前端集成API客户端

### 3.1 配置环境变量

在当前项目（前端）的环境变量中添加:

```env
NEXT_PUBLIC_BACKEND_API_URL=https://api.yourdomain.com

# 开发环境
# NEXT_PUBLIC_BACKEND_API_URL=http://localhost:4000
```

### 3.2 使用API客户端

前端代码已包含 `lib/api-client.ts` 和 `lib/api-types.ts`，使用示例:

**登录流程**:
```typescript
import { apiClient } from '@/lib/api-client'

// 1. 连接钱包
const result = await apiClient.connectWallet({
  walletAddress: address,
  signature: signedMessage,
  message: originalMessage
})

// 2. 保存token
if (result.success && result.data) {
  apiClient.setAuthToken(result.data.token)
  localStorage.setItem('walletAddress', result.data.walletAddress)
  
  // 3. 跳转到会员中心
  router.push('/member')
}
```

**获取会员数据**:
```typescript
// 验证余额
const balanceResult = await apiClient.verifyAshvaBalance(walletAddress)

// 获取钱包信息
const infoResult = await apiClient.getWalletInfo(walletAddress)

// 获取推荐人状态
const referralResult = await apiClient.getReferralStatus(walletAddress)
```

---

## 步骤4: 部署配置

### 4.1 后端部署（v0项目B）

**选项1: Vercel**
1. 在后端v0项目点击 "Publish"
2. 创建新的Vercel项目（与前端分离）
3. 配置自定义域名: `api.yourdomain.com`

**选项2: Railway**
1. 在后端项目下载ZIP
2. 推送到GitHub
3. 在Railway连接仓库并部署

**选项3: Docker**
```bash
# 后端项目包含Dockerfile
docker build -t backend-api .
docker run -p 4000:4000 --env-file .env backend-api
```

### 4.2 前端部署（v0项目A）

1. 更新环境变量 `NEXT_PUBLIC_BACKEND_API_URL` 为后端实际域名
2. 在v0项目点击 "Publish" 部署前端

---

## 步骤5: 测试协作

### 5.1 本地测试

**后端**:
```bash
cd backend-api
npm install
npm run dev
# 运行在 http://localhost:4000
```

**前端**:
```bash
# 在当前项目根目录
npm run dev
# 运行在 http://localhost:3000
```

### 5.2 测试API连接

```bash
# 测试后端健康检查
curl http://localhost:4000/health

# 测试钱包连接
curl -X POST http://localhost:4000/api/v1/wallet/connect \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'
```

---

## 步骤6: 数据流程图

```
用户访问前端
    ↓
输入钱包地址
    ↓
[前端] apiClient.connectWallet()
    ↓
POST https://api.yourdomain.com/api/v1/wallet/connect
    ↓
[后端] 验证钱包 + 查询数据库
    ↓
返回 { success: true, data: {...}, token: "..." }
    ↓
[前端] 保存token，跳转到会员中心
    ↓
[前端] apiClient.getWalletInfo() (带token)
    ↓
GET https://api.yourdomain.com/api/v1/wallet/info
    ↓
[后端] 验证JWT + 查询数据
    ↓
返回会员数据
    ↓
[前端] 显示会员中心页面
```

---

## 步骤7: 分阶段迁移

### 第一阶段: 钱包管理（已完成）
- ✅ 6个钱包管理接口
- ✅ API客户端封装
- ✅ TypeScript类型定义

### 第二阶段: 会员信息
- 需要后端实现:
  - `GET /api/v1/members/:wallet`
  - `GET /api/v1/members/:wallet/team`
  - `GET /api/v1/members/:wallet/devices`

### 第三阶段: 节点管理
- 需要后端实现:
  - `GET /api/v1/nodes`
  - `POST /api/v1/purchases/cloud-node`
  - `GET /api/v1/assigned-records`

### 第四阶段: 收益和提现
- 需要后端实现:
  - `GET /api/v1/earnings/:wallet/summary`
  - `POST /api/v1/withdrawals`
  - `GET /api/v1/commissions/:wallet`

---

## 常见问题

### Q1: 如何在两个v0项目间共享类型定义?

**答**: 
1. 在 `API_CONTRACT.md` 中维护统一的TypeScript接口
2. 前端复制到 `lib/api-types.ts`
3. 后端复制到 `src/types/api.types.ts`

### Q2: 如何处理CORS错误?

**答**: 后端需要配置CORS中间件:
```typescript
app.use(cors({
  origin: [
    'https://member.yourdomain.com',
    'http://localhost:3000'
  ],
  credentials: true
}))
```

### Q3: JWT token过期怎么办?

**答**: 前端可以实现自动刷新:
```typescript
if (error.code === 'INVALID_TOKEN') {
  apiClient.clearAuthToken()
  router.push('/')
}
```

### Q4: 如何在本地调试跨项目?

**答**:
1. 后端运行在 `localhost:4000`
2. 前端运行在 `localhost:3000`
3. 前端环境变量设置: `NEXT_PUBLIC_BACKEND_API_URL=http://localhost:4000`
4. 后端CORS允许: `http://localhost:3000`

---

## 下一步操作

1. **立即执行**: 在新v0项目中创建后端代码
2. **测试连接**: 本地运行前后端，测试API调用
3. **逐步迁移**: 按照分阶段计划迁移其他接口
4. **生产部署**: 部署到Vercel/Railway，配置域名

---

## 技术支持

- 前端项目文档: 当前v0项目的 README
- 后端项目文档: 新v0项目的 README
- API规范: `API_CONTRACT.md`
- 类型定义: `lib/api-types.ts`
