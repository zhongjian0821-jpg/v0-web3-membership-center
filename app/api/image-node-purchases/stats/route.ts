import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

/**
 * 获取100U镜像节点购买统计数据
 * GET /api/image-node-purchases/stats
 *
 * 返回镜像节点购买的汇总统计信息
 */
export async function GET() {
  try {
    console.log("[v0] 📊 开始查询100U镜像节点购买统计数据...")

    // 查询汇总统计
    const summaryResult = await sql`
      SELECT * FROM image_node_purchases_summary
    `

    // 查询排名前10的买家
    const topBuyersResult = await sql`
      SELECT * FROM image_node_top_buyers
    `

    const summary = summaryResult.rows[0] || {
      total_purchases: 0,
      unique_buyers: 0,
      total_revenue_usd: 0,
      total_staking_ashva: 0,
      completed_count: 0,
      pending_count: 0,
      failed_count: 0,
      pending_revenue_usd: 0,
      completed_revenue_usd: 0,
    }

    console.log("[v0] 📊 100U镜像节点统计:", {
      总购买数: summary.total_purchases,
      独立买家: summary.unique_buyers,
      总收入: `${summary.total_revenue_usd} USDT`,
      已完成: summary.completed_count,
      待处理: summary.pending_count,
      失败: summary.failed_count,
    })

    const response = {
      success: true,
      data: {
        // 汇总数据
        total_purchases: Number(summary.total_purchases) || 0,
        unique_buyers: Number(summary.unique_buyers) || 0,
        total_revenue_usd: Number(summary.total_revenue_usd) || 0,
        total_staking_ashva: Number(summary.total_staking_ashva) || 0,
        completed_revenue_usd: Number(summary.completed_revenue_usd) || 0,
        pending_revenue_usd: Number(summary.pending_revenue_usd) || 0,

        // 状态统计
        completed_count: Number(summary.completed_count) || 0,
        pending_count: Number(summary.pending_count) || 0,
        failed_count: Number(summary.failed_count) || 0,

        // 排名前10的买家
        top_buyers: topBuyersResult.rows.map((buyer) => ({
          wallet_address: buyer.wallet_address,
          purchase_count: Number(buyer.purchase_count),
          total_spent_usd: Number(buyer.total_spent_usd),
          total_staked_ashva: Number(buyer.total_staked_ashva),
          last_purchase_date: buyer.last_purchase_date,
        })),
      },
    }

    return NextResponse.json(response, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  } catch (error) {
    console.error("[v0] ❌ 查询100U镜像节点统计失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch image node purchase statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// CORS预检请求处理
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
