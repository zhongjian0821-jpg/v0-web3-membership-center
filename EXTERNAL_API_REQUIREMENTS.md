# PVE运营中心 - API对接需求文档

## 📋 概述

本文档详细说明了 v0-web3-membership-center 提供给 PVE运营中心的API接口规范。

## ⚠️ **重要提醒**

**PVE运营中心应该使用的正确API端点是 `/api/cloud-node-purchases`，不是 `/api/assignments`！**

如果您在访问时遇到 404 错误，请检查：
1. 是否使用了正确的路径：`/api/cloud-node-purchases` ✅
2. 不要使用：`/api/assignments` ❌ (这个端点需要 walletAddress 参数)

---

## 🔗 API端点列表

### 1. 获取云节点购买订单 (推荐使用)

**端点**: `GET /api/cloud-node-purchases`

**用途**: 获取所有云节点托管购买订单，包含24小时部署倒计时信息

**请求参数**:
- `wallet` (可选): 钱包地址过滤
- `status` (可选): 订单状态过滤 (`deploying` 或 `active`)
- `limit` (可选): 返回数量限制，默认100

**完整URL示例**:
\`\`\`
https://v0-web3-membership-center.vercel.app/api/cloud-node-purchases?status=deploying&limit=100
\`\`\`

**响应格式**:
\`\`\`json
{
  "success": true,
  "message": "Cloud node purchases retrieved successfully",
  "data": [
    {
      "order_id": 1,
      "node_id": "CN-1234567890-abc",
      "transaction_hash": "0x123...",
      "wallet_address": "0x1f307e4004eb5dfe7b00c39f9d697996c11f4704",
      "membership_level": "normal",
      "email": "user@example.com",
      "cpu_cores": 8,
      "memory_gb": 16,
      "storage_gb": 500,
      "purchase_price_ashva": "33333.33",
      "status": "deploying",
      "is_pending_deployment": true,
      "purchase_time": "2025-01-14T10:30:00.000Z",
      "deployment_deadline": "2025-01-15T10:30:00.000Z",
      "last_updated": "2025-01-14T10:30:00.000Z",
      "deployment_countdown_hours": 23,
      "deployment_countdown_minutes": 45,
      "deployment_countdown_seconds": 30,
      "deployment_time_expired": false,
      "deployment_progress_percent": "2.08",
      "total_earnings_ashva": "0.00"
    }
  ],
  "statistics": {
    "total_orders": 3,
    "pending_deployment": 2,
    "active_nodes": 1,
    "total_investment": "100000.00",
    "total_earnings": "0.00"
  },
  "timestamp": "2025-01-14T11:00:00.000Z",
  "api_version": "1.0"
}
\`\`\`

**关键字段说明**:

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `order_id` | number | 订单ID |
| `node_id` | string | 节点唯一标识符 |
| `wallet_address` | string | 购买者钱包地址 |
| `status` | string | 订单状态: `deploying`(部署中) 或 `active`(已激活) |
| `is_pending_deployment` | boolean | 是否等待部署 |
| `purchase_time` | ISO 8601 | 购买时间 |
| `deployment_deadline` | ISO 8601 | 部署截止时间 (购买后24小时) |
| `deployment_countdown_hours` | number | 剩余小时数 |
| `deployment_countdown_minutes` | number | 剩余分钟数 |
| `deployment_countdown_seconds` | number | 剩余秒数 |
| `deployment_time_expired` | boolean | 是否已过期 |
| `deployment_progress_percent` | string | 部署进度百分比 |
| `cpu_cores` | number | CPU核心数 |
| `memory_gb` | number | 内存大小(GB) |
| `storage_gb` | number | 存储大小(GB) |
| `purchase_price_ashva` | string | 购买价格(ASHVA) |
| `transaction_hash` | string | 区块链交易哈希 |

---

### 2. 获取用户设备分配 (备用接口)

**端点**: `GET /api/assignments`

**用途**: 获取指定钱包地址的所有节点设备

**请求参数**:
- `walletAddress` (必需): 用户钱包地址

**完整URL示例**:
\`\`\`
https://v0-web3-membership-center.vercel.app/api/assignments?walletAddress=0x1f307e4004eb5dfe7b00c39f9d697996c11f4704
\`\`\`

**响应格式**:
\`\`\`json
{
  "success": true,
  "walletAddress": "0x1f307e4004eb5dfe7b00c39f9d697996c11f4704",
  "totalAssignments": 2,
  "data": [
    {
      "id": "cb3c20f05cd89728af1",
      "userAddress": "0x1f307e4004eb5dfe7b00c39f9d697996c11f4704",
      "deviceId": "cb3c20f05cd89728af1",
      "deviceName": "云节点托管",
      "nodeType": "hosting",
      "status": "deploying",
      "specs": {
        "cpu": 8,
        "memory": 16,
        "storage": 500
      },
      "performance": {
        "uptime": "99.90",
        "cpuUsage": "45.00",
        "memoryUsage": "60.00",
        "storageUsage": "35.00",
        "dataTransferred": "0.00",
        "earnings": "¥0.00",
        "earningsCny": 0,
        "earningsAshva": 0,
        "earningsDisplay": "¥0.00 (0.00 ASHVA)"
      },
      "purchasePrice": 33333.33,
      "assignedAt": "2025-01-14T10:30:00.000Z",
      "lastUpdated": "2025-01-14T10:30:00.000Z",
      "isTransferable": false
    }
  ]
}
\`\`\`

---

## 🔐 数据库表结构

### nodes 表 (关键字段)

\`\`\`sql
CREATE TABLE nodes (
  id SERIAL PRIMARY KEY,
  node_id VARCHAR(255) UNIQUE NOT NULL,
  node_type VARCHAR(50) NOT NULL, -- 'cloud' 表示云节点托管
  wallet_address VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'deploying' 或 'active'
  cpu_cores INTEGER,
  memory_gb INTEGER,
  storage_gb INTEGER,
  purchase_price DECIMAL(20, 2),
  transaction_hash VARCHAR(255),
  total_earnings DECIMAL(20, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

---

## 📝 使用流程

### 对于PVE运营中心：

1. **定时轮询获取待部署订单**:
   \`\`\`
   GET /api/cloud-node-purchases?status=deploying&limit=100
   \`\`\`

2. **解析返回数据**:
   - 检查 `data` 数组中的每个订单
   - 使用 `wallet_address` 识别用户
   - 使用 `node_id` 作为节点唯一标识
   - 使用 `deployment_countdown_hours` 等字段显示倒计时

3. **部署云服务器**:
   - 根据 `cpu_cores`, `memory_gb`, `storage_gb` 配置规格
   - 部署完成后，通过 webhook 通知主系统更新状态

4. **更新节点状态** (由主系统处理):
   - 部署完成后，主系统会将 `status` 从 `deploying` 更新为 `active`
   - 开始记录每日收益到 `assigned_records` 表

---

## ⚠️ 重要注意事项

1. **API版本**: 当前使用 `v1.0`，请检查响应中的 `api_version` 字段
2. **缓存策略**: API响应包含 `Cache-Control: no-cache` 头，确保获取最新数据
3. **时区**: 所有时间字段使用 ISO 8601 格式 (UTC时区)
4. **错误处理**: 
   - 200: 成功
   - 400: 请求参数错误
   - 404: 资源不存在
   - 500: 服务器错误

5. **数据类型**:
   - 价格和收益字段为字符串类型 (避免浮点精度问题)
   - 使用前请转换为数字: `Number(value)`

---

## 🧪 测试步骤

### 1. 测试基本连接
\`\`\`bash
curl "https://v0-web3-membership-center.vercel.app/api/cloud-node-purchases"
\`\`\`

### 2. 测试部署中订单查询
\`\`\`bash
curl "https://v0-web3-membership-center.vercel.app/api/cloud-node-purchases?status=deploying"
\`\`\`

### 3. 测试特定钱包地址
\`\`\`bash
curl "https://v0-web3-membership-center.vercel.app/api/cloud-node-purchases?wallet=0x1f307e4004eb5dfe7b00c39f9d697996c11f4704"
\`\`\`

### 4. 验证响应格式
确保返回的JSON包含:
- ✅ `success: true`
- ✅ `data` 数组
- ✅ `statistics` 对象
- ✅ `deployment_countdown_hours` 等倒计时字段

---

## 📞 技术支持

如果API返回404错误，请检查:

1. **URL是否正确**: 确保使用完整域名 `https://v0-web3-membership-center.vercel.app`
2. **路径是否正确**: `/api/cloud-node-purchases` (不是 `/assignments`)
3. **参数格式**: 使用查询字符串 `?status=deploying&limit=100`
4. **CORS设置**: API支持跨域请求

如遇到其他问题，请提供:
- 请求URL
- 响应状态码
- 完整错误信息
- 请求时间戳

---

## 🔄 更新日志

- **v1.0** (2025-01-14): 初始版本，支持云节点购买订单查询和24小时倒计时
