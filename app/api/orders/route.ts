import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const PRODUCT_PRICES = {
  hosting: 2000, // 云节点托管
  image: 100, // 镜像节点
} as const

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    const orders = await sql`
      SELECT 
        wallet_address as "walletAddress",
        node_type as "productType",
        1 as quantity,
        purchase_price as "totalAmount",
        status as "paymentStatus",
        tx_hash as "transactionHash",
        created_at as "createdAt"
      FROM nodes
      WHERE tx_hash IS NOT NULL AND status = 'active'
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      orders: orders.map((order) => {
        const productType = order.productType === "cloud" ? "hosting" : "image"
        return {
          walletAddress: order.walletAddress,
          productType, // "hosting" (云节点托管, 2000 USDT) 或 "image" (镜像节点, 100 USDT)
          quantity: order.quantity || 1,
          totalAmount: Number.parseFloat(order.totalAmount) || PRODUCT_PRICES[productType],
          paymentStatus: "completed",
          transactionHash: order.transactionHash,
          createdAt: order.createdAt,
        }
      }),
    })
  } catch (error) {
    console.error("[v0] Error fetching orders:", error)
    return NextResponse.json({ orders: [], error: "Failed to fetch orders" }, { status: 500 })
  }
}
