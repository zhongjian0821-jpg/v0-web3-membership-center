# 外部会员中心所需的API端点

本文档列出外部会员中心（v0-web3-membership-center）项目调用本系统所需的API端点。

## 基础信息

**本系统API基础URL**: `https://your-main-system.vercel.app`

所有API都已启用CORS（`Access-Control-Allow-Origin: *`），可以从任何域名调用。

---

## 1. 会员统计 API

### GET /api/members/stats

获取系统会员统计数据

**请求示例**:
\`\`\`bash
curl https://your-main-system.vercel.app/api/members/stats
\`\`\`

**响应示例**:
\`\`\`json
{
  "totalUsers": 150,
  "levelDistribution": {
    "normal": 120,
    "market_partner": 25,
    "global_partner": 5
  },
  "totalPurchases": 300,
  "activePurchases": 280
}
\`\`\`

**字段说明**:
- `totalUsers` - 总用户数
- `levelDistribution.normal` - 普通会员数量
- `levelDistribution.market_partner` - 市场合伙人数量（持有$3,000+ ASHVA）
- `levelDistribution.global_partner` - 全球合伙人数量（持有$10,000+ ASHVA）
- `totalPurchases` - 总购买订单数
- `activePurchases` - 已激活的订单数

---

## 2. 会员列表 API

### GET /api/members

获取所有会员列表（支持分页和搜索）

**请求参数**:
- `page` (可选) - 页码，默认1
- `limit` (可选) - 每页数量，默认20
- `search` (可选) - 搜索钱包地址

**请求示例**:
\`\`\`bash
curl "https://your-main-system.vercel.app/api/members?page=1&limit=20"
\`\`\`

**响应示例**:
\`\`\`json
{
  "success": true,
  "members": [
    {
      "id": "1",
      "name": "0x1234...5678",
      "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
      "tier": "gold",
      "status": "active",
      "joinedDate": "2024-01-15T10:30:00Z",
      "referrerId": "0xabcd...ef01",
      "devicesCount": 12
    }
  ],
  "total": 150
}
\`\`\`

**字段说明**:
- `tier` - 会员等级: `bronze`（铜牌）, `silver`（银牌）, `gold`（金牌）, `platinum`（白金）, `diamond`（钻石）
- `status` - 状态: `active`（活跃）, `inactive`（不活跃）
- `devicesCount` - 用户拥有的设备数量

---

## 3. 用户设备列表 API

### GET /api/user/devices

获取指定用户的所有设备和购买记录

**请求参数**:
- `wallet` (必填) - 用户钱包地址

**请求示例**:
\`\`\`bash
curl "https://your-main-system.vercel.app/api/user/devices?wallet=0x1234567890abcdef1234567890abcdef12345678"
\`\`\`

**响应示例**:
\`\`\`json
{
  "success": true,
  "data": {
    "wallet_address": "0x1234567890abcdef1234567890abcdef12345678",
    "devices": [
      {
        "purchase_id": "CN-1234567890123-abcdef",
        "purchase_type": "cloud",
        "node_count": 1,
        "memory_gb": 32,
        "cpu_cores": 8,
        "storage_gb": 500,
        "total_amount": 24126.21,
        "total_amount_usd": 2000.0,
        "purchase_status": "active",
        "purchase_date": "2024-01-15T10:30:00Z",
        "assigned": true,
        "device_id": "pve-node-001-vm-100",
        "device_name": "Cloud Node 001",
        "device_ip": "192.168.1.100",
        "online_status": "online",
        "total_income": 150.5,
        "daily_income": 5.2,
        "assigned_at": "2024-01-15T12:00:00Z"
      },
      {
        "purchase_id": "IN-1234567890124-xyz123",
        "purchase_type": "image",
        "node_count": 1,
        "memory_gb": null,
        "cpu_cores": null,
        "storage_gb": null,
        "total_amount": 1206.31,
        "total_amount_usd": 100.0,
        "purchase_status": "deploying",
        "purchase_date": "2024-01-16T14:20:00Z",
        "assigned": false,
        "device_id": null,
        "device_name": null,
        "device_ip": null,
        "online_status": "offline",
        "total_income": 0,
        "daily_income": 0,
        "assigned_at": null
      }
    ],
    "ashva_price_usd": 0.00008291,
    "statistics": {
      "total_purchases": 2,
      "assigned_count": 1,
      "pending_count": 1,
      "cloud_nodes": 1,
      "image_nodes": 1
    }
  }
}
\`\`\`

**字段说明**:

购买信息:
- `purchase_type` - 购买类型: `cloud`（2000U云节点托管）, `image`（100U镜像安装）
- `purchase_status` - 订单状态: `pending`（待支付）, `deploying`（配置中）, `active`（已激活）
- `total_amount` - ASHVA代币支付金额
- `total_amount_usd` - USD等值金额

设备分配信息:
- `assigned` - 是否已分配设备（true=已分配, false=待分配）
- `device_id` - 设备ID（PVE虚拟机标识）
- `online_status` - 在线状态: `online`（在线）, `offline`（离线）

收益信息:
- `total_income` - 累计收益（ASHVA）
- `daily_income` - 每日收益（ASHVA）

---

## 节点类型说明

系统支持两种节点购买类型：

### 1. 云节点托管 (Cloud Node Hosting)
- **价格**: 2000 USD
- **类型标识**: `cloud`
- **说明**: 用户购买后，由PVE运营中心托管云服务器
- **配置**: 可自定义内存、CPU、存储
- **设备分配**: 购买后会分配到PVE虚拟机
- **收益**: 每日产生ASHVA代币收益

### 2. 镜像安装 (Image Installation)
- **价格**: 100 USD
- **类型标识**: `image`
- **说明**: 用户在自己的硬件上安装节点镜像
- **配置**: 无需指定配置
- **设备分配**: 可能不会分配设备ID
- **收益**: 根据节点运行情况产生收益

---

## 会员等级系统

系统根据ASHVA持有量自动判定会员等级：

| 等级 | 英文标识 | ASHVA持有量 | 权益 |
|------|---------|------------|------|
| 普通会员 | normal | < $3,000 | 5%总收益权，管理2层团队 |
| 市场合伙人 | market_partner | ≥ $3,000 | 10%总收益权，管理10层团队 |
| 全球合伙人 | global_partner | ≥ $10,000 | 5%总收益权，管理100层团队 |

---

## 错误处理

所有API遵循统一的错误响应格式：

\`\`\`json
{
  "success": false,
  "error": "错误信息",
  "details": "详细错误信息（可选）"
}
\`\`\`

常见HTTP状态码：
- `200` - 成功
- `400` - 请求参数错误
- `404` - 资源不存在
- `500` - 服务器内部错误

---

## 注意事项

1. 所有API已启用CORS，可以从任何域名调用
2. 钱包地址不区分大小写
3. ASHVA价格实时从DEXScreener获取
4. 设备分配信息依赖PVE运营中心API返回
5. 建议添加请求超时处理（建议10秒）
6. 生产环境请将基础URL替换为实际部署地址

---

## 集成检查清单

- [ ] 配置正确的API基础URL
- [ ] 测试 `/api/members/stats` 端点
- [ ] 测试 `/api/members` 端点（分页功能）
- [ ] 测试 `/api/user/devices` 端点（带钱包地址参数）
- [ ] 验证CORS是否正常工作
- [ ] 处理API错误响应
- [ ] 添加加载状态和错误提示
- [ ] 测试ASHVA价格显示是否正确

---

## 技术支持

如有API对接问题，请检查：
1. 网络连接是否正常
2. API URL是否正确
3. 请求参数格式是否正确
4. 查看浏览器控制台Network标签页的详细错误信息
