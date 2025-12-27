# 收益系统完整说明

## 数据库表结构

### 1. **团队收益存储**

#### `commission_records` 表 - 佣金记录表
**用途**：记录每笔推荐佣金的详细信息

**当前数据统计**：
- 📊 总佣金记录：10条
- 👥 有团队收益的会员：3人
- 💰 总佣金金额：43,988.27 USDT（以分为单位存储）

**关键字段**：
- `wallet_address` - 获得佣金的钱包地址
- `from_wallet` - 佣金来源（下级购买者）
- `amount` - 佣金金额（以分为单位）
- `commission_type` - 佣金类型（direct=直推3%，indirect=间推2%）
- `source_transaction` - 来源交易
- `created_at` - 佣金生成时间

#### `wallets` 表 - 用户钱包表
**收益相关字段**：
- `total_earnings` - 累计团队收益（所有佣金总和）
- `wallet_address` - 钱包地址

---

### 2. **节点收益存储**

#### `assigned_records` 表 - 设备分配记录表
**用途**：记录PVE运营中心分配的设备和节点收益

**关键字段**：
- `node_id` - 关联的节点ID
- `total_income` - 累计节点收益
- `daily_income` - 每日收益
- `pve_node_id` - PVE节点ID
- `vm_id` - 虚拟机ID
- `online_status` - 在线状态

**说明**：节点收益数据来自PVE运营中心，通过API同步到此表

---

### 3. **佣金配置**

#### `commission_distribution` 表 - 佣金分配配置表
**用途**：市场合伙人和全球合伙人自定义各层级的佣金分配比例

**关键字段**：
- `wallet_address` - 合伙人钱包
- `level_1_percentage` 到 `level_10_percentage` - 各层级自定义分配比例
- `updated_at` - 最后更新时间

---

## 可用的API接口

### 📍 团队收益API

#### 1. **获取会员信息（包含团队收益）**
\`\`\`
GET /api/member?wallet={address}
\`\`\`
**返回数据**：
- `teamRewards` - 团队奖励总额（ASHVA）
- `teamRewardsUSD` - 团队奖励USD价值
- `memberType` - 会员等级
- `upgradeProgress` - 升级进度

**用途**：获取用户的团队收益余额

---

#### 2. **获取佣金记录列表**
\`\`\`
GET /api/commissions?wallet={address}
\`\`\`
**返回数据**：
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "wallet_address": "0x123...",
      "from_wallet": "0x456...",
      "amount": 60000,  // 分为单位，600.00 USDT
      "commission_type": "direct",
      "source_transaction": "purchase_node_xxx",
      "created_at": "2025-01-10T10:00:00Z"
    }
  ]
}
\`\`\`

**用途**：查看用户的所有佣金收入记录

---

#### 3. **获取佣金详情**
\`\`\`
GET /api/commissions/details?wallet={address}
\`\`\`
**返回数据**：更详细的佣金分解信息

---

#### 4. **获取收益汇总**
\`\`\`
GET /api/earnings/summary?wallet={address}
\`\`\`
**返回数据**：
\`\`\`json
{
  "success": true,
  "data": {
    "total_earnings": 150000,  // 总收益（分）
    "team_rewards": {
      "amount": 100000,  // 团队奖励（分）
      "transactions": 5,
      "percentage": 66.67
    },
    "node_earnings": {
      "amount": 50000,  // 节点收益（分）
      "days": 30,
      "percentage": 33.33
    }
  }
}
\`\`\`

**用途**：获取团队奖励和节点收益的汇总对比

---

#### 5. **获取收益明细**
\`\`\`
GET /api/earnings/breakdown?wallet={address}&type=team
\`\`\`
**参数**：
- `type` - 筛选类型（team=团队奖励，node=节点收益，all=全部）

**返回数据**：详细的收益明细列表

---

### 📍 节点收益API

#### 6. **获取用户设备列表（包含节点收益）**
\`\`\`
GET /api/user/devices?wallet={address}
\`\`\`
**返回数据**：
\`\`\`json
{
  "success": true,
  "data": {
    "devices": [
      {
        "node_id": "CN-xxx",
        "purchase_type": "cloud",
        "purchase_date": "2025-01-01",
        "total_amount": 2000,  // ASHVA
        "device_assigned": true,
        "pve_node_id": "pve-01",
        "vm_id": 100,
        "ip_address": "10.0.0.1",
        "online_status": "online",
        "total_income": 15000,  // 累计收益（分）
        "daily_income": 500  // 每日收益（分）
      }
    ],
    "summary": {
      "total_devices": 2,
      "total_income": 30000  // 总节点收益
    }
  }
}
\`\`\`

**用途**：查看用户所有设备的节点收益情况

---

#### 7. **获取设备分配记录**
\`\`\`
GET /api/assignments?wallet={address}
\`\`\`
**返回数据**：设备分配记录，包含收益信息

---

#### 8. **获取设备分配统计**
\`\`\`
GET /api/assignments/stats
\`\`\`
**返回数据**：全局设备分配和收益统计

---

### 📍 佣金配置API

#### 9. **获取佣金配置**
\`\`\`
GET /api/commission-config?wallet={address}
\`\`\`
**返回数据**：用户的自定义佣金分配配置

---

#### 10. **更新佣金配置**
\`\`\`
POST /api/commission-config
\`\`\`
**参数**：
\`\`\`json
{
  "wallet_address": "0x123...",
  "level_1_percentage": 3.0,
  "level_2_percentage": 2.0,
  ...
}
\`\`\`

**用途**：市场合伙人和全球合伙人自定义佣金分配

---

## 收益统计数据（当前）

### 团队收益
- ✅ **有团队收益的会员：3人**
- 📊 **佣金记录总数：10条**
- 💰 **总佣金金额：43,988.27 USDT**

### 节点收益
- 🖥️ **激活节点数：4个**
- 💼 **拥有激活节点的会员：4人**
- 📈 **节点收益数据：从PVE运营中心实时同步**

---

## 收益系统流程

### 团队收益流程
1. 用户A推荐用户B
2. 用户B购买节点（2000U或100U）
3. 系统自动计算佣金（直推3%或间推2%）
4. 创建 `commission_records` 记录
5. 更新用户A的 `wallets.total_earnings`
6. 用户A可以通过 `/api/withdraw` 提现

### 节点收益流程
1. 用户购买节点（创建 `nodes` 记录）
2. PVE运营中心分配设备（创建 `assigned_records` 记录）
3. 节点开始运行并产生收益
4. 收益数据从PVE API同步到 `assigned_records.total_income`
5. 用户可以查看收益并提现

---

## 外部调用建议

### 显示用户总收益
\`\`\`javascript
// 获取会员信息（包含团队收益）
const memberResponse = await fetch(
  `https://your-domain.com/api/member?wallet=${walletAddress}`
);
const memberData = await memberResponse.json();

// 获取设备收益
const devicesResponse = await fetch(
  `https://your-domain.com/api/user/devices?wallet=${walletAddress}`
);
const devicesData = await devicesResponse.json();

// 计算总收益
const totalEarnings = {
  teamRewards: memberData.data.teamRewards,
  nodeEarnings: devicesData.data.summary.total_income / 100, // 转换为USDT
  total: memberData.data.teamRewards + (devicesData.data.summary.total_income / 100)
};
\`\`\`

---

### 显示收益明细
\`\`\`javascript
// 获取收益汇总
const summaryResponse = await fetch(
  `https://your-domain.com/api/earnings/summary?wallet=${walletAddress}`
);
const summary = await summaryResponse.json();

// 获取团队奖励明细
const teamResponse = await fetch(
  `https://your-domain.com/api/earnings/breakdown?wallet=${walletAddress}&type=team`
);
const teamDetails = await teamResponse.json();

// 显示收益占比
console.log(`团队奖励占比: ${summary.data.team_rewards.percentage}%`);
console.log(`节点收益占比: ${summary.data.node_earnings.percentage}%`);
\`\`\`

---

## 注意事项

1. **金额单位**：
   - 数据库中存储的金额都是以**分（cents）**为单位
   - API返回时需要除以100转换为元/美元
   - 例如：`amount: 100000` = 1000.00 USDT

2. **CORS支持**：
   - 所有API都已配置CORS响应头
   - 支持跨域访问，可直接从外部会员中心调用

3. **节点收益数据源**：
   - 节点收益数据来自PVE运营中心
   - 通过 `/api/assigned-records/sync` 定期同步
   - 不是实时数据，建议定期刷新

4. **会员等级影响**：
   - 普通会员：固定佣金（直推3%，间推2%）
   - 市场合伙人：可自定义分配10层
   - 全球合伙人：可自定义分配100层

---

## 快速开始

### 查询某个会员是否有收益
\`\`\`bash
# 查询会员信息
curl "https://your-domain.com/api/member?wallet=0x123..."

# 查询佣金记录
curl "https://your-domain.com/api/commissions?wallet=0x123..."

# 查询节点收益
curl "https://your-domain.com/api/user/devices?wallet=0x123..."
\`\`\`

### 统计所有有收益的会员
\`\`\`bash
# 使用后台管理API
curl "https://your-domain.com/api/admin/users?page=1&limit=100"
\`\`\`

返回的用户列表中，筛选 `total_earnings > 0` 或有激活节点的用户即可。

---

## 总结

当前系统中：
- ✅ **3个会员有团队收益**（通过推荐获得佣金）
- ✅ **4个会员有节点收益**（购买并激活了节点）
- ✅ 总共约**5-6个会员有收益**（部分会员可能同时有两种收益）

所有收益数据都有完整的数据库表支持，并提供了10+个API接口供外部系统调用。
