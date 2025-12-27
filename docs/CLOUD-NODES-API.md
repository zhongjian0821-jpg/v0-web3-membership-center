# 云节点托管设备查询API文档

## API端点

**GET** `/api/user/devices`

获取用户购买的所有云节点托管设备信息，包括购买详情、设备分配状态和收益数据。

---

## 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| wallet | string | 是 | 用户钱包地址 |

---

## 请求示例

\`\`\`bash
GET /api/user/devices?wallet=0x1234567890abcdef1234567890abcdef12345678
\`\`\`

### JavaScript调用示例

\`\`\`javascript
const walletAddress = "0x1234567890abcdef1234567890abcdef12345678";

fetch(`https://your-domain.com/api/user/devices?wallet=${walletAddress}`)
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log("设备列表:", data.data.devices);
      console.log("统计信息:", data.data.statistics);
    }
  })
  .catch(error => console.error("请求失败:", error));
\`\`\`

---

## 响应格式

### 成功响应（200）

\`\`\`json
{
  "success": true,
  "data": {
    "wallet_address": "0x1234567890abcdef1234567890abcdef12345678",
    "devices": [
      {
        // ========== 购买信息 ==========
        "purchase_id": "550e8400-e29b-41d4-a716-446655440000",
        "purchase_type": "cloud",  // 'cloud' = 云节点托管(2000U), 'image' = 镜像安装(100U)
        "node_count": 1,
        "memory_gb": 16,           // 内存配置（GB）
        "cpu_cores": 4,            // CPU核心数
        "storage_gb": 500,         // 存储空间（GB）
        "total_amount": 24144.58,  // 支付的ASHVA代币数量
        "total_amount_usd": 2000,  // 支付的USD金额
        "purchase_status": "active", // 订单状态：pending/deploying/active
        "purchase_date": "2024-01-15T08:30:00.000Z", // 购买时间
        
        // ========== 设备分配信息 ==========
        "assigned": true,          // 是否已分配设备
        "device_id": "vm-1001",    // 设备ID（PVE分配）
        "device_name": "云节点-北京-001", // 设备名称
        "device_ip": "192.168.1.100", // 设备IP地址
        "online_status": "online", // 在线状态：online/offline
        "assigned_at": "2024-01-15T10:00:00.000Z", // 设备分配时间
        
        // ========== 收益信息 ==========
        "total_income": 150.50,    // 累计收益（ASHVA）
        "daily_income": 5.25       // 每日平均收益（ASHVA）
      },
      {
        "purchase_id": "660e8400-e29b-41d4-a716-446655440001",
        "purchase_type": "image",
        "node_count": 1,
        "memory_gb": null,
        "cpu_cores": null,
        "storage_gb": null,
        "total_amount": 1205.23,
        "total_amount_usd": 100,
        "purchase_status": "deploying",
        "purchase_date": "2024-01-20T14:20:00.000Z",
        "assigned": false,
        "device_id": null,
        "device_name": null,
        "device_ip": null,
        "online_status": "offline",
        "assigned_at": null,
        "total_income": 0,
        "daily_income": 0
      }
    ],
    "ashva_price_usd": 0.0829,   // 当前ASHVA价格（USD）
    "statistics": {
      "total_purchases": 2,       // 总购买订单数
      "assigned_count": 1,        // 已分配设备数
      "pending_count": 1,         // 待分配订单数
      "cloud_nodes": 1,           // 云节点托管数量
      "image_nodes": 1            // 镜像安装数量
    }
  }
}
\`\`\`

### 错误响应（400）

\`\`\`json
{
  "success": false,
  "error": "钱包地址必填 (Wallet address is required)"
}
\`\`\`

### 错误响应（500）

\`\`\`json
{
  "success": false,
  "error": "获取用户设备失败 (Failed to fetch user devices)",
  "details": "Database connection error"
}
\`\`\`

---

## 字段说明详解

### 购买类型（purchase_type）

| 值 | 说明 | 价格 |
|------|------|------|
| cloud | 云节点托管 | 2000 USD |
| image | 镜像安装 | 100 USD |

### 订单状态（purchase_status）

| 状态 | 说明 |
|------|------|
| pending | 待处理（刚下单） |
| deploying | 部署中（PVE运营中心正在分配设备） |
| active | 已激活（设备已分配，正常运行） |
| failed | 失败（部署失败或其他错误） |

### 在线状态（online_status）

| 状态 | 说明 |
|------|------|
| online | 设备在线，正常运行 |
| offline | 设备离线，不产生收益 |

### 收益说明

- **total_income**: 该设备从分配开始累计产生的总收益（ASHVA代币）
- **daily_income**: 该设备每日平均收益（ASHVA代币）
- 收益计算：从PVE运营中心获取，根据设备在线时长、使用率等因素计算

---

## 使用场景示例

### 1. 显示用户的所有云节点

\`\`\`javascript
async function displayUserCloudNodes(wallet) {
  const response = await fetch(`/api/user/devices?wallet=${wallet}`);
  const data = await response.json();
  
  if (data.success) {
    // 只显示云节点托管（2000U）
    const cloudNodes = data.data.devices.filter(d => d.purchase_type === 'cloud');
    
    cloudNodes.forEach(node => {
      console.log(`
        设备ID: ${node.device_id || '待分配'}
        购买时间: ${new Date(node.purchase_date).toLocaleDateString()}
        购买价格: $${node.total_amount_usd} (${node.total_amount} ASHVA)
        设备状态: ${node.assigned ? '已分配' : '待分配'}
        在线状态: ${node.online_status}
        累计收益: ${node.total_income} ASHVA
        每日收益: ${node.daily_income} ASHVA
      `);
    });
  }
}
\`\`\`

### 2. 计算用户总收益

\`\`\`javascript
async function calculateTotalEarnings(wallet) {
  const response = await fetch(`/api/user/devices?wallet=${wallet}`);
  const data = await response.json();
  
  if (data.success) {
    const totalEarnings = data.data.devices.reduce((sum, device) => {
      return sum + device.total_income;
    }, 0);
    
    const totalDailyIncome = data.data.devices.reduce((sum, device) => {
      return sum + device.daily_income;
    }, 0);
    
    console.log(`总累计收益: ${totalEarnings.toFixed(2)} ASHVA`);
    console.log(`总每日收益: ${totalDailyIncome.toFixed(2)} ASHVA`);
  }
}
\`\`\`

### 3. 检查订单部署状态

\`\`\`javascript
async function checkDeploymentStatus(wallet) {
  const response = await fetch(`/api/user/devices?wallet=${wallet}`);
  const data = await response.json();
  
  if (data.success) {
    const stats = data.data.statistics;
    
    console.log(`总订单: ${stats.total_purchases}`);
    console.log(`已部署: ${stats.assigned_count}`);
    console.log(`待部署: ${stats.pending_count}`);
    
    // 找出所有待部署的订单
    const pendingOrders = data.data.devices.filter(d => !d.assigned);
    pendingOrders.forEach(order => {
      console.log(`订单 ${order.purchase_id} 状态: ${order.purchase_status}`);
    });
  }
}
\`\`\`

### 4. 显示设备详细信息表格

\`\`\`javascript
async function displayDeviceTable(wallet) {
  const response = await fetch(`/api/user/devices?wallet=${wallet}`);
  const data = await response.json();
  
  if (data.success) {
    console.table(data.data.devices.map(d => ({
      '购买日期': new Date(d.purchase_date).toLocaleDateString(),
      '类型': d.purchase_type === 'cloud' ? '云节点托管' : '镜像安装',
      '价格(USD)': `$${d.total_amount_usd}`,
      '配置': d.cpu_cores ? `${d.cpu_cores}核/${d.memory_gb}GB/${d.storage_gb}GB` : '-',
      '设备状态': d.assigned ? '已分配' : '待分配',
      '在线状态': d.online_status,
      '累计收益': `${d.total_income} ASHVA`,
      '每日收益': `${d.daily_income} ASHVA`
    })));
  }
}
\`\`\`

---

## 收益数据来源

该API的收益数据来自PVE运营中心的实时数据：

1. API会调用PVE运营中心的 `/api/assignments?wallet={address}` 接口
2. 获取每个设备的收益数据（total_income, daily_income）
3. 合并购买记录和收益数据返回给前端

**注意**：如果PVE运营中心API不可用，收益数据将返回0，但不影响购买记录的显示。

---

## CORS支持

该API已支持跨域请求，可以从任何域名调用。

响应头包含：
\`\`\`
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
\`\`\`

---

## 注意事项

1. **钱包地址格式**：必须是有效的以太坊钱包地址（0x开头的42位十六进制字符串）
2. **价格计算**：ASHVA代币数量 = USD金额 / 当前ASHVA价格
3. **收益更新**：收益数据每次请求时实时从PVE运营中心获取
4. **设备分配**：新购买的订单状态为`deploying`，PVE运营中心分配设备后变为`active`
5. **节点类型**：
   - `cloud` = 云节点托管（2000 USD），包含硬件配置信息
   - `image` = 镜像安装（100 USD），不包含硬件配置

---

## 相关API

- **GET /api/member** - 获取会员信息（包含总收益汇总）
- **GET /api/assignments** - 获取设备分配详情（更底层的API）
- **GET /api/purchases** - 获取购买记录列表
- **POST /api/purchase/cloud-node** - 购买云节点托管
- **POST /api/purchase/image-node** - 购买镜像安装

---

## 更新日志

- **2024-01-22**: 添加CORS支持，支持外部会员中心调用
- **2024-01-20**: 添加 `statistics` 统计信息
- **2024-01-15**: 初始版本发布
