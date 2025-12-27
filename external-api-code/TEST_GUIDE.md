# 购买数据API测试指南

## 测试环境

**Base URL**: `https://v0-pve-operations-center.vercel.app`

---

## 测试用例

### 1. 测试购买记录列表API

#### 测试1.1: 获取所有购买记录（基础测试）

\`\`\`bash
curl "https://v0-pve-operations-center.vercel.app/api/purchases?page=1&limit=10"
\`\`\`

**预期响应**:
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "device_id": "CLOUD-12345",
      "wallet_address": "0xabc...",
      "node_type": "cloud",
      "quantity": 2,
      "total_price_cny": 1000.00,
      "total_price_ashva": 5000.12345678,
      "status": "active",
      "tx_hash": "0x123...",
      "purchased_at": "2025-01-15T10:30:00Z",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 10,
    "offset": 0,
    "pages": 10,
    "current_page": 1
  },
  "query": {...}
}
\`\`\`

#### 测试1.2: 按钱包地址筛选

\`\`\`bash
curl "https://v0-pve-operations-center.vercel.app/api/purchases?wallet_address=0x8fc07a7f4886ba53acd58d77666a88e1392c716d&limit=100"
\`\`\`

#### 测试1.3: 按节点类型筛选

\`\`\`bash
# 查询云节点购买
curl "https://v0-pve-operations-center.vercel.app/api/purchases?node_type=cloud&limit=50"

# 查询镜像节点购买
curl "https://v0-pve-operations-center.vercel.app/api/purchases?node_type=image&limit=50"
\`\`\`

#### 测试1.4: 按状态筛选

\`\`\`bash
# 查询活跃节点
curl "https://v0-pve-operations-center.vercel.app/api/purchases?status=active"

# 查询待处理节点
curl "https://v0-pve-operations-center.vercel.app/api/purchases?status=pending"
\`\`\`

#### 测试1.5: 按日期范围筛选

\`\`\`bash
curl "https://v0-pve-operations-center.vercel.app/api/purchases?start_date=2025-01-01&end_date=2025-01-31"
\`\`\`

#### 测试1.6: 组合筛选

\`\`\`bash
curl "https://v0-pve-operations-center.vercel.app/api/purchases?wallet_address=0x8fc07a7f4886ba53acd58d77666a88e1392c716d&node_type=cloud&status=active&start_date=2025-01-01&limit=100"
\`\`\`

#### 测试1.7: 分页测试

\`\`\`bash
# 第1页
curl "https://v0-pve-operations-center.vercel.app/api/purchases?page=1&limit=10"

# 第2页
curl "https://v0-pve-operations-center.vercel.app/api/purchases?page=2&limit=10"
\`\`\`

---

### 2. 测试购买数据汇总API

#### 测试2.1: 获取所有购买汇总（基础测试）

\`\`\`bash
curl "https://v0-pve-operations-center.vercel.app/api/purchases/summary"
\`\`\`

**预期响应**:
\`\`\`json
{
  "success": true,
  "data": {
    "total_purchases": 150,
    "total_quantity": 320,
    "total_cny": 160000.00,
    "total_ashva": 800000.12345678,
    "by_type": {
      "cloud": {
        "count": 100,
        "quantity": 200,
        "total_cny": 100000.00,
        "total_ashva": 500000.00
      },
      "image": {
        "count": 50,
        "quantity": 120,
        "total_cny": 60000.00,
        "total_ashva": 300000.12345678
      }
    },
    "by_status": {
      "active": {
        "count": 120,
        "quantity": 280
      },
      "pending": {
        "count": 20,
        "quantity": 30
      },
      "processing": {
        "count": 10,
        "quantity": 10
      }
    },
    "by_date": [
      {
        "date": "2025-01-15",
        "count": 10,
        "quantity": 25,
        "total_cny": 12500.00,
        "total_ashva": 62500.00
      }
    ],
    "filters": {
      "wallet_address": null,
      "node_type": null,
      "start_date": null,
      "end_date": null
    }
  }
}
\`\`\`

#### 测试2.2: 按钱包地址查询汇总

\`\`\`bash
curl "https://v0-pve-operations-center.vercel.app/api/purchases/summary?wallet_address=0x8fc07a7f4886ba53acd58d77666a88e1392c716d"
\`\`\`

#### 测试2.3: 按节点类型查询汇总

\`\`\`bash
# 云节点汇总
curl "https://v0-pve-operations-center.vercel.app/api/purchases/summary?node_type=cloud"

# 镜像节点汇总
curl "https://v0-pve-operations-center.vercel.app/api/purchases/summary?node_type=image"
\`\`\`

#### 测试2.4: 按日期范围查询汇总

\`\`\`bash
curl "https://v0-pve-operations-center.vercel.app/api/purchases/summary?start_date=2025-01-01&end_date=2025-01-31"
\`\`\`

#### 测试2.5: 组合筛选汇总

\`\`\`bash
curl "https://v0-pve-operations-center.vercel.app/api/purchases/summary?wallet_address=0x8fc07a7f4886ba53acd58d77666a88e1392c716d&node_type=cloud&start_date=2025-01-01&end_date=2025-01-31"
\`\`\`

---

## JavaScript测试示例

\`\`\`javascript
// 示例1: 查询特定钱包的购买记录
const wallet = '0x8fc07a7f4886ba53acd58d77666a88e1392c716d'
const response = await fetch(
  `https://v0-pve-operations-center.vercel.app/api/purchases?wallet_address=${wallet}&limit=100`
)
const data = await response.json()
console.log('购买记录:', data)

// 示例2: 获取购买汇总统计
const summaryResponse = await fetch(
  'https://v0-pve-operations-center.vercel.app/api/purchases/summary'
)
const summaryData = await summaryResponse.json()
console.log('汇总统计:', summaryData)
\`\`\`

---

## 错误处理测试

### 测试无效参数

\`\`\`bash
# 测试无效的节点类型
curl "https://v0-pve-operations-center.vercel.app/api/purchases?node_type=invalid"

# 测试无效的日期格式
curl "https://v0-pve-operations-center.vercel.app/api/purchases?start_date=invalid-date"

# 测试超大limit值
curl "https://v0-pve-operations-center.vercel.app/api/purchases?limit=999999"
\`\`\`

**预期**: API应返回错误信息并保持稳定

---

## 性能测试

### 测试大数据量查询

\`\`\`bash
# 查询最大允许数量
curl "https://v0-pve-operations-center.vercel.app/api/purchases?limit=1000"

# 测试响应时间
time curl "https://v0-pve-operations-center.vercel.app/api/purchases/summary"
\`\`\`

---

## 验证检查清单

- [ ] 购买记录列表API返回正确的数据结构
- [ ] 购买汇总API返回正确的统计数据
- [ ] 钱包地址筛选正常工作
- [ ] 节点类型筛选正常工作
- [ ] 状态筛选正常工作
- [ ] 日期范围筛选正常工作
- [ ] 分页功能正常工作
- [ ] 组合筛选正常工作
- [ ] 错误处理正确
- [ ] 响应时间在可接受范围内（< 2秒）
- [ ] 返回的数据格式正确
- [ ] 空结果情况处理正确

---

## 常见问题

### Q1: API返回空数据
**A**: 检查数据库中是否有购买记录，使用无筛选条件的基础查询测试。

### Q2: SQL语法错误
**A**: 确保使用标签模板字符串语法：`` sql`SELECT...` ``

### Q3: 数据库连接失败
**A**: 检查DATABASE_URL环境变量是否正确配置。

### Q4: 汇总统计数据不正确
**A**: 检查筛选条件，确保日期格式正确（YYYY-MM-DD）。

---

## 联系支持

如有问题，请检查：
1. Vercel部署日志
2. 数据库连接状态
3. 环境变量配置
