# Web3会员中心 - 完整API接口文档

**版本**: v1.0  
**更新时间**: 2024年12月  
**基础URL**: `https://your-domain.com/api`

---

## 📋 目录

- [用户与会员管理](#用户与会员管理)
- [节点与购买管理](#节点与购买管理)
- [设备与分配管理](#设备与分配管理)
- [佣金与收益管理](#佣金与收益管理)
- [提现管理](#提现管理)
- [团队管理](#团队管理)
- [转售市场](#转售市场)
- [数据同步](#数据同步)
- [系统工具](#系统工具)
- [后台管理](#后台管理)

---

## 用户与会员管理

### 1. 获取会员信息
\`\`\`http
GET /api/member?wallet={address}
\`\`\`

**描述**: 获取用户的完整会员信息

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| wallet | string | 是 | 用户钱包地址 |

**响应示例**:
\`\`\`json
{
  "walletAddress": "0x123...",
  "memberType": "market_partner",
  "memberLabel": "市场合伙人",
  "ashvaBalance": 50000,
  "ashvaValueUSD": 10000,
  "teamRewards": 1500.50,
  "nodeEarnings": 800.25,
  "directReferrals": 10,
  "teamSize": 50,
  "upgradeProgress": {
    "currentLevel": "market_partner",
    "nextLevel": "global_partner",
    "progress": 33.33,
    "shortfall": 6666.67
  }
}
\`\`\`

---

### 2. 获取所有会员列表
\`\`\`http
GET /api/members?wallet={address}
\`\`\`

**描述**: 查询所有注册用户列表

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| wallet | string | 否 | 筛选特定钱包地址 |

**响应示例**:
\`\`\`json
[
  {
    "wallet_address": "0x123...",
    "member_level": "market_partner",
    "ashva_balance": 50000,
    "total_earnings": 2300.75,
    "direct_referrals": 10,
    "team_size": 50,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
\`\`\`

---

### 3. 连接钱包
\`\`\`http
POST /api/wallet/connect
\`\`\`

**描述**: 用户首次连接钱包或登录

**请求体**:
\`\`\`json
{
  "walletAddress": "0x123...",
  "referralCode": "ABC123"
}
\`\`\`

**响应示例**:
\`\`\`json
{
  "success": true,
  "wallet": {
    "address": "0x123...",
    "member_level": "normal",
    "ashva_balance": 0,
    "parent_wallet": "0x456..."
  }
}
\`\`\`

---

### 4. 获取钱包信息
\`\`\`http
GET /api/wallet?address={address}
\`\`\`

**描述**: 查询钱包的基本信息

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| address | string | 是 | 钱包地址 |

---

### 5. 获取推荐人状态
\`\`\`http
GET /api/wallet/referral-status?wallet={address}
\`\`\`

**描述**: 查看用户的推荐关系

**响应示例**:
\`\`\`json
{
  "hasReferral": true,
  "referralWallet": "0x456...",
  "referralCode": "ABC123"
}
\`\`\`

---

### 6. 更新推荐人
\`\`\`http
POST /api/wallet/update-referral
\`\`\`

**描述**: 设置或更新推荐人

**请求体**:
\`\`\`json
{
  "wallet": "0x123...",
  "referralWallet": "0x456..."
}
\`\`\`

---

### 7. 验证ASHVA持有量
\`\`\`http
POST /api/verify-ashva
\`\`\`

**描述**: 验证用户是否有足够ASHVA升级会员等级

**请求体**:
\`\`\`json
{
  "walletAddress": "0x123..."
}
\`\`\`

**响应示例**:
\`\`\`json
{
  "verified": true,
  "balance": 50000,
  "valueUSD": 10000
}
\`\`\`

---

### 8. 验证签名
\`\`\`http
POST /api/auth/verify-signature
\`\`\`

**描述**: 验证钱包签名

**请求体**:
\`\`\`json
{
  "signature": "0xabc...",
  "message": "Sign in to Web3 Membership Center",
  "address": "0x123..."
}
\`\`\`

---

## 节点与购买管理

### 9. 购买云节点托管（2000U）
\`\`\`http
POST /api/purchase/cloud-node
\`\`\`

**描述**: 购买2000U云节点托管服务

**请求体**:
\`\`\`json
{
  "walletAddress": "0x123...",
  "memory": 16,
  "cpu": 4,
  "storage": 500,
  "referralCode": "ABC123"
}
\`\`\`

**响应示例**:
\`\`\`json
{
  "success": true,
  "nodeId": "CN-1234567890-abc123",
  "purchasePrice": 200000,
  "stakingAmount": 100000,
  "status": "deploying"
}
\`\`\`

---

### 10. 购买镜像安装（100U）
\`\`\`http
POST /api/purchase/image-node
\`\`\`

**描述**: 购买100U镜像安装服务

**请求体**:
\`\`\`json
{
  "walletAddress": "0x123...",
  "referralCode": "ABC123"
}
\`\`\`

**响应示例**:
\`\`\`json
{
  "success": true,
  "nodeId": "IN-1234567890-xyz789",
  "purchasePrice": 10000,
  "status": "pending"
}
\`\`\`

---

### 11. 获取购买记录列表
\`\`\`http
GET /api/purchases?wallet={address}
\`\`\`

**描述**: 查看用户的所有购买记录

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| wallet | string | 否 | 筛选钱包地址 |

**响应示例**:
\`\`\`json
[
  {
    "node_id": "CN-1234567890-abc123",
    "node_type": "cloud",
    "purchase_price": 200000,
    "purchase_price_ashva": 1000000,
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
\`\`\`

---

### 12. 获取购买统计摘要
\`\`\`http
GET /api/purchases/summary
\`\`\`

**描述**: 获取购买数据概览

**响应示例**:
\`\`\`json
{
  "totalPurchases": 150,
  "totalRevenue": 250000,
  "cloudNodeCount": 100,
  "imageNodeCount": 50,
  "statusBreakdown": {
    "active": 120,
    "deploying": 20,
    "pending": 10
  }
}
\`\`\`

---

### 13. Webhook接收购买通知
\`\`\`http
POST /api/purchases/webhook
\`\`\`

**描述**: 接收外部支付系统的购买通知

---

### 14. 获取云节点购买订单
\`\`\`http
GET /api/cloud-node-purchases?wallet={address}
\`\`\`

**描述**: PVE运营中心查询待分配的云节点订单

**响应示例**:
\`\`\`json
[
  {
    "node_id": "CN-1234567890-abc123",
    "wallet_address": "0x123...",
    "memory_gb": 16,
    "cpu_cores": 4,
    "storage_gb": 500,
    "staking_amount": 100000,
    "status": "deploying",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
\`\`\`

---

### 15. 云节点购买健康检查
\`\`\`http
GET /api/cloud-node-purchases/health
\`\`\`

**描述**: 检查API服务状态

**响应示例**:
\`\`\`json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z"
}
\`\`\`

---

### 16. 云节点购买调试信息
\`\`\`http
GET /api/cloud-node-purchases/debug
\`\`\`

**描述**: 开发调试接口

---

### 17. 获取镜像安装订单
\`\`\`http
GET /api/image-node-purchases?wallet={address}
\`\`\`

**描述**: 查询镜像安装订单

**响应示例**:
\`\`\`json
[
  {
    "node_id": "IN-1234567890-xyz789",
    "wallet_address": "0x123...",
    "purchase_price": 10000,
    "status": "pending",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
\`\`\`

---

### 18. 镜像安装统计
\`\`\`http
GET /api/image-node-purchases/stats
\`\`\`

**描述**: 获取镜像安装统计数据

**响应示例**:
\`\`\`json
{
  "totalCount": 50,
  "pendingCount": 10,
  "completedCount": 40
}
\`\`\`

---

### 19. 镜像安装摘要
\`\`\`http
GET /api/image-node-purchases/summary
\`\`\`

**描述**: 快速查看镜像安装数据摘要

---

### 20. 获取节点列表
\`\`\`http
GET /api/nodes?wallet={address}&status={status}
\`\`\`

**描述**: 查询所有节点

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| wallet | string | 否 | 筛选钱包地址 |
| status | string | 否 | 筛选状态 (pending/deploying/active/failed) |

---

### 21. 创建节点
\`\`\`http
POST /api/nodes
\`\`\`

**描述**: 手动创建节点记录（管理员使用）

---

### 22. 更新节点状态
\`\`\`http
POST /api/nodes/update-status
\`\`\`

**描述**: 批量更新节点状态

**请求体**:
\`\`\`json
{
  "nodeIds": ["CN-123", "CN-456"],
  "status": "active"
}
\`\`\`

---

### 23. 查询节点状态
\`\`\`http
GET /api/nodes/update-status?nodeId={id}
\`\`\`

**描述**: 查询特定节点状态信息

---

### 24. 手动更新节点状态
\`\`\`http
POST /api/manual-update-status
\`\`\`

**描述**: 管理员手动修复节点状态（用于状态不同步）

**请求体**:
\`\`\`json
{
  "wallet_address": "0xcad1b8d22aa7a97d8b19cfb0b37f69ecb3f92bda",
  "new_status": "active"
}
\`\`\`

或

\`\`\`json
{
  "node_id": "CN-1234567890-abc123",
  "new_status": "active"
}
\`\`\`

**响应示例**:
\`\`\`json
{
  "success": true,
  "updated": 1,
  "node_id": "CN-1234567890-abc123",
  "new_status": "active"
}
\`\`\`

---

### 25. 获取订单列表
\`\`\`http
GET /api/orders
\`\`\`

**描述**: 查看系统所有订单

---

### 26. 获取云节点列表
\`\`\`http
GET /api/cloud-nodes?wallet={address}
\`\`\`

**描述**: 查询云节点列表

---

## 设备与分配管理

### 27. 获取设备分配记录
\`\`\`http
GET /api/assignments?wallet={address}
\`\`\`

**描述**: 查看PVE运营中心分配的设备

**响应示例**:
\`\`\`json
[
  {
    "node_id": "CN-1234567890-abc123",
    "pve_node_id": "pve-node-001",
    "vm_id": "100",
    "ip_address": "192.168.1.100",
    "online_status": true,
    "assigned_at": "2024-01-01T00:00:00Z"
  }
]
\`\`\`

---

### 28. 设备分配统计
\`\`\`http
GET /api/assignments/stats
\`\`\`

**描述**: 查看设备分配统计概况

**响应示例**:
\`\`\`json
{
  "totalAssigned": 100,
  "onlineDevices": 95,
  "pendingAssignments": 20
}
\`\`\`

---

### 29. 获取分配记录详情
\`\`\`http
GET /api/assigned-records?wallet={address}
\`\`\`

**描述**: 查询设备分配详情

---

### 30. 分配记录摘要
\`\`\`http
GET /api/assigned-records/summary?wallet={address}
\`\`\`

**描述**: 快速查看分配情况摘要

---

### 31. 同步PVE分配记录
\`\`\`http
POST /api/assigned-records/sync
\`\`\`

**描述**: 从PVE运营中心同步设备分配数据

**响应示例**:
\`\`\`json
{
  "success": true,
  "synced": 50,
  "errors": 0
}
\`\`\`

---

### 32. 删除云节点分配
\`\`\`http
POST /api/cloud-node-assignments/delete
\`\`\`

**描述**: 删除设备分配记录

**请求体**:
\`\`\`json
{
  "assignment_id": "assign-123"
}
\`\`\`

---

### 33. 获取用户设备列表
\`\`\`http
GET /api/user/devices?wallet={address}
\`\`\`

**描述**: 外部团队查询用户设备（包含购买+分配信息）

**响应示例**:
\`\`\`json
[
  {
    "node_id": "CN-1234567890-abc123",
    "node_type": "cloud",
    "status": "active",
    "memory_gb": 16,
    "cpu_cores": 4,
    "storage_gb": 500,
    "device": {
      "pve_node_id": "pve-node-001",
      "vm_id": "100",
      "ip_address": "192.168.1.100",
      "online_status": true
    },
    "earnings": {
      "total": 150.50,
      "today": 5.25
    }
  }
]
\`\`\`

---

### 34. 获取客户设备信息
\`\`\`http
GET /api/customer/devices?wallet={address}
\`\`\`

**描述**: 客户查询自己的设备

---

### 35. 代理：分配记录
\`\`\`http
GET /api/proxy/assigned-records
\`\`\`

**描述**: 代理访问分配记录

---

### 36. 代理：分配摘要
\`\`\`http
GET /api/proxy/assigned-records/summary
\`\`\`

**描述**: 代理访问分配摘要

---

## 佣金与收益管理

### 37. 获取佣金记录
\`\`\`http
GET /api/commissions?wallet={address}
\`\`\`

**描述**: 查看用户的佣金收入记录

**响应示例**:
\`\`\`json
[
  {
    "id": 1,
    "wallet_address": "0x123...",
    "from_wallet": "0x456...",
    "amount": 60.00,
    "commission_type": "direct",
    "source_transaction": "purchase-123",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
\`\`\`

---

### 38. 获取佣金详情
\`\`\`http
GET /api/commissions/details?wallet={address}
\`\`\`

**描述**: 查看佣金明细信息

---

### 39. 获取佣金配置
\`\`\`http
GET /api/commission-config?wallet={address}
\`\`\`

**描述**: 查看合伙人的自定义佣金分配配置

**响应示例**:
\`\`\`json
{
  "wallet_address": "0x123...",
  "member_level": "market_partner",
  "level_1_percentage": 5.0,
  "level_2_percentage": 2.0,
  "level_3_percentage": 1.0,
  "level_4_percentage": 0.5,
  "level_5_percentage": 0.5,
  "level_6_percentage": 0.3,
  "level_7_percentage": 0.2,
  "level_8_percentage": 0.2,
  "level_9_percentage": 0.2,
  "level_10_percentage": 0.1
}
\`\`\`

---

### 40. 更新佣金配置
\`\`\`http
POST /api/commission-config
\`\`\`

**描述**: 合伙人自定义各层级佣金分配比例

**请求体**:
\`\`\`json
{
  "wallet_address": "0x123...",
  "level_1_percentage": 5.0,
  "level_2_percentage": 2.0,
  "level_3_percentage": 1.0,
  "level_4_percentage": 0.5,
  "level_5_percentage": 0.5,
  "level_6_percentage": 0.3,
  "level_7_percentage": 0.2,
  "level_8_percentage": 0.2,
  "level_9_percentage": 0.2,
  "level_10_percentage": 0.1
}
\`\`\`

**注意**: 
- 总和不能超过用户会员等级的总佣金比例
- 普通会员：5%（固定，不可修改）
- 市场合伙人：10%（可自定义分配）
- 全球合伙人：5%（可自定义分配）

---

### 41. 获取收益摘要
\`\`\`http
GET /api/earnings/summary?wallet={address}
\`\`\`

**描述**: 查看用户总收益摘要

---

### 42. 获取收益明细
\`\`\`http
GET /api/earnings/breakdown?wallet={address}
\`\`\`

**描述**: 查看收益来源明细（团队奖励+节点收益）

---

## 提现管理

### 43. 发起提现
\`\`\`http
POST /api/withdraw
\`\`\`

**描述**: 用户申请提现

**请求体**:
\`\`\`json
{
  "walletAddress": "0x123...",
  "amount": 1000.50,
  "withdrawalType": "team_rewards"
}
\`\`\`

**withdrawalType可选值**:
- `team_rewards` - 团队奖励
- `node_earnings` - 节点收益

**响应示例**:
\`\`\`json
{
  "success": true,
  "withdrawal_id": "wd-123456",
  "status": "pending",
  "amount": 1000.50
}
\`\`\`

---

### 44. 获取提现记录
\`\`\`http
GET /api/withdraw?wallet={address}
\`\`\`

**描述**: 查询提现历史

---

### 45. 获取提现历史（新增 - 后台用）
\`\`\`http
GET /api/withdraw/history?wallet={address}&status={status}
\`\`\`

**描述**: 后台查询提现历史，支持状态筛选

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| wallet | string | 否 | 筛选钱包地址 |
| status | string | 否 | 筛选状态 (pending/completed/rejected) |

**响应示例**:
\`\`\`json
[
  {
    "id": 1,
    "wallet_address": "0x123...",
    "amount": 1000.50,
    "withdrawal_type": "team_rewards",
    "status": "pending",
    "tx_hash": null,
    "admin_notes": null,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
\`\`\`

---

### 46. 审核提现（新增 - 后台用）
\`\`\`http
POST /api/withdraw/approve
\`\`\`

**描述**: 管理员审核提现申请

**请求体**:
\`\`\`json
{
  "withdrawal_id": 1,
  "action": "approve",
  "tx_hash": "0xabc123...",
  "admin_notes": "已转账"
}
\`\`\`

或拒绝：

\`\`\`json
{
  "withdrawal_id": 1,
  "action": "reject",
  "admin_notes": "余额不足"
}
\`\`\`

**action可选值**:
- `approve` - 批准
- `reject` - 拒绝

**响应示例**:
\`\`\`json
{
  "success": true,
  "withdrawal_id": 1,
  "status": "completed",
  "tx_hash": "0xabc123..."
}
\`\`\`

---

## 团队管理

### 47. 获取团队数据
\`\`\`http
GET /api/team?wallet={address}
\`\`\`

**描述**: 查看用户的团队信息（直推团队）

**响应示例**:
\`\`\`json
{
  "directTeam": [
    {
      "wallet_address": "0x456...",
      "member_level": "normal",
      "ashva_balance": 10000,
      "direct_referrals": 5,
      "team_size": 15,
      "total_earnings": 500.00,
      "joined_at": "2024-01-01T00:00:00Z"
    }
  ],
  "teamStats": {
    "level1": 10,
    "level2": 30,
    "totalTeam": 40
  }
}
\`\`\`

---

### 48. 获取全球团队
\`\`\`http
GET /api/global-team?wallet={address}
\`\`\`

**描述**: 查看用户的全球团队数据（所有下级成员）

**响应示例**:
\`\`\`json
{
  "allTeamMembers": [
    {
      "wallet_address": "0x456...",
      "member_level": "normal",
      "depth": 1,
      "ashva_balance": 10000,
      "team_size": 15
    },
    {
      "wallet_address": "0x789...",
      "member_level": "market_partner",
      "depth": 2,
      "ashva_balance": 50000,
      "team_size": 5
    }
  ],
  "levelBreakdown": {
    "1": 10,
    "2": 30,
    "3": 20,
    "4": 10,
    "5": 5
  }
}
\`\`\`

---

### 49. 获取会员层级关系
\`\`\`http
GET /api/member/hierarchy?wallet={address}
\`\`\`

**描述**: 查看推荐关系树状结构

**响应示例**:
\`\`\`json
{
  "wallet_address": "0x123...",
  "hierarchy": [
    {
      "ancestor_wallet": "0x000...",
      "depth": 0
    },
    {
      "ancestor_wallet": "0x111...",
      "depth": 1
    }
  ]
}
\`\`\`

---

## 转售市场

### 50. 获取市场列表
\`\`\`http
GET /api/transfer/marketplace
\`\`\`

**描述**: 查看节点转售市场上所有在售节点

**响应示例**:
\`\`\`json
[
  {
    "listing_id": "list-123",
    "node_id": "CN-1234567890-abc123",
    "seller_wallet": "0x123...",
    "price": 180000,
    "node_type": "cloud",
    "memory_gb": 16,
    "cpu_cores": 4,
    "storage_gb": 500,
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
\`\`\`

---

### 51. 创建出售
\`\`\`http
POST /api/transfer/create-listing
\`\`\`

**描述**: 用户出售自己的节点

**请求体**:
\`\`\`json
{
  "node_id": "CN-1234567890-abc123",
  "price": 180000,
  "seller_wallet": "0x123..."
}
\`\`\`

**响应示例**:
\`\`\`json
{
  "success": true,
  "listing_id": "list-123",
  "status": "active"
}
\`\`\`

---

### 52. 购买节点
\`\`\`http
POST /api/transfer/purchase
\`\`\`

**描述**: 用户购买市场上的节点

**请求体**:
\`\`\`json
{
  "listing_id": "list-123",
  "buyer_wallet": "0x456..."
}
\`\`\`

**响应示例**:
\`\`\`json
{
  "success": true,
  "node_id": "CN-1234567890-abc123",
  "new_owner": "0x456..."
}
\`\`\`

---

### 53. 取消出售
\`\`\`http
POST /api/transfer/cancel-listing
\`\`\`

**描述**: 卖家取消出售

**请求体**:
\`\`\`json
{
  "listing_id": "list-123",
  "wallet": "0x123..."
}
\`\`\`

**响应示例**:
\`\`\`json
{
  "success": true,
  "listing_id": "list-123",
  "status": "cancelled"
}
\`\`\`

---

### 54. 我的出售列表
\`\`\`http
GET /api/transfer/my-listings?wallet={address}
\`\`\`

**描述**: 查看自己的出售记录

**响应示例**:
\`\`\`json
[
  {
    "listing_id": "list-123",
    "node_id": "CN-1234567890-abc123",
    "price": 180000,
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
\`\`\`

---

## 数据同步

### 55. 同步设备状态
\`\`\`http
POST /api/sync-device-status
\`\`\`

**描述**: 自动检查deploying节点，若PVE已分配则更新为active

**响应示例**:
\`\`\`json
{
  "success": true,
  "syncedCount": 5,
  "updatedNodes": [
    {
      "node_id": "CN-123",
      "old_status": "deploying",
      "new_status": "active"
    }
  ]
}
\`\`\`

---

### 56. 同步钱包数据
\`\`\`http
POST /api/sync-wallet
\`\`\`

**描述**: 同步用户钱包数据

**请求体**:
\`\`\`json
{
  "walletAddress": "0x123..."
}
\`\`\`

---

### 57. 获取钱包同步状态
\`\`\`http
GET /api/sync-wallet?wallet={address}
\`\`\`

**描述**: 查询钱包同步状态

---

### 58. 同步节点数据
\`\`\`http
POST /api/sync/node-data
\`\`\`

**描述**: 批量同步节点信息

---

### 59. 获取节点数据
\`\`\`http
GET /api/sync/node-data?node_id={id}
\`\`\`

**描述**: 查询节点数据

---

## 系统工具

### 60. 获取ASHVA价格
\`\`\`http
GET /api/ashva-price
\`\`\`

**描述**: 获取ASHVA当前USD价格（从DEXScreener）

**响应示例**:
\`\`\`json
{
  "price": 0.20,
  "priceUsd": "0.20",
  "timestamp": "2024-01-01T00:00:00Z",
  "source": "dexscreener"
}
\`\`\`

---

### 61. ASHVA价格预言机
\`\`\`http
GET /api/ashva-price-oracle
\`\`\`

**描述**: 获取ASHVA价格预言机数据

---

## 后台管理

### 62. 仪表盘统计（新增）
\`\`\`http
GET /api/admin/dashboard-stats
\`\`\`

**描述**: 获取后台仪表盘整体统计数据

**响应示例**:
\`\`\`json
{
  "users": {
    "total": 1500,
    "normal": 1200,
    "market_partner": 250,
    "global_partner": 50,
    "newToday": 25
  },
  "orders": {
    "total": 2500,
    "totalRevenue": 450000,
    "cloudNodes": 2000,
    "imageNodes": 500,
    "statusBreakdown": {
      "active": 2000,
      "deploying": 300,
      "pending": 200
    }
  },
  "withdrawals": {
    "pending": 50,
    "pendingAmount": 50000,
    "completed": 200,
    "completedAmount": 200000
  },
  "commissions": {
    "total": 75000,
    "today": 2500,
    "avgPerUser": 50
  },
  "devices": {
    "totalAssigned": 1800,
    "online": 1750,
    "offline": 50
  }
}
\`\`\`

---

### 63. 用户列表（新增）
\`\`\`http
GET /api/admin/users?page={page}&limit={limit}&member_level={level}&search={wallet}
\`\`\`

**描述**: 后台用户管理列表（分页）

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码（默认1） |
| limit | number | 否 | 每页数量（默认20） |
| member_level | string | 否 | 筛选等级（normal/market_partner/global_partner） |
| search | string | 否 | 搜索钱包地址 |

**响应示例**:
\`\`\`json
{
  "users": [
    {
      "wallet_address": "0x123...",
      "member_level": "market_partner",
      "ashva_balance": 50000,
      "ashva_value_usd": 10000,
      "total_earnings": 2500.50,
      "direct_referrals": 10,
      "team_size": 50,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1500,
    "totalPages": 75
  }
}
\`\`\`

---

### 64. 收入报表（新增）
\`\`\`http
GET /api/admin/revenue-report?period={period}&start_date={date}&end_date={date}
\`\`\`

**描述**: 后台财务收入报表

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| period | string | 是 | 时间周期（daily/weekly/monthly） |
| start_date | string | 否 | 开始日期（YYYY-MM-DD） |
| end_date | string | 否 | 结束日期（YYYY-MM-DD） |

**响应示例**:
\`\`\`json
{
  "period": "daily",
  "data": [
    {
      "date": "2024-01-01",
      "cloudNodeRevenue": 40000,
      "imageNodeRevenue": 5000,
      "totalRevenue": 45000,
      "orderCount": 25
    },
    {
      "date": "2024-01-02",
      "cloudNodeRevenue": 38000,
      "imageNodeRevenue": 4500,
      "totalRevenue": 42500,
      "orderCount": 23
    }
  ],
  "summary": {
    "totalRevenue": 450000,
    "cloudNodeRevenue": 400000,
    "imageNodeRevenue": 50000,
    "avgDailyRevenue": 15000
  }
}
\`\`\`

---

### 65. 系统日志（新增）
\`\`\`http
GET /api/admin/system-logs?type={type}&limit={limit}&wallet={address}
\`\`\`

**描述**: 后台查看系统操作日志

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 否 | 日志类型（purchase/withdrawal/status_change/all） |
| limit | number | 否 | 数量限制（默认100） |
| wallet | string | 否 | 筛选钱包地址 |

**响应示例**:
\`\`\`json
{
  "logs": [
    {
      "type": "purchase",
      "wallet_address": "0x123...",
      "action": "云节点托管购买",
      "details": {
        "node_id": "CN-123",
        "amount": 2000
      },
      "timestamp": "2024-01-01T00:00:00Z"
    },
    {
      "type": "withdrawal",
      "wallet_address": "0x456...",
      "action": "提现申请",
      "details": {
        "withdrawal_id": 1,
        "amount": 1000.50
      },
      "timestamp": "2024-01-01T01:00:00Z"
    },
    {
      "type": "status_change",
      "wallet_address": "0x789...",
      "action": "节点状态更新",
      "details": {
        "node_id": "CN-456",
        "old_status": "deploying",
        "new_status": "active"
      },
      "timestamp": "2024-01-01T02:00:00Z"
    }
  ],
  "total": 1500
}
\`\`\`

---

### 66. 管理云节点
\`\`\`http
GET /api/admin/cloud-nodes?wallet={address}
\`\`\`

**描述**: 后台管理云节点

**响应示例**:
\`\`\`json
[
  {
    "node_id": "CN-1234567890-abc123",
    "wallet_address": "0x123...",
    "status": "active",
    "memory_gb": 16,
    "cpu_cores": 4,
    "storage_gb": 500,
    "assigned_device": {
      "pve_node_id": "pve-node-001",
      "vm_id": "100",
      "ip_address": "192.168.1.100"
    },
    "created_at": "2024-01-01T00:00:00Z"
  }
]
\`\`\`

---

## API统计总结

**总计**: 66个API接口

**按功能模块分类**:
- 用户与会员管理: 8个
- 节点与购买管理: 18个
- 设备与分配管理: 10个
- 佣金与收益管理: 6个
- 提现管理: 4个
- 团队管理: 3个
- 转售市场: 5个
- 数据同步: 5个
- 系统工具: 2个
- 后台管理: 5个

**按HTTP方法分类**:
- GET: 50个
- POST: 16个

---

## 会员等级系统说明

系统支持三种会员等级，等级根据用户持有的ASHVA代币USD价值自动判断：

### 普通会员 (normal)
- **要求**: 默认等级，无持仓要求
- **佣金权限**: 5%总收益权（固定）
  - 直推佣金：3%
  - 间推佣金：2%
- **团队管理**: 最多2层
- **佣金配置**: 不可自定义

### 市场合伙人 (market_partner)
- **要求**: 持有 ≥ $3,000 USD 等值ASHVA
- **佣金权限**: 10%总收益权（可自定义分配）
- **团队管理**: 最多10层
- **佣金配置**: 可自定义各层级分配比例

### 全球合伙人 (global_partner)
- **要求**: 持有 ≥ $10,000 USD 等值ASHVA
- **佣金权限**: 5%总收益权（可自定义分配）
- **团队管理**: 最多100层
- **佣金配置**: 可自定义各层级分配比例

---

## 节点类型说明

### 云节点托管 (cloud)
- **价格**: 2000 USDT
- **质押**: 需质押1000 USDT等值ASHVA
- **配置**: 可选内存、CPU、存储
- **收益**: 每日托管收益（从PVE运营中心获取）
- **状态流程**: pending → deploying → active

### 镜像安装 (image)
- **价格**: 100 USDT
- **质押**: 无需质押
- **配置**: 标准配置
- **收益**: 无收益，仅提供安装服务
- **状态流程**: pending → completed

---

## 错误码说明

所有API遵循统一的错误响应格式：

\`\`\`json
{
  "error": "错误描述",
  "code": "ERROR_CODE",
  "details": {}
}
\`\`\`

**常见错误码**:
- `INVALID_WALLET` - 无效的钱包地址
- `INSUFFICIENT_BALANCE` - 余额不足
- `PERMISSION_DENIED` - 权限不足
- `NOT_FOUND` - 资源不存在
- `ALREADY_EXISTS` - 资源已存在
- `INVALID_STATUS` - 无效的状态
- `SYNC_FAILED` - 同步失败

---

## 数据库表结构概览

系统使用PostgreSQL数据库，主要表结构：

1. **wallets** - 用户钱包表
2. **nodes** - 节点购买记录表
3. **member_level_config** - 会员等级配置表
4. **hierarchy** - 团队层级关系表
5. **commission_records** - 佣金记录表
6. **commission_distribution** - 佣金分配配置表
7. **assigned_records** - 设备分配记录表
8. **withdrawal_records** - 提现记录表
9. **staking_records** - 质押记录表
10. **node_listings** - 节点交易市场表

---

## 外部依赖

### PVE运营中心API
系统依赖外部PVE运营中心提供设备分配和收益数据：

- **设备查询**: 查询用户已分配的托管设备
- **收益数据**: 获取每日托管收益记录
- **设备状态**: 查询设备在线状态

### DEXScreener API
获取ASHVA代币实时价格：

- **价格查询**: 获取ASHVA/USD实时价格
- **更新频率**: 实时更新

---

## 版本历史

### v1.0 (2024-12)
- 初始版本发布
- 包含66个API接口
- 支持完整的会员中心功能
- 新增6个后台管理API

---

## 技术支持

如有问题或需要技术支持，请联系开发团队。

**文档版本**: v1.0  
**最后更新**: 2024年12月
