# 外部系统API调用指南

## 概述

本文档说明外部会员中心如何调用本系统的API接口。所有API都已配置CORS跨域支持，可以直接从外部域名调用。

---

## 1. 获取会员信息

### 接口地址
\`\`\`
GET /api/member
\`\`\`

### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| address | string | 是 | 钱包地址（或使用 wallet 参数） |
| wallet | string | 是 | 钱包地址（与 address 二选一） |

### 请求示例
\`\`\`bash
# 使用 address 参数
curl "https://your-domain.com/api/member?address=0x1234...abcd"

# 使用 wallet 参数（兼容）
curl "https://your-domain.com/api/member?wallet=0x1234...abcd"
\`\`\`

### 响应格式
\`\`\`json
{
  "address": "0x1234...abcd",
  "memberType": "market_partner",
  "balance": 150000,
  "ashvaBalance": "150,000.00 ASHVA",
  "ashvaValueUSD": 4500,
  "ashvaPrice": 0.03,
  "directTeam": 5,
  "totalTeam": 23,
  "totalEarnings": "1,250.50 ASHVA",
  "level1Commission": 25,
  "level2Commission": 15,
  "upgradeProgress": {
    "currentValue": 4500,
    "requiredValue": 10000,
    "progressPercentage": 45,
    "shortfall": 5500,
    "targetLevel": "global_partner"
  },
  "createdAt": "2024-01-15T08:30:00Z"
}
\`\`\`

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| address | string | 钱包地址 |
| memberType | string | 会员等级：`normal` / `market_partner` / `global_partner` |
| balance | number | ASHVA余额（数字） |
| ashvaBalance | string | ASHVA余额（格式化字符串） |
| ashvaValueUSD | number | ASHVA的USD价值 |
| ashvaPrice | number | 当前ASHVA单价（USD） |
| directTeam | number | 直推团队人数 |
| totalTeam | number | 总团队人数 |
| totalEarnings | string | 累计收益（格式化字符串） |
| level1Commission | number | 直推佣金比例（%） |
| level2Commission | number | 间推佣金比例（%） |
| upgradeProgress | object | 升级进度信息 |
| upgradeProgress.currentValue | number | 当前USD价值 |
| upgradeProgress.requiredValue | number | 升级所需USD价值 |
| upgradeProgress.progressPercentage | number | 升级进度百分比 |
| upgradeProgress.shortfall | number | 距离升级还差的USD价值 |
| upgradeProgress.targetLevel | string | 目标等级 |
| createdAt | string | 账户创建时间 |

### 会员等级说明

| 等级 | memberType | 要求 | 总佣金比例 | 管理层级 |
|------|-----------|------|-----------|---------|
| 普通会员 | normal | 无 | 5% | 2层 |
| 市场合伙人 | market_partner | ≥$3,000 ASHVA | 10% | 10层 |
| 全球合伙人 | global_partner | ≥$10,000 ASHVA | 5% | 100层 |

### 错误响应

\`\`\`json
{
  "error": "错误信息"
}
\`\`\`

**常见错误码**：
- `400` - 缺少钱包地址参数
- `404` - 未找到钱包数据
- `500` - 服务器内部错误

---

## 2. 获取会员列表

### 接口地址
\`\`\`
GET /api/members
\`\`\`

### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| wallet | string | 否 | 筛选特定钱包地址 |

### 请求示例
\`\`\`bash
# 获取所有会员
curl "https://your-domain.com/api/members"

# 筛选特定会员
curl "https://your-domain.com/api/members?wallet=0x1234...abcd"
\`\`\`

### 响应格式
\`\`\`json
{
  "members": [
    {
      "wallet_address": "0x1234...abcd",
      "member_level": "market_partner",
      "ashva_balance": "150000.00",
      "total_earnings": "1250.50",
      "parent_wallet": "0x5678...efgh",
      "direct_referrals": 5,
      "team_size": 23,
      "created_at": "2024-01-15T08:30:00Z"
    }
  ]
}
\`\`\`

---

## 3. 获取用户设备列表

### 接口地址
\`\`\`
GET /api/user/devices
\`\`\`

### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| wallet | string | 是 | 钱包地址 |

### 请求示例
\`\`\`bash
curl "https://your-domain.com/api/user/devices?wallet=0x1234...abcd"
\`\`\`

### 响应格式
\`\`\`json
{
  "purchases": [
    {
      "node_id": "CN-1234567890-abc123",
      "node_type": "cloud",
      "purchase_price": 200000,
      "purchase_price_display": "$2,000.00",
      "status": "active",
      "staking_amount": "10000.00",
      "purchased_at": "2024-01-20T10:00:00Z",
      "device": {
        "pve_node_id": "pve-001",
        "vm_id": "100",
        "ip_address": "192.168.1.100",
        "online_status": "online",
        "daily_earnings": "50.00",
        "assigned_at": "2024-01-20T12:00:00Z"
      }
    }
  ]
}
\`\`\`

### 节点类型说明

| node_type | 说明 | 价格 |
|-----------|------|------|
| cloud | 云节点托管 | $2,000 USD |
| image | 镜像安装 | $100 USD |

---

## JavaScript调用示例

### 使用 Fetch API

\`\`\`javascript
// 获取会员信息
async function getMemberInfo(walletAddress) {
  try {
    const response = await fetch(
      `https://your-domain.com/api/member?wallet=${walletAddress}`
    )
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('获取会员信息失败:', error)
    throw error
  }
}

// 使用示例
getMemberInfo('0x1234...abcd')
  .then(memberData => {
    console.log('会员等级:', memberData.memberType)
    console.log('ASHVA余额:', memberData.ashvaBalance)
    console.log('团队人数:', memberData.totalTeam)
  })
  .catch(error => {
    console.error('错误:', error)
  })
\`\`\`

### 使用 Axios

\`\`\`javascript
import axios from 'axios'

// 获取会员信息
async function getMemberInfo(walletAddress) {
  try {
    const response = await axios.get('https://your-domain.com/api/member', {
      params: { wallet: walletAddress }
    })
    return response.data
  } catch (error) {
    console.error('获取会员信息失败:', error)
    throw error
  }
}

// 获取设备列表
async function getUserDevices(walletAddress) {
  try {
    const response = await axios.get('https://your-domain.com/api/user/devices', {
      params: { wallet: walletAddress }
    })
    return response.data
  } catch (error) {
    console.error('获取设备列表失败:', error)
    throw error
  }
}
\`\`\`

---

## CORS配置说明

所有API端点已配置CORS跨域支持：
- `Access-Control-Allow-Origin: *` - 允许所有域名访问
- `Access-Control-Allow-Methods: GET, POST, OPTIONS` - 支持的HTTP方法
- `Access-Control-Allow-Headers: Content-Type, Authorization` - 允许的请求头

这意味着你可以直接从前端JavaScript调用这些API，无需配置代理。

---

## 注意事项

1. **钱包地址格式**: 支持大小写混合，API内部会统一转换为小写处理
2. **参数兼容性**: `/api/member` 同时支持 `address` 和 `wallet` 参数
3. **数据更新**: 会员等级会根据ASHVA持仓自动更新
4. **价格获取**: ASHVA价格从DEXScreener实时获取，如果失败会使用默认值
5. **团队层级**: 不同会员等级可查看的团队层级不同
   - 普通会员: 2层
   - 市场合伙人: 10层
   - 全球合伙人: 100层

---

## 技术支持

如有API调用问题，请检查：
1. 钱包地址是否正确
2. 网络请求是否成功
3. 返回的错误信息
4. 浏览器控制台是否有CORS错误
