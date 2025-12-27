import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet = searchParams.get("wallet")
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const offset = (page - 1) * limit

    // 构建查询条件
    let whereClause = "WHERE 1=1"
    const params: any[] = []

    if (wallet) {
      params.push(wallet.toLowerCase())
      whereClause += ` AND LOWER(wallet_address) = $${params.length}`
    }

    if (status) {
      params.push(status)
      whereClause += ` AND status = $${params.length}`
    }

    // 获取提现记录
    const records = await sql.unsafe(
      `
      SELECT 
        id,
        wallet_address,
        amount,
        amount_usd,
        burn_rate,
        burn_amount,
        actual_amount,
        status,
        tx_hash,
        withdrawal_type,
        created_at,
        processed_at
      FROM withdrawal_records
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `,
      [...params, limit, offset],
    )

    // 获取总数
    const countResult = await sql.unsafe(
      `
      SELECT COUNT(*) as total FROM withdrawal_records ${whereClause}
    `,
      params,
    )

    const total = Number(countResult[0].total)
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: {
        records: records.map((record: any) => ({
          id: record.id,
          wallet_address: record.wallet_address,
          amount: Number(record.amount),
          amount_usd: Number(record.amount_usd),
          burn_rate: Number(record.burn_rate || 0),
          burn_amount: Number(record.burn_amount || 0),
          actual_amount: Number(record.actual_amount),
          status: record.status,
          tx_hash: record.tx_hash,
          withdrawal_type: record.withdrawal_type,
          created_at: record.created_at,
          processed_at: record.processed_at,
        })),
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
        },
      },
    })
  } catch (error) {
    console.error("[v0] Withdrawal history error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch withdrawal history" }, { status: 500 })
  }
}
