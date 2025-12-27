import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    // 24小时前的时间戳
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    console.log("[v0] Checking for nodes to activate, created before:", twentyFourHoursAgo)

    // 查找所有24小时前创建且仍在部署中的节点
    const result = await sql`
      UPDATE nodes
      SET status = 'active', updated_at = NOW()
      WHERE status = 'deploying'
      AND created_at <= ${twentyFourHoursAgo.toISOString()}
      RETURNING node_id, wallet_address, created_at
    `

    console.log("[v0] Activated nodes:", result.length)

    if (result.length > 0) {
      result.forEach((node) => {
        console.log("[v0] Node activated:", node.node_id, "for wallet:", node.wallet_address)
      })
    }

    return NextResponse.json({
      success: true,
      activatedCount: result.length,
      nodes: result,
    })
  } catch (error) {
    console.error("[v0] Update node status error:", error)
    return NextResponse.json({ error: "更新节点状态失败" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
