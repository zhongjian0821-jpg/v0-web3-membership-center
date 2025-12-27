import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] 开始同步设备状态...")

    // 获取钱包地址参数（可选）
    const body = await request.json().catch(() => ({}))
    const { wallet_address } = body

    // 查询所有deploying状态的云节点
    let nodesToCheck
    if (wallet_address) {
      console.log(`[v0] 查询钱包 ${wallet_address} 的deploying节点...`)
      nodesToCheck = await sql`
        SELECT node_id, wallet_address, status 
        FROM nodes 
        WHERE LOWER(wallet_address) = LOWER(${wallet_address})
          AND status = 'deploying'
          AND node_type = 'cloud'
      `
    } else {
      console.log("[v0] 查询所有deploying状态的云节点...")
      nodesToCheck = await sql`
        SELECT node_id, wallet_address, status 
        FROM nodes 
        WHERE status = 'deploying'
          AND node_type = 'cloud'
      `
    }

    console.log(`[v0] 找到 ${nodesToCheck.length} 个待检查的节点`)

    const updatedNodes = []
    const errors = []

    // 逐个检查PVE运营中心是否已分配设备
    for (const node of nodesToCheck) {
      try {
        console.log(`[v0] 检查节点 ${node.node_id} (${node.wallet_address})...`)

        // 调用PVE运营中心API检查设备分配状态
        const pveResponse = await fetch(`https://pve.example.com/api/devices?wallet=${node.wallet_address}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        if (pveResponse.ok) {
          const pveData = await pveResponse.json()

          // 如果PVE返回了已分配的设备，更新状态为active
          if (pveData.devices && pveData.devices.length > 0) {
            console.log(`[v0] 节点 ${node.node_id} 已在PVE分配设备，更新状态为active`)

            await sql`
              UPDATE nodes 
              SET status = 'active',
                  updated_at = NOW()
              WHERE node_id = ${node.node_id}
            `

            updatedNodes.push({
              node_id: node.node_id,
              wallet_address: node.wallet_address,
              old_status: "deploying",
              new_status: "active",
              devices_count: pveData.devices.length,
            })
          } else {
            console.log(`[v0] 节点 ${node.node_id} 在PVE尚未分配设备`)
          }
        }
      } catch (error: any) {
        console.error(`[v0] 检查节点 ${node.node_id} 失败:`, error.message)
        errors.push({
          node_id: node.node_id,
          error: error.message,
        })
      }
    }

    console.log(`[v0] 同步完成，更新了 ${updatedNodes.length} 个节点`)

    return NextResponse.json(
      {
        success: true,
        message: `同步完成，更新了 ${updatedNodes.length} 个节点状态`,
        data: {
          checked: nodesToCheck.length,
          updated: updatedNodes.length,
          updated_nodes: updatedNodes,
          errors,
        },
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    )
  } catch (error: any) {
    console.error("[v0] 同步设备状态失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: "同步设备状态失败",
        details: error.message,
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
