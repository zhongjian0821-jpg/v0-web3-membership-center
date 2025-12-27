import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // 查询 nodes 表中所有记录的状态分布
    const statusCount = await sql`
      SELECT status, COUNT(*) as count
      FROM nodes
      GROUP BY status
      ORDER BY count DESC
    `

    // 查询最近10条记录
    const recentNodes = await sql`
      SELECT 
        id,
        wallet_address,
        status,
        created_at,
        node_type,
        memory_gb,
        cpu_cores,
        storage_gb
      FROM nodes
      ORDER BY created_at DESC
      LIMIT 10
    `

    // 统计总记录数
    const totalCount = await sql`
      SELECT COUNT(*) as total FROM nodes
    `

    return NextResponse.json({
      success: true,
      summary: {
        total_nodes: totalCount[0]?.total || 0,
        status_distribution: statusCount,
      },
      recent_records: recentNodes,
      hint: "如果没有pending状态的记录，请检查：1) 数据是否已导入 2) status字段的实际值是什么",
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
