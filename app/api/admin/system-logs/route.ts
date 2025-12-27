import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const logType = searchParams.get("type") // purchase, withdrawal, status_change, etc.

    const offset = (page - 1) * limit

    // 从多个表聚合日志数据
    const logs: any[] = []

    // 购买日志
    if (!logType || logType === "purchase") {
      const purchases = await sql`
        SELECT 
          'purchase' as log_type,
          node_id as reference_id,
          wallet_address,
          node_type as action,
          status as result,
          created_at as timestamp
        FROM nodes
        ORDER BY created_at DESC
        LIMIT ${limit}
      `
      logs.push(...purchases)
    }

    // 提现日志
    if (!logType || logType === "withdrawal") {
      const withdrawals = await sql`
        SELECT 
          'withdrawal' as log_type,
          id::text as reference_id,
          wallet_address,
          'withdraw' as action,
          status as result,
          created_at as timestamp
        FROM withdrawal_records
        ORDER BY created_at DESC
        LIMIT ${limit}
      `
      logs.push(...withdrawals)
    }

    // 状态变更日志（通过查询nodes表的updated_at）
    if (!logType || logType === "status_change") {
      const statusChanges = await sql`
        SELECT 
          'status_change' as log_type,
          node_id as reference_id,
          wallet_address,
          'status_update' as action,
          status as result,
          updated_at as timestamp
        FROM nodes
        WHERE updated_at > created_at
        ORDER BY updated_at DESC
        LIMIT ${limit}
      `
      logs.push(...statusChanges)
    }

    // 按时间排序
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // 分页
    const paginatedLogs = logs.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: {
        logs: paginatedLogs.map((log: any) => ({
          log_type: log.log_type,
          reference_id: log.reference_id,
          wallet_address: log.wallet_address,
          action: log.action,
          result: log.result,
          timestamp: log.timestamp,
        })),
        pagination: {
          page,
          limit,
          total: logs.length,
          total_pages: Math.ceil(logs.length / limit),
        },
      },
    })
  } catch (error) {
    console.error("[v0] System logs error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch system logs" }, { status: 500 })
  }
}
