import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const runtime = "edge"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Webhook received")

    // 解析请求体
    const body = await request.json()
    console.log("[v0] Webhook payload:", body)

    const { walletAddress, productType, quantity, totalAmount, transactionHash, createdAt } = body

    // 验证必要参数
    if (!walletAddress || !productType || !transactionHash) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 })
    }

    // 检查交易是否已存在
    const existing = await sql`
      SELECT id FROM nodes 
      WHERE transaction_hash = ${transactionHash}
    `

    if (existing.length > 0) {
      console.log("[v0] Transaction already exists:", transactionHash)
      return NextResponse.json({
        success: true,
        message: "订单已存在",
        duplicate: true,
      })
    }

    // 根据产品类型创建节点记录
    if (productType === "hosting") {
      // 云节点托管
      await sql`
        INSERT INTO nodes (
          wallet_address,
          node_type,
          cpu_cores,
          memory_gb,
          storage_gb,
          total_price,
          payment_status,
          transaction_hash,
          created_at
        ) VALUES (
          ${walletAddress},
          'cloud',
          ${quantity || 4},
          ${quantity || 8},
          ${quantity || 100},
          ${totalAmount || 20},
          'completed',
          ${transactionHash},
          ${createdAt || new Date().toISOString()}
        )
      `

      console.log("[v0] Cloud node created for:", walletAddress)
    } else if (productType === "image") {
      // 镜像节点
      await sql`
        INSERT INTO nodes (
          wallet_address,
          node_type,
          quantity,
          total_price,
          payment_status,
          transaction_hash,
          created_at
        ) VALUES (
          ${walletAddress},
          'image',
          ${quantity || 1},
          ${totalAmount || 1},
          'completed',
          ${transactionHash},
          ${createdAt || new Date().toISOString()}
        )
      `

      console.log("[v0] Image node created for:", walletAddress)
    }

    return NextResponse.json({
      success: true,
      message: "购买记录已同步",
    })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "处理失败" }, { status: 500 })
  }
}
