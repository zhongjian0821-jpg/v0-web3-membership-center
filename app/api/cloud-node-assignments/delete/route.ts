import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { purchase_id, wallet_address } = body

    console.log("[v0] Delete assignment request:", { purchase_id, wallet_address })

    // 验证必填字段
    if (!purchase_id || !wallet_address) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少必填参数：purchase_id 和 wallet_address",
        },
        { status: 400 },
      )
    }

    // 查询该节点是否存在且分配给了指定钱包
    const existingNode = await sql`
      SELECT node_id, wallet_address, status, node_type
      FROM nodes
      WHERE node_id = ${purchase_id}
        AND wallet_address = ${wallet_address.toLowerCase()}
        AND node_type = 'cloud'
      LIMIT 1
    `

    console.log("[v0] Found node:", existingNode)

    if (existingNode.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "未找到该云节点分配记录，或该节点未分配给指定钱包地址",
        },
        { status: 404 },
      )
    }

    // 删除分配：将wallet_address设置为NULL，状态改为deploying以便重新分配
    const result = await sql`
      UPDATE nodes
      SET 
        wallet_address = NULL,
        status = 'deploying',
        updated_at = NOW()
      WHERE node_id = ${purchase_id}
        AND wallet_address = ${wallet_address.toLowerCase()}
        AND node_type = 'cloud'
    `

    console.log("[v0] Delete assignment result:", result)

    // 同时删除assigned_records表中的相关记录（如果存在）
    try {
      await sql`
        DELETE FROM assigned_records
        WHERE device_id = ${purchase_id}
          AND wallet_address = ${wallet_address.toLowerCase()}
      `
      console.log("[v0] Deleted assigned_records for device:", purchase_id)
    } catch (error) {
      console.log("[v0] No assigned_records to delete or error:", error)
    }

    return NextResponse.json({
      success: true,
      message: "设备分配已删除",
      data: {
        purchase_id,
        wallet_address,
        new_status: "deploying",
      },
    })
  } catch (error) {
    console.error("[v0] Error deleting assignment:", error)
    return NextResponse.json(
      {
        success: false,
        error: "删除分配失败",
        details: String(error),
      },
      { status: 500 },
    )
  }
}
