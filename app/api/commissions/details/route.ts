import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")
    const level = searchParams.get("level")

    if (!address) {
      return NextResponse.json({ error: "缺少钱包地址" }, { status: 400 })
    }

    const sql = neon(process.env.DATABASE_URL!)

    let query
    if (level === "all" || !level) {
      query = sql`
        SELECT 
          id,
          from_wallet,
          amount,
          commission_level,
          transaction_type,
          created_at
        FROM commission_records
        WHERE LOWER(wallet_address) = LOWER(${address})
        ORDER BY created_at DESC
        LIMIT 100
      `
    } else {
      const levelNum = Number.parseInt(level)
      query = sql`
        SELECT 
          id,
          from_wallet,
          amount,
          commission_level,
          transaction_type,
          created_at
        FROM commission_records
        WHERE LOWER(wallet_address) = LOWER(${address})
          AND commission_level = ${levelNum}
        ORDER BY created_at DESC
        LIMIT 100
      `
    }

    const records = await query

    return NextResponse.json({ records })
  } catch (error) {
    console.error("[v0] Commission details API error:", error)
    return NextResponse.json({ error: "获取佣金明细失败" }, { status: 500 })
  }
}
