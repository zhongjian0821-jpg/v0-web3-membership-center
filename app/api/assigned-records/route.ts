import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet = searchParams.get("wallet")
    const deviceId = searchParams.get("device_id")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const offset = (page - 1) * limit

    console.log("[v0] Querying assigned records:", {
      wallet,
      deviceId,
      startDate,
      endDate,
      page,
      limit,
    })

    const conditions: string[] = []

    if (wallet) {
      conditions.push(`LOWER(wallet_address) = '${wallet.toLowerCase()}'`)
    }

    if (deviceId) {
      conditions.push(`device_id = '${deviceId}'`)
    }

    if (startDate) {
      conditions.push(`record_date >= '${startDate}'`)
    }

    if (endDate) {
      conditions.push(`record_date <= '${endDate}'`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    const countResult = await sql`
      SELECT COUNT(*) as total 
      FROM assigned_records 
      ${sql.unsafe(whereClause)}
    `
    const total = Number.parseInt(countResult[0]?.total || "0")

    const records = await sql`
      SELECT 
        id,
        device_id,
        wallet_address,
        record_date,
        daily_income_cny,
        daily_income_ashva,
        daily_flow_gb,
        daily_fine_cny,
        daily_fine_ashva,
        net_income_ashva,
        ashva_price_usd,
        cny_to_usd_rate,
        price_source,
        assigned_at,
        created_at,
        updated_at
      FROM assigned_records 
      ${sql.unsafe(whereClause)}
      ORDER BY record_date DESC, created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    console.log("[v0] Found records:", records.length)

    return NextResponse.json({
      success: true,
      data: records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching assigned records:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch assigned records",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
