# 会员等级分类 API 文档

## API端点

### 获取按等级分类的会员列表

**GET** `/api/members/by-level`

按会员等级（普通会员、市场合伙人、全球合伙人）分类返回所有用户。

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| details | string | 否 | 设置为 "true" 可获取更详细的用户信息（包含推荐人、更新时间等） |

#### 响应格式

\`\`\`json
{
  "success": true,
  "statistics": {
    "total_members": 1250,
    "normal_members_count": 1000,
    "market_partners_count": 200,
    "global_partners_count": 50,
    "normal_percentage": "80.00%",
    "market_partner_percentage": "16.00%",
    "global_partner_percentage": "4.00%"
  },
  "data": {
    "global_partners": [
      {
        "wallet_address": "0x1234...abcd",
        "member_level": "global_partner",
        "ashva_balance": 50000,
        "total_earnings": 15000,
        "direct_referrals": 100,
        "team_size": 500,
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "market_partners": [
      {
        "wallet_address": "0x5678...efgh",
        "member_level": "market_partner",
        "ashva_balance": 15000,
        "total_earnings": 5000,
        "direct_referrals": 30,
        "team_size": 100,
        "created_at": "2024-02-20T14:15:00Z"
      }
    ],
    "normal_members": [
      {
        "wallet_address": "0x9abc...ijkl",
        "member_level": "normal",
        "ashva_balance": 1000,
        "total_earnings": 500,
        "direct_referrals": 5,
        "team_size": 10,
        "created_at": "2024-03-10T09:00:00Z"
      }
    ]
  }
}
\`\`\`

#### 字段说明

**statistics（统计信息）：**
- `total_members` - 总会员数
- `normal_members_count` - 普通会员数量
- `market_partners_count` - 市场合伙人数量
- `global_partners_count` - 全球合伙人数量
- `normal_percentage` - 普通会员占比
- `market_partner_percentage` - 市场合伙人占比
- `global_partner_percentage` - 全球合伙人占比

**data（分类数据）：**
- `global_partners` - 全球合伙人列表（持有 ≥ $10,000 ASHVA）
- `market_partners` - 市场合伙人列表（持有 ≥ $3,000 ASHVA）
- `normal_members` - 普通会员列表（持有 < $3,000 ASHVA）

**每个会员的字段：**
- `wallet_address` - 钱包地址
- `member_level` - 会员等级
  - `normal` - 普通会员
  - `market_partner` - 市场合伙人
  - `global_partner` - 全球合伙人
- `ashva_balance` - ASHVA代币余额
- `total_earnings` - 累计总收益（ASHVA）
- `direct_referrals` - 直推人数
- `team_size` - 团队总人数
- `created_at` - 注册时间

**详细模式额外字段（details=true）：**
- `parent_wallet` - 推荐人钱包地址
- `updated_at` - 最后更新时间

---

## 会员等级说明

### 1. 普通会员 (normal)
- **条件**：ASHVA持仓价值 < $3,000
- **权益**：
  - 直推佣金：3%
  - 间推佣金：2%
  - 最大团队层级：2层

### 2. 市场合伙人 (market_partner)
- **条件**：ASHVA持仓价值 ≥ $3,000
- **权益**：
  - 总佣金权：10%
  - 可自定义各层级佣金分配
  - 最大团队层级：10层

### 3. 全球合伙人 (global_partner)
- **条件**：ASHVA持仓价值 ≥ $10,000
- **权益**：
  - 总佣金权：5%（管理更多层级）
  - 可自定义各层级佣金分配
  - 最大团队层级：100层

---

## 使用示例

### JavaScript/TypeScript

\`\`\`javascript
// 获取基本的会员等级分类
async function getMembersByLevel() {
  const response = await fetch('https://your-domain.com/api/members/by-level')
  const data = await response.json()
  
  console.log('总会员数:', data.statistics.total_members)
  console.log('全球合伙人数:', data.statistics.global_partners_count)
  console.log('市场合伙人数:', data.statistics.market_partners_count)
  console.log('普通会员数:', data.statistics.normal_members_count)
  
  // 获取全球合伙人列表
  const globalPartners = data.data.global_partners
  console.log('全球合伙人:', globalPartners)
  
  return data
}

// 获取详细的会员信息（包含推荐人）
async function getMembersByLevelDetailed() {
  const response = await fetch('https://your-domain.com/api/members/by-level?details=true')
  const data = await response.json()
  
  // 查看市场合伙人及其推荐人
  data.data.market_partners.forEach(partner => {
    console.log(`钱包: ${partner.wallet_address}`)
    console.log(`推荐人: ${partner.parent_wallet}`)
    console.log(`团队: ${partner.team_size}人`)
  })
  
  return data
}
\`\`\`

### cURL

\`\`\`bash
# 基本查询
curl -X GET "https://your-domain.com/api/members/by-level"

# 详细查询
curl -X GET "https://your-domain.com/api/members/by-level?details=true"
\`\`\`

### Python

\`\`\`python
import requests

# 获取会员等级分类
def get_members_by_level(include_details=False):
    url = "https://your-domain.com/api/members/by-level"
    params = {"details": "true"} if include_details else {}
    
    response = requests.get(url, params=params)
    data = response.json()
    
    if data["success"]:
        stats = data["statistics"]
        print(f"总会员: {stats['total_members']}")
        print(f"全球合伙人: {stats['global_partners_count']} ({stats['global_partner_percentage']})")
        print(f"市场合伙人: {stats['market_partners_count']} ({stats['market_partner_percentage']})")
        print(f"普通会员: {stats['normal_members_count']} ({stats['normal_percentage']})")
        
        return data["data"]
    else:
        print(f"错误: {data['error']}")
        return None

# 使用示例
members = get_members_by_level(include_details=True)

# 打印全球合伙人
if members:
    print("\n全球合伙人列表:")
    for partner in members["global_partners"]:
        print(f"  {partner['wallet_address']}: {partner['ashva_balance']} ASHVA")
\`\`\`

---

## 常见使用场景

### 1. 显示会员等级分布图表

\`\`\`javascript
async function renderMemberLevelChart() {
  const { statistics } = await fetch('/api/members/by-level')
    .then(res => res.json())
  
  const chartData = {
    labels: ['普通会员', '市场合伙人', '全球合伙人'],
    values: [
      statistics.normal_members_count,
      statistics.market_partners_count,
      statistics.global_partners_count
    ]
  }
  
  // 使用 Chart.js 或其他图表库渲染
  renderPieChart(chartData)
}
\`\`\`

### 2. 筛选高价值用户

\`\`\`javascript
async function getTopPartners() {
  const response = await fetch('/api/members/by-level?details=true')
  const { data } = await response.json()
  
  // 合并市场合伙人和全球合伙人
  const allPartners = [
    ...data.market_partners,
    ...data.global_partners
  ]
  
  // 按ASHVA余额排序
  allPartners.sort((a, b) => b.ashva_balance - a.ashva_balance)
  
  // 返回前10名
  return allPartners.slice(0, 10)
}
\`\`\`

### 3. 统计团队规模

\`\`\`javascript
async function calculateTeamStats() {
  const response = await fetch('/api/members/by-level')
  const { data } = await response.json()
  
  const stats = {
    global_partners_total_team: data.global_partners.reduce(
      (sum, p) => sum + p.team_size, 0
    ),
    market_partners_total_team: data.market_partners.reduce(
      (sum, p) => sum + p.team_size, 0
    ),
    normal_members_total_team: data.normal_members.reduce(
      (sum, p) => sum + p.team_size, 0
    )
  }
  
  console.log('全球合伙人管理总人数:', stats.global_partners_total_team)
  console.log('市场合伙人管理总人数:', stats.market_partners_total_team)
  
  return stats
}
\`\`\`

### 4. 导出会员列表

\`\`\`javascript
async function exportMembersByLevel(level) {
  const response = await fetch('/api/members/by-level?details=true')
  const { data } = await response.json()
  
  let members
  switch(level) {
    case 'global_partner':
      members = data.global_partners
      break
    case 'market_partner':
      members = data.market_partners
      break
    case 'normal':
      members = data.normal_members
      break
    default:
      members = [...data.global_partners, ...data.market_partners, ...data.normal_members]
  }
  
  // 转换为CSV格式
  const csv = convertToCSV(members)
  downloadCSV(csv, `members_${level}.csv`)
}
\`\`\`

---

## 注意事项

1. **性能考虑**：该API查询所有会员数据，在会员数量较大时可能响应较慢。建议使用缓存。

2. **CORS支持**：该API已配置CORS，可从任何域名调用。

3. **数据实时性**：会员等级由后端根据ASHVA持仓实时计算，`member_level`字段会自动更新。

4. **排序规则**：
   - 按等级：全球合伙人 > 市场合伙人 > 普通会员
   - 同等级内按ASHVA余额降序

5. **分页**：如需分页功能，请使用 `/api/admin/users` API。

---

## 相关API

- **GET /api/member** - 获取单个用户的详细会员信息
- **GET /api/admin/users** - 获取用户列表（支持分页和筛选）
- **GET /api/members** - 获取所有会员的简要列表
- **GET /api/members/stats** - 获取会员统计数据
