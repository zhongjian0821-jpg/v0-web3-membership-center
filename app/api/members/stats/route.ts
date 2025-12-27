import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // 获取会员统计数据
    const totalUsersResult = await sql`
      SELECT COUNT(*) as total FROM wallets
    `

    const levelDistributionResult = await sql`
      SELECT 
        member_level,
        COUNT(*) as count
      FROM wallets
      GROUP BY member_level
    `

    const purchaseStatsResult = await sql`
      SELECT 
        COUNT(*) as total_purchases,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_purchases
      FROM nodes
    `

    return NextResponse.json(
      {
        totalUsers: Number.parseInt(totalUsersResult.rows[0].total),
        levelDistribution: {
          normal: Number.parseInt(levelDistributionResult.rows.find((r) => r.member_level === "normal")?.count || 0),
          market_partner: Number.parseInt(
            levelDistributionResult.rows.find((r) => r.member_level === "market_partner")?.count || 0,
          ),
          global_partner: Number.parseInt(
            levelDistributionResult.rows.find((r) => r.member_level === "global_partner")?.count || 0,
          ),
        },
        totalPurchases: Number.parseInt(purchaseStatsResult.rows[0].total_purchases || 0),
        activePurchases: Number.parseInt(purchaseStatsResult.rows[0].active_purchases || 0),
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Error fetching member stats:", error)
    return NextResponse.json({ error: "Failed to fetch member stats" }, { status: 500 })
  }
}

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
