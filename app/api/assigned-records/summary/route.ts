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

    console.log("[v0] Querying summary:", {
      wallet,
      deviceId,
      startDate,
      endDate,
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

    const summaryResult = await sql`
      SELECT 
        COUNT(DISTINCT device_id) as total_devices,
        COUNT(*) as total_records,
        SUM(daily_income_cny) as total_income_cny,
        SUM(daily_income_ashva) as total_income_ashva,
        SUM(daily_flow_gb) as total_flow_gb,
        SUM(daily_fine_cny) as total_fine_cny,
        SUM(daily_fine_ashva) as total_fine_ashva,
        SUM(net_income_ashva) as total_net_income_ashva,
        AVG(daily_income_cny) as avg_daily_income_cny,
        AVG(daily_income_ashva) as avg_daily_income_ashva,
        MIN(record_date) as earliest_date,
        MAX(record_date) as latest_date
      FROM assigned_records 
      ${sql.unsafe(whereClause)}
    `

    const summary = summaryResult[0]

    const trendData = await sql`
      SELECT 
        record_date,
        SUM(daily_income_cny) as daily_total_cny,
        SUM(daily_income_ashva) as daily_total_ashva,
        SUM(daily_flow_gb) as daily_total_flow,
        COUNT(DISTINCT device_id) as active_devices
      FROM assigned_records 
      ${sql.unsafe(whereClause)}
      GROUP BY record_date
      ORDER BY record_date DESC
      LIMIT 30
    `

    console.log("[v0] Summary generated:", {
      totalDevices: summary.total_devices,
      totalRecords: summary.total_records,
    })

    return NextResponse.json({
      success: true,
      summary: {
        totalDevices: Number.parseInt(summary.total_devices || "0"),
        totalRecords: Number.parseInt(summary.total_records || "0"),
        totalIncomeCny: Number.parseFloat(summary.total_income_cny || "0"),
        totalIncomeAshva: Number.parseFloat(summary.total_income_ashva || "0"),
        totalFlowGb: Number.parseFloat(summary.total_flow_gb || "0"),
        totalFineCny: Number.parseFloat(summary.total_fine_cny || "0"),
        totalFineAshva: Number.parseFloat(summary.total_fine_ashva || "0"),
        totalNetIncomeAshva: Number.parseFloat(summary.total_net_income_ashva || "0"),
        avgDailyIncomeCny: Number.parseFloat(summary.avg_daily_income_cny || "0"),
        avgDailyIncomeAshva: Number.parseFloat(summary.avg_daily_income_ashva || "0"),
        earliestDate: summary.earliest_date,
        latestDate: summary.latest_date,
      },
      trend: trendData,
    })
  } catch (error) {
    console.error("[v0] Error fetching summary:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch summary",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
