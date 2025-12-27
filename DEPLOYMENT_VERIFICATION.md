# API 部署验证指南

## 问题：外部API还是返回500错误

**错误信息：**
\`\`\`
This function can now be called only as a tagged-template function: sql`SELECT ${value}`, 
not sql("SELECT $1", [value], options)
\`\`\`

## 原因分析

这个错误说明 **Vercel 上部署的代码还是旧版本**，或者外部团队在访问错误的端点。

---

## 解决步骤

### 步骤1：确认文件内容完全正确

打开 `app/api/cloud-node-purchases/route.ts`，确认所有SQL查询都是这样的格式：

✅ **正确的写法：**
\`\`\`typescript
const nodes = await sql`
  SELECT * FROM cloud_nodes 
  WHERE status = ${status}
  LIMIT ${limit}
`
\`\`\`

❌ **错误的写法（绝对不能有）：**
\`\`\`typescript
const nodes = await sql("SELECT * FROM cloud_nodes WHERE status = $1", [status])
\`\`\`

### 步骤2：Git 提交并推送

\`\`\`bash
git add app/api/cloud-node-purchases/route.ts
git commit -m "Fix: Use tagged-template syntax for Neon SQL queries"
git push origin main
\`\`\`

### 步骤3：在 Vercel 仪表板确认部署

1. 登录 Vercel 仪表板
2. 找到项目 `v0-web3-membership-center`
3. 等待部署完成（看到绿色勾号✓）
4. 点击部署记录，查看部署的文件列表，确认 `app/api/cloud-node-purchases/route.ts` 在其中

### 步骤4：测试API

部署完成后，立即测试：

\`\`\`bash
curl "https://v0-web3-membership-center.vercel.app/api/cloud-node-purchases?status=pending&limit=10"
\`\`\`

**期望返回：**
\`\`\`json
{
  "success": true,
  "data": [...]
}
\`\`\`

---

## 完整的API文件内容（直接替换用）

如果上述步骤还不行，请 **完全替换** `app/api/cloud-node-purchases/route.ts` 文件内容为以下代码：

\`\`\`typescript
import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("wallet")
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    let nodes

    // 所有SQL查询都使用模板字符串语法
    if (walletAddress && status) {
      nodes = await sql`
        SELECT 
          cn.id,
          cn.wallet_address,
          cn.node_count,
          cn.memory_gb,
          cn.cpu_cores,
          cn.storage_gb,
          cn.purchase_type,
          cn.created_at,
          cn.expires_at,
          cn.status,
          u.membership_level
        FROM cloud_nodes cn
        LEFT JOIN users u ON LOWER(cn.wallet_address) = LOWER(u.wallet_address)
        WHERE LOWER(cn.wallet_address) = LOWER(${walletAddress})
          AND cn.status = ${status}
        ORDER BY cn.created_at DESC
        LIMIT ${limit}
      `
    } else if (walletAddress) {
      nodes = await sql`
        SELECT 
          cn.id,
          cn.wallet_address,
          cn.node_count,
          cn.memory_gb,
          cn.cpu_cores,
          cn.storage_gb,
          cn.purchase_type,
          cn.created_at,
          cn.expires_at,
          cn.status,
          u.membership_level
        FROM cloud_nodes cn
        LEFT JOIN users u ON LOWER(cn.wallet_address) = LOWER(u.wallet_address)
        WHERE LOWER(cn.wallet_address) = LOWER(${walletAddress})
        ORDER BY cn.created_at DESC
        LIMIT ${limit}
      `
    } else if (status) {
      nodes = await sql`
        SELECT 
          cn.id,
          cn.wallet_address,
          cn.node_count,
          cn.memory_gb,
          cn.cpu_cores,
          cn.storage_gb,
          cn.purchase_type,
          cn.created_at,
          cn.expires_at,
          cn.status,
          u.membership_level
        FROM cloud_nodes cn
        LEFT JOIN users u ON LOWER(cn.wallet_address) = LOWER(u.wallet_address)
        WHERE cn.status = ${status}
        ORDER BY cn.created_at DESC
        LIMIT ${limit}
      `
    } else {
      nodes = await sql`
        SELECT 
          cn.id,
          cn.wallet_address,
          cn.node_count,
          cn.memory_gb,
          cn.cpu_cores,
          cn.storage_gb,
          cn.purchase_type,
          cn.created_at,
          cn.expires_at,
          cn.status,
          u.membership_level
        FROM cloud_nodes cn
        LEFT JOIN users u ON LOWER(cn.wallet_address) = LOWER(u.wallet_address)
        ORDER BY cn.created_at DESC
        LIMIT ${limit}
      `
    }

    const data = nodes.map((node: any) => {
      const createdAt = new Date(node.created_at)
      const expiresAt = node.expires_at
        ? new Date(node.expires_at)
        : new Date(createdAt.getTime() + 24 * 60 * 60 * 1000)
      const now = new Date()
      const remainingMs = expiresAt.getTime() - now.getTime()

      return {
        // 必须字段
        id: String(node.id),
        wallet_address: node.wallet_address,
        created_at: node.created_at,
        status: node.status,
        node_count: node.node_count || 1,
        
        // 可选字段
        memory_gb: node.memory_gb,
        cpu_cores: node.cpu_cores,
        storage_gb: node.storage_gb,
        purchase_type: node.purchase_type || "individual",
        membership_level: node.membership_level || "normal",
        expires_at: expiresAt.toISOString(),
        
        // 24小时倒计时
        deployment_countdown_hours: Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60))),
        deployment_countdown_minutes: Math.max(0, Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))),
        deployment_countdown_seconds: Math.max(0, Math.floor((remainingMs % (1000 * 60)) / 1000)),
        deployment_time_expired: remainingMs <= 0,
        deployment_progress_percent: Math.min(100, Math.max(0, ((24 * 60 * 60 * 1000 - remainingMs) / (24 * 60 * 60 * 1000)) * 100))
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: data,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      },
    )
  } catch (error) {
    console.error("[API Error]", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
\`\`\`

---

## 给PVE运营中心的信息

### API端点地址（最终版）

\`\`\`
https://v0-web3-membership-center.vercel.app/api/cloud-node-purchases
\`\`\`

### 测试URL

\`\`\`
https://v0-web3-membership-center.vercel.app/api/cloud-node-purchases?status=pending&limit=100
\`\`\`

### 参数说明

- `status` - 可选，值为 `pending` 或 `active`
- `wallet` - 可选，钱包地址
- `limit` - 可选，默认100

### 返回数据格式

\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "wallet_address": "0x...",
      "node_count": 1,
      "created_at": "2025-01-14T10:30:00Z",
      "status": "pending",
      "memory_gb": 32,
      "cpu_cores": 8,
      "storage_gb": 512,
      "purchase_type": "individual",
      "membership_level": "Gold",
      "expires_at": "2025-01-15T10:30:00Z",
      "deployment_countdown_hours": 23,
      "deployment_countdown_minutes": 45,
      "deployment_countdown_seconds": 30,
      "deployment_time_expired": false,
      "deployment_progress_percent": 2.1
    }
  ]
}
\`\`\`

---

## 常见问题排查

### Q: 还是返回500错误？

**A: 检查这些：**

1. **确认访问的URL正确**
   - 必须是：`https://v0-web3-membership-center.vercel.app/api/cloud-node-purchases`
   - 不是：`https://v0-web3-membership-center.vercel.app/api/assignments`

2. **清除缓存**
   - 浏览器：按 Ctrl+Shift+R 强制刷新
   - API工具：添加 `?t=${Date.now()}` 参数避免缓存

3. **检查Vercel部署状态**
   - 登录 Vercel 仪表板
   - 确认最新部署是绿色勾号
   - 查看部署日志是否有错误

4. **检查数据库表**
   - 确认 `cloud_nodes` 表存在
   - 确认表中有数据

### Q: 返回空数据？

**A: 这是正常的！**

如果数据库中没有购买记录，API会返回：
\`\`\`json
{
  "success": true,
  "data": []
}
\`\`\`

这不是错误，说明API工作正常，只是暂时没有数据。

---

## 最终确认清单

在告诉外部团队之前，请确认：

- [ ] `app/api/cloud-node-purchases/route.ts` 文件内容完全正确
- [ ] 代码已经 Git commit 并 push
- [ ] Vercel 部署显示绿色勾号
- [ ] 自己测试API返回200状态码
- [ ] 返回的JSON格式包含 `success` 和 `data` 字段

**全部确认后，才把API地址发给外部团队！**
