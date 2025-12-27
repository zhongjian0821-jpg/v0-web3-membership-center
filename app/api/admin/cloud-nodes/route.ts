import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // 查询所有云节点托管记录
    const nodes = await sql`
      SELECT 
        id,
        node_id,
        wallet_address,
        node_type,
        status,
        purchase_price,
        cpu_cores,
        memory_gb,
        storage_gb,
        uptime_percentage,
        cpu_usage_percentage,
        memory_usage_percentage,
        storage_used_percentage,
        total_earnings,
        data_transferred_gb,
        is_transferable,
        created_at,
        updated_at
      FROM nodes
      WHERE node_type = 'cloud'
      ORDER BY created_at DESC
    `

    // 统计数据
    const stats = await sql`
      SELECT 
        COUNT(*) as total_nodes,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_nodes,
        COUNT(CASE WHEN status = 'deploying' THEN 1 END) as deploying_nodes,
        SUM(purchase_price) as total_purchase_amount,
        SUM(total_earnings) as total_earnings_amount
      FROM nodes
      WHERE node_type = 'cloud'
    `

    return NextResponse.json({
      success: true,
      nodes,
      stats: stats[0],
      total: nodes.length,
    })
  } catch (error) {
    console.error("[v0] Error fetching cloud nodes:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch cloud nodes",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
