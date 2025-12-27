# 用户收益API文档

外部会员中心可以调用以下API获取用户的团队奖励和节点收益数据。

---

## API 1: 获取收益汇总

获取用户的团队奖励和节点收益总览。

### 接口信息

**URL**: `GET /api/earnings/summary`

**参数**:
- `wallet` (required) - 用户钱包地址

**CORS**: 已支持跨域访问

### 返回数据结构

\`\`\`json
{
  "success": true,
  "data": {
    "wallet_address": "0x123...",
    
    "team_earnings": {
      "total": 1250.50,           // 团队奖励总额 (ASHVA)
      "transactions": 15,         // 佣金笔数
      "type": "团队推荐佣金",
      "description": "来自推荐用户购买云节点和镜像节点的佣金收入"
    },
    
    "node_earnings": {
      "total": 458.32,            // 节点收益总额 (ASHVA)
      "days": 45,                 // 运行天数
      "type": "节点运行收益",
      "description": "来自云节点托管运行产生的每日收益"
    },
    
    "total_earnings": 1708.82,    // 总收益 (ASHVA)
    
    "earnings_ratio": {
      "team_percentage": "73.16", // 团队收益占比
      "node_percentage": "26.84"  // 节点收益占比
    }
  }
}
\`\`\`

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `team_earnings.total` | number | 团队推荐佣金总额（ASHVA） |
| `team_earnings.transactions` | number | 获得佣金的交易笔数 |
| `node_earnings.total` | number | 节点运行收益总额（ASHVA） |
| `node_earnings.days` | number | 节点总运行天数 |
| `total_earnings` | number | 总收益（团队+节点） |
| `earnings_ratio.team_percentage` | string | 团队收益占比（百分比） |
| `earnings_ratio.node_percentage` | string | 节点收益占比（百分比） |

### 调用示例

\`\`\`javascript
// JavaScript/TypeScript
async function getUserEarningsSummary(walletAddress) {
  const response = await fetch(
    `https://your-domain.com/api/earnings/summary?wallet=${walletAddress}`
  );
  
  if (!response.ok) {
    throw new Error('获取收益汇总失败');
  }
  
  const data = await response.json();
  
  if (data.success) {
    console.log('总收益:', data.data.total_earnings, 'ASHVA');
    console.log('团队奖励:', data.data.team_earnings.total, 'ASHVA');
    console.log('节点收益:', data.data.node_earnings.total, 'ASHVA');
    return data.data;
  }
}

// 使用
getUserEarningsSummary('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')
  .then(earnings => {
    // 处理收益数据
  });
\`\`\`

\`\`\`bash
# cURL
curl "https://your-domain.com/api/earnings/summary?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
\`\`\`

---

## API 2: 获取收益明细

获取用户的详细收益记录列表，包括每笔团队佣金和每日节点收益。

### 接口信息

**URL**: `GET /api/earnings/breakdown`

**参数**:
- `wallet` (required) - 用户钱包地址
- `type` (optional) - 筛选类型：`team`（团队奖励）或 `node`（节点收益），不传则返回全部
- `limit` (optional) - 每页数量，默认50
- `offset` (optional) - 偏移量，默认0

**CORS**: 已支持跨域访问

### 返回数据结构

\`\`\`json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "rec_123",
        "type": "team",                    // 类型：team（团队）或 node（节点）
        "source": "团队推荐佣金",
        "amount": 60.00,                   // 收益金额 (ASHVA)
        "level": 1,                        // 佣金层级（1=直推，2=间推）
        "purchase_type": "云节点托管(2000U)", // 购买类型
        "referred_user": "0xabc...",       // 购买用户地址
        "date": "2024-01-15T10:30:00Z",    // 收益时间
        "status": "completed"              // 状态
      },
      {
        "id": "rec_124",
        "type": "node",
        "source": "节点运行收益",
        "amount": 12.50,                   // 每日收益 (ASHVA)
        "date": "2024-01-14T00:00:00Z",
        "online_rate": 98.5,               // 在线率 (%)
        "node_id": "node_456",             // 节点ID
        "status": "completed"
      }
    ],
    "pagination": {
      "total": 65,
      "limit": 50,
      "offset": 0
    },
    "summary": {
      "team_records": 15,     // 团队佣金记录数
      "node_records": 50,     // 节点收益记录数
      "total_records": 65     // 总记录数
    }
  }
}
\`\`\`

### 团队奖励记录字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | string | 固定为 "team" |
| `source` | string | 固定为 "团队推荐佣金" |
| `amount` | number | 佣金金额（ASHVA） |
| `level` | number | 佣金层级（1=直推，2=间推） |
| `purchase_type` | string | 购买类型（云节点托管/镜像节点） |
| `referred_user` | string | 购买者钱包地址 |
| `date` | string | 获得佣金的时间 |
| `status` | string | 状态（completed=已完成） |

### 节点收益记录字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | string | 固定为 "node" |
| `source` | string | 固定为 "节点运行收益" |
| `amount` | number | 当日收益金额（ASHVA） |
| `date` | string | 收益日期 |
| `online_rate` | number | 节点在线率（百分比） |
| `node_id` | string | 节点ID |
| `status` | string | 状态（completed=已完成） |

### 调用示例

#### 示例1: 获取所有收益明细

\`\`\`javascript
async function getAllEarningsBreakdown(walletAddress) {
  const response = await fetch(
    `https://your-domain.com/api/earnings/breakdown?wallet=${walletAddress}&limit=50&offset=0`
  );
  
  const data = await response.json();
  
  if (data.success) {
    console.log('总记录数:', data.data.summary.total_records);
    console.log('收益明细:', data.data.records);
    return data.data;
  }
}
\`\`\`

#### 示例2: 只获取团队佣金记录

\`\`\`javascript
async function getTeamEarnings(walletAddress) {
  const response = await fetch(
    `https://your-domain.com/api/earnings/breakdown?wallet=${walletAddress}&type=team`
  );
  
  const data = await response.json();
  
  if (data.success) {
    const teamRecords = data.data.records;
    
    teamRecords.forEach(record => {
      console.log(`从 ${record.referred_user} 获得 ${record.amount} ASHVA`);
      console.log(`购买类型: ${record.purchase_type}, 层级: ${record.level}`);
    });
    
    return teamRecords;
  }
}
\`\`\`

#### 示例3: 只获取节点收益记录

\`\`\`javascript
async function getNodeEarnings(walletAddress) {
  const response = await fetch(
    `https://your-domain.com/api/earnings/breakdown?wallet=${walletAddress}&type=node`
  );
  
  const data = await response.json();
  
  if (data.success) {
    const nodeRecords = data.data.records;
    
    nodeRecords.forEach(record => {
      console.log(`${record.date} 节点收益: ${record.amount} ASHVA`);
      console.log(`在线率: ${record.online_rate}%`);
    });
    
    return nodeRecords;
  }
}
\`\`\`

#### 示例4: 分页获取收益记录

\`\`\`javascript
async function getEarningsPage(walletAddress, page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;
  
  const response = await fetch(
    `https://your-domain.com/api/earnings/breakdown?wallet=${walletAddress}&limit=${pageSize}&offset=${offset}`
  );
  
  const data = await response.json();
  
  if (data.success) {
    return {
      records: data.data.records,
      total: data.data.pagination.total,
      currentPage: page,
      totalPages: Math.ceil(data.data.pagination.total / pageSize)
    };
  }
}

// 获取第1页
getEarningsPage('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 1, 20);
\`\`\`

---

## 综合使用示例

### 场景1: 展示用户收益卡片

\`\`\`javascript
async function displayUserEarnings(walletAddress) {
  // 1. 获取收益汇总
  const summary = await fetch(
    `https://your-domain.com/api/earnings/summary?wallet=${walletAddress}`
  ).then(r => r.json());
  
  if (summary.success) {
    const { team_earnings, node_earnings, total_earnings, earnings_ratio } = summary.data;
    
    // 显示收益卡片
    console.log('=== 用户收益概览 ===');
    console.log(`总收益: ${total_earnings} ASHVA`);
    console.log(`\n团队奖励: ${team_earnings.total} ASHVA (${earnings_ratio.team_percentage}%)`);
    console.log(`  - 佣金笔数: ${team_earnings.transactions}`);
    console.log(`\n节点收益: ${node_earnings.total} ASHVA (${earnings_ratio.node_percentage}%)`);
    console.log(`  - 运行天数: ${node_earnings.days}天`);
  }
}
\`\`\`

### 场景2: 生成收益报表

\`\`\`javascript
async function generateEarningsReport(walletAddress, startDate, endDate) {
  // 获取所有收益明细
  const breakdown = await fetch(
    `https://your-domain.com/api/earnings/breakdown?wallet=${walletAddress}&limit=1000`
  ).then(r => r.json());
  
  if (breakdown.success) {
    const records = breakdown.data.records.filter(r => {
      const recordDate = new Date(r.date);
      return recordDate >= startDate && recordDate <= endDate;
    });
    
    // 按类型统计
    const teamTotal = records
      .filter(r => r.type === 'team')
      .reduce((sum, r) => sum + r.amount, 0);
      
    const nodeTotal = records
      .filter(r => r.type === 'node')
      .reduce((sum, r) => sum + r.amount, 0);
    
    return {
      period: `${startDate.toISOString()} - ${endDate.toISOString()}`,
      teamEarnings: teamTotal,
      nodeEarnings: nodeTotal,
      totalEarnings: teamTotal + nodeTotal,
      recordCount: records.length
    };
  }
}
\`\`\`

### 场景3: 导出收益数据到CSV

\`\`\`javascript
async function exportEarningsToCSV(walletAddress) {
  const breakdown = await fetch(
    `https://your-domain.com/api/earnings/breakdown?wallet=${walletAddress}&limit=1000`
  ).then(r => r.json());
  
  if (breakdown.success) {
    let csv = '日期,类型,金额(ASHVA),来源,详情\n';
    
    breakdown.data.records.forEach(record => {
      const date = new Date(record.date).toLocaleDateString();
      const type = record.type === 'team' ? '团队佣金' : '节点收益';
      const amount = record.amount;
      const source = record.type === 'team' ? record.referred_user : record.node_id;
      const detail = record.type === 'team' ? 
        `${record.purchase_type} L${record.level}` : 
        `在线率${record.online_rate}%`;
      
      csv += `${date},${type},${amount},${source},${detail}\n`;
    });
    
    return csv;
  }
}
\`\`\`

---

## 数据来源说明

### 团队奖励数据来源
- **数据库表**: `referrals`
- **计算方式**: 统计所有 `status = 'completed'` 的佣金记录
- **包含内容**:
  - 直推佣金（level 1）：用户直接推荐的购买产生的佣金
  - 间推佣金（level 2+）：下级团队购买产生的佣金

### 节点收益数据来源
- **外部API**: PVE运营中心 `/api/assigned-records/summary`
- **计算方式**: 从PVE运营中心获取实际设备运行收益数据
- **包含内容**:
  - 每日运行收益（基于在线率和算力）
  - 累计运行天数
  - 设备在线率统计

---

## 错误处理

### 常见错误响应

\`\`\`json
{
  "success": false,
  "error": "钱包地址必填"
}
\`\`\`

### HTTP状态码

- `200` - 成功
- `400` - 参数错误（缺少wallet参数）
- `500` - 服务器错误

### 建议的错误处理

\`\`\`javascript
async function safeGetEarnings(walletAddress) {
  try {
    const response = await fetch(
      `https://your-domain.com/api/earnings/summary?wallet=${walletAddress}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      console.error('API错误:', data.error);
      return null;
    }
    
    return data.data;
    
  } catch (error) {
    console.error('获取收益数据失败:', error);
    return null;
  }
}
\`\`\`

---

## 总结

外部会员中心需要调用的收益相关API：

1. **`GET /api/earnings/summary?wallet={address}`** 
   - 获取收益汇总（团队奖励总额 + 节点收益总额）
   
2. **`GET /api/earnings/breakdown?wallet={address}`**
   - 获取详细收益记录（每笔佣金 + 每日节点收益）

这两个API已经完全支持CORS跨域访问，可以直接从外部会员中心调用。
