import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

/**
 * POST /api/sync/node-data
 *
 * 用于后台系统同步节点的真实数据（机器号、收益等）
 *
 * 请求体示例:
 * {
 *   "walletAddress": "0x8fc07A7F4886BA53acd58d77666A88e1392C716D",
 *   "nodes": [
 *     {
 *       "orderId": 21,  // 可选，数据库中的记录ID
 *       "deviceId": "CN-1765356605859-8jynl6pys",  // 真实机器号
 *       "earnings": 150.50,  // 真实收益（ASHVA）
 *       "status": "active",  // 节点状态: active, inactive, maintenance
 *       "performance": {  // 可选的性能数据
 *         "uptime": 99.90,
 *         "cpuUsage": 45.00,
 *         "memoryUsage": 60.00,
 *         "storageUsage": 35.00,
 *         "dataTransferred": 125.50
 *       }
 *     }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, nodes, apiKey } = body

    console.log("[v0] Sync request received:", {
      walletAddress,
      nodeCount: nodes?.length,
    })

    // 可选：验证API密钥（建议在生产环境中启用）
    // if (apiKey !== process.env.BACKEND_API_KEY) {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   )
    // }

    if (!walletAddress || !nodes || !Array.isArray(nodes)) {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 })
    }

    const updatedNodes = []
    const errors = []

    for (const node of nodes) {
      try {
        const { orderId, deviceId, earnings, status, performance } = node

        console.log("[v0] Processing node update:", {
          orderId,
          deviceId,
          earnings,
        })

        // 构建更新字段
        const updates = []
        const values = []
        let paramIndex = 1

        if (deviceId !== undefined) {
          updates.push(`node_id = $${paramIndex++}`)
          values.push(deviceId)
        }

        if (earnings !== undefined) {
          updates.push(`total_earnings = $${paramIndex++}`)
          values.push(earnings)
        }

        if (status !== undefined) {
          updates.push(`status = $${paramIndex++}`)
          values.push(status)
        }

        if (performance) {
          if (performance.uptime !== undefined) {
            updates.push(`uptime_percentage = $${paramIndex++}`)
            values.push(performance.uptime)
          }
          if (performance.cpuUsage !== undefined) {
            updates.push(`cpu_usage_percentage = $${paramIndex++}`)
            values.push(performance.cpuUsage)
          }
          if (performance.memoryUsage !== undefined) {
            updates.push(`memory_usage_percentage = $${paramIndex++}`)
            values.push(performance.memoryUsage)
          }
          if (performance.storageUsage !== undefined) {
            updates.push(`storage_used_percentage = $${paramIndex++}`)
            values.push(performance.storageUsage)
          }
          if (performance.dataTransferred !== undefined) {
            updates.push(`data_transferred_gb = $${paramIndex++}`)
            values.push(performance.dataTransferred)
          }
        }

        // 添加更新时间
        updates.push(`updated_at = NOW()`)

        if (updates.length === 1) {
          // 只有 updated_at，跳过
          console.log("[v0] No fields to update for node:", orderId || deviceId)
          continue
        }

        // 构建 WHERE 条件
        let whereClause = ""
        if (orderId) {
          whereClause = `WHERE id = $${paramIndex} AND wallet_address = $${paramIndex + 1}`
          values.push(orderId, walletAddress.toLowerCase())
        } else if (deviceId) {
          whereClause = `WHERE node_id = $${paramIndex} AND wallet_address = $${paramIndex + 1}`
          values.push(deviceId, walletAddress.toLowerCase())
        } else {
          errors.push({
            node,
            error: "Either orderId or deviceId must be provided",
          })
          continue
        }

        // 执行更新
        const updateQuery = `
          UPDATE nodes
          SET ${updates.join(", ")}
          ${whereClause}
          RETURNING id, node_id, total_earnings, status
        `

        console.log("[v0] Executing update query:", updateQuery)
        console.log("[v0] With values:", values)

        const result = await sql(updateQuery, values)

        if (result.length > 0) {
          updatedNodes.push(result[0])
          console.log("[v0] Node updated successfully:", result[0])
        } else {
          errors.push({
            node,
            error: "Node not found or wallet address mismatch",
          })
        }
      } catch (error: any) {
        console.error("[v0] Error updating node:", error)
        errors.push({
          node,
          error: error.message,
        })
      }
    }

    console.log("[v0] Sync completed:", {
      updated: updatedNodes.length,
      errors: errors.length,
    })

    return NextResponse.json({
      success: true,
      updated: updatedNodes.length,
      updatedNodes,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error("[v0] Sync API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 },
    )
  }
}

/**
 * GET /api/sync/node-data?walletAddress={address}
 *
 * 获取指定钱包的所有节点数据（供后台系统查询）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("walletAddress")

    if (!walletAddress) {
      return NextResponse.json({ success: false, error: "walletAddress is required" }, { status: 400 })
    }

    console.log("[v0] Fetching nodes for sync:", walletAddress)

    const nodes = await sql`
      SELECT 
        id,
        node_id as "deviceId",
        node_type as "nodeType",
        total_earnings as "earnings",
        status,
        cpu_cores as "cpuCores",
        memory_gb as "memoryGb",
        storage_gb as "storageGb",
        uptime_percentage as "uptimePercentage",
        cpu_usage_percentage as "cpuUsage",
        memory_usage_percentage as "memoryUsage",
        storage_used_percentage as "storageUsage",
        data_transferred_gb as "dataTransferred",
        purchase_price as "purchasePrice",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM nodes
      WHERE wallet_address = ${walletAddress.toLowerCase()}
      ORDER BY created_at DESC
    `

    console.log("[v0] Found nodes:", nodes.length)

    return NextResponse.json({
      success: true,
      walletAddress,
      nodes,
    })
  } catch (error: any) {
    console.error("[v0] Sync GET API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 },
    )
  }
}
