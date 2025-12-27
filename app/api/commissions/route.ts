import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")

    if (!address) {
      return NextResponse.json({ error: "缺少钱包地址" }, { status: 400 })
    }

    const sql = neon(process.env.DATABASE_URL!)

    // Fetch commission totals
    const commissionSummary = await sql`
      SELECT 
        commission_level,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as transaction_count
      FROM commission_records
      WHERE LOWER(wallet_address) = LOWER(${address})
      GROUP BY commission_level
    `

    let level1Total = 0
    let level2Total = 0
    let level1Count = 0
    let level2Count = 0

    commissionSummary.forEach((row) => {
      if (row.commission_level === 1) {
        level1Total = Number.parseFloat(row.total_amount.toString())
        level1Count = Number.parseInt(row.transaction_count.toString())
      } else if (row.commission_level === 2) {
        level2Total = Number.parseFloat(row.total_amount.toString())
        level2Count = Number.parseInt(row.transaction_count.toString())
      }
    })

    return NextResponse.json({
      level1Total,
      level2Total,
      level1Count,
      level2Count,
    })
  } catch (error) {
    console.error("[v0] Commission API error:", error)
    return NextResponse.json({ error: "获取佣金数据失败" }, { status: 500 })
  }
}
