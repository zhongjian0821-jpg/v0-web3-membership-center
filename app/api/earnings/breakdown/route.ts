import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet = searchParams.get("wallet")
    const type = searchParams.get("type") // 'team' 或 'node'
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    if (!wallet) {
      return NextResponse.json({ success: false, error: "钱包地址必填" }, { status: 400 })
    }

    console.log(`[v0] 📋 查询收益明细: ${wallet}, 类型: ${type || "全部"}`)

    let teamRecords: any[] = []
    let nodeRecords: any[] = []

    if (!type || type === "team") {
      const teamQuery = await sql`
        SELECT 
          cr.id,
          cr.wallet_address,
          cr.from_wallet,
          cr.amount,
          cr.commission_type,
          cr.source_transaction,
          cr.created_at,
          n.node_type,
          n.purchase_price
        FROM commission_records cr
        LEFT JOIN nodes n ON cr.source_transaction = n.tx_hash
        WHERE cr.wallet_address = ${wallet}
        ORDER BY cr.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `

      teamRecords = teamQuery.map((record: any) => ({
        id: record.id,
        type: "team",
        source: "团队推荐佣金",
        amount: Number(record.amount || 0),
        commission_type: record.commission_type === "direct" ? "直推" : "间推",
        purchase_type: record.node_type === "cloud" ? "云节点托管(2000U)" : "镜像节点(100U)",
        referred_user: record.from_wallet,
        date: record.created_at,
        status: "completed",
      }))

      console.log(`[v0] 💰 团队佣金记录: ${teamRecords.length}条`)
    }
    // </CHANGE>

    if (!type || type === "node") {
      try {
        const nodeResponse = await fetch(
          `${process.env.NEXT_PUBLIC_PVE_API_BASE_URL || "https://pve-operation-center.vercel.app"}/api/assigned-records?wallet=${wallet}&limit=${limit}&offset=${offset}`,
          { next: { revalidate: 60 } },
        )

        if (nodeResponse.ok) {
          const nodeData = await nodeResponse.json()
          nodeRecords = (nodeData?.data || []).map((record: any) => ({
            id: record.id || record.record_date,
            type: "node",
            source: "节点运行收益",
            amount: Number(record.daily_income_ashva || 0),
            date: record.record_date,
            online_rate: record.online_rate,
            node_id: record.node_id,
            status: "completed",
          }))

          console.log(`[v0] ⚙️ 节点收益记录: ${nodeRecords.length}条`)
        }
      } catch (error) {
        console.error("[v0] 获取节点收益明细失败:", error)
      }
    }
    // </CHANGE>

    const allRecords = [...teamRecords, ...nodeRecords].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )

    const response = {
      success: true,
      data: {
        records: allRecords,
        pagination: {
          total: allRecords.length,
          limit,
          offset,
        },
        summary: {
          team_records: teamRecords.length,
          node_records: nodeRecords.length,
          total_records: allRecords.length,
        },
      },
    }

    console.log(`[v0] ✅ 返回收益明细: 团队${teamRecords.length}条 + 节点${nodeRecords.length}条`)
    // </CHANGE>

    return NextResponse.json(response, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  } catch (error) {
    console.error("[v0] ❌ 查询收益明细失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "查询失败",
      },
      { status: 500 },
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    },
  )
}
