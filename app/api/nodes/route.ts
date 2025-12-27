import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")

    if (!address) {
      return NextResponse.json({ error: "缺少钱包地址" }, { status: 400 })
    }

    console.log("[v0] Fetching nodes for wallet:", address)

    /*
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    await sql`
      UPDATE nodes
      SET status = 'active', updated_at = NOW()
      WHERE status = 'deploying'
      AND created_at <= ${twentyFourHoursAgo.toISOString()}
      AND LOWER(wallet_address) = LOWER(${address})
    `
    */

    const result = await sql`
      SELECT 
        node_id,
        node_type,
        status,
        cpu_cores,
        memory_gb,
        storage_gb,
        uptime_percentage,
        data_transferred_gb,
        total_earnings,
        cpu_usage_percentage,
        memory_usage_percentage,
        storage_used_percentage,
        created_at,
        is_transferable
      FROM nodes
      WHERE LOWER(wallet_address) = LOWER(${address})
      ORDER BY created_at DESC
    `

    console.log("[v0] Found nodes in database:", result.length)
    console.log(
      "[v0] Nodes status:",
      result.map((n) => ({ id: n.node_id, status: n.status })),
    )

    const nodes = result.map((node) => ({
      id: node.node_id,
      machineId: node.node_id,
      type: node.node_type,
      status: node.status,
      specs: {
        cpu: node.cpu_cores || 8,
        memory: node.memory_gb || 16,
        storage: node.storage_gb || 500,
        bandwidth: node.node_type === "cloud" ? "无限" : undefined,
      },
      performance: {
        uptime: node.uptime_percentage || "99.90",
        dataTransferred: node.data_transferred_gb || "0.00",
        earnings: `${Number(node.total_earnings || 0)} ASHVA`,
        earningsAshva: Number(node.total_earnings || 0),
        earningsDisplay: `${Number(node.total_earnings || 0).toFixed(2)} ASHVA`,
        cpuUsage: node.cpu_usage_percentage?.toString() || "45",
        memoryUsage: node.memory_usage_percentage?.toString() || "60",
        storageUsage: node.storage_used_percentage?.toString() || "35",
      },
      purchaseDate: node.created_at ? new Date(node.created_at).toISOString() : new Date().toISOString(),
      isTransferable: node.is_transferable ?? true,
    }))

    console.log("[v0] Returning nodes:", nodes.length)
    console.log("[v0] Deploying nodes:", nodes.filter((n) => n.status === "deploying").length)
    console.log("[v0] Active nodes:", nodes.filter((n) => n.status === "active").length)

    return NextResponse.json({ nodes })
  } catch (error) {
    console.error("[v0] Nodes API error:", error)
    return NextResponse.json({ error: "获取节点数据失败" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, nodeType, config, txHash, amount } = body

    console.log("[v0] Node purchase request:", {
      walletAddress,
      nodeType,
      config,
      txHash,
      amount,
    })

    if (!walletAddress || !nodeType || !config || !txHash) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 })
    }

    // 保存节点购买记录到数据库
    const result = await sql`
      INSERT INTO node_purchases (
        wallet_address,
        node_type,
        cpu,
        memory,
        storage,
        tx_hash,
        amount,
        status,
        created_at
      ) VALUES (
        ${walletAddress.toLowerCase()},
        ${nodeType},
        ${config.cpu || 0},
        ${config.memory || 0},
        ${config.storage || 0},
        ${txHash},
        ${amount},
        'pending',
        NOW()
      )
      RETURNING *
    `

    console.log("[v0] Node purchase recorded:", result)

    return NextResponse.json({
      success: true,
      purchase: result[0],
      message: "节点购买记录已保存",
    })
  } catch (error: any) {
    console.error("[v0] Node purchase API error:", error)
    return NextResponse.json(
      {
        error: "保存购买记录失败",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
