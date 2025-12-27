import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "month" // day, week, month, year

    let dateFormat = "YYYY-MM-DD"
    let dateGrouping = "DATE(created_at)"

    if (period === "month") {
      dateFormat = "YYYY-MM"
      dateGrouping = "TO_CHAR(created_at, 'YYYY-MM')"
    } else if (period === "year") {
      dateFormat = "YYYY"
      dateGrouping = "TO_CHAR(created_at, 'YYYY')"
    }

    // 获取收入趋势
    const revenueTrend = await sql.unsafe(`
      SELECT 
        ${dateGrouping} as period,
        COUNT(*) as order_count,
        SUM(CAST(purchase_price AS DECIMAL)) as revenue_cents,
        COUNT(CASE WHEN node_type = 'cloud' THEN 1 END) as cloud_count,
        COUNT(CASE WHEN node_type = 'image' THEN 1 END) as image_count
      FROM nodes
      WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY ${dateGrouping}
      ORDER BY period DESC
    `)

    // 获取各类型收入
    const revenueByType = await sql`
      SELECT 
        node_type,
        COUNT(*) as order_count,
        SUM(CAST(purchase_price AS DECIMAL)) as revenue_cents
      FROM nodes
      GROUP BY node_type
    `

    // 获取Top购买用户
    const topBuyers = await sql`
      SELECT 
        wallet_address,
        COUNT(*) as order_count,
        SUM(CAST(purchase_price AS DECIMAL)) as total_spent_cents
      FROM nodes
      GROUP BY wallet_address
      ORDER BY total_spent_cents DESC
      LIMIT 10
    `

    return NextResponse.json({
      success: true,
      data: {
        revenue_trend: revenueTrend.map((item: any) => ({
          period: item.period,
          order_count: Number(item.order_count),
          revenue_ashva: Math.round(Number(item.revenue_cents) / 100),
          cloud_count: Number(item.cloud_count),
          image_count: Number(item.image_count),
        })),
        revenue_by_type: revenueByType.map((item: any) => ({
          type: item.node_type,
          order_count: Number(item.order_count),
          revenue_ashva: Math.round(Number(item.revenue_cents) / 100),
        })),
        top_buyers: topBuyers.map((buyer: any) => ({
          wallet_address: buyer.wallet_address,
          order_count: Number(buyer.order_count),
          total_spent_ashva: Math.round(Number(buyer.total_spent_cents) / 100),
        })),
      },
    })
  } catch (error) {
    console.error("[v0] Revenue report error:", error)
    return NextResponse.json({ success: false, error: "Failed to generate revenue report" }, { status: 500 })
  }
}
