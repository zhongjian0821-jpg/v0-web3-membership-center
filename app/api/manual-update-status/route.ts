import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"
const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { node_id, wallet_address, new_status } = body

    if (!new_status || !["deploying", "active", "inactive"].includes(new_status)) {
      return NextResponse.json(
        {
          success: false,
          error: "无效的状态值，必须是: deploying, active, inactive",
        },
        { status: 400 },
      )
    }

    console.log(`[v0] 手动更新节点状态: ${node_id || wallet_address} -> ${new_status}`)

    let result
    if (node_id) {
      result = await sql`
        UPDATE nodes 
        SET status = ${new_status},
            updated_at = NOW()
        WHERE node_id = ${node_id}
        RETURNING node_id, wallet_address, status
      `
    } else if (wallet_address) {
      result = await sql`
        UPDATE nodes 
        SET status = ${new_status},
            updated_at = NOW()
        WHERE LOWER(wallet_address) = LOWER(${wallet_address})
        RETURNING node_id, wallet_address, status
      `
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "必须提供 node_id 或 wallet_address",
        },
        { status: 400 },
      )
    }

    console.log(`[v0] 更新成功，影响 ${result.length} 个节点`)

    return NextResponse.json(
      {
        success: true,
        message: `成功更新 ${result.length} 个节点状态`,
        data: result,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    )
  } catch (error: any) {
    console.error("[v0] 手动更新状态失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: "更新状态失败",
        details: error.message,
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
