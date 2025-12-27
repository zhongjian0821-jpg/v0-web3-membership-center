import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

const PRODUCT_PRICES = {
  hosting: 2000, // 云节点托管
  image: 100, // 镜像节点
}

const PRODUCT_NAMES = {
  hosting: "云节点托管",
  image: "云节点镜像",
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("walletAddress")

    if (!walletAddress) {
      return NextResponse.json({ success: false, error: "缺少钱包地址参数" }, { status: 400 })
    }

    console.log("[v0] Fetching devices for wallet:", walletAddress)

    const orders = await sql`
      SELECT 
        id,
        node_type,
        purchase_price,
        status,
        tx_hash,
        created_at,
        node_id,
        total_earnings
      FROM nodes
      WHERE LOWER(wallet_address) = LOWER(${walletAddress})
        AND tx_hash IS NOT NULL
      ORDER BY created_at DESC
    `

    console.log("[v0] Found orders:", orders.length)

    const devices = orders.map((order: any) => {
      const productType = order.node_type || "hosting"
      const quantity = 1
      const amount = order.purchase_price || PRODUCT_PRICES[productType as keyof typeof PRODUCT_PRICES] || 0

      return {
        orderId: order.id?.toString() || "",
        productType,
        productName: PRODUCT_NAMES[productType as keyof typeof PRODUCT_NAMES] || "未知产品",
        quantity,
        amount,
        totalAmount: amount * quantity,
        status: order.status === "active" ? "completed" : order.status,
        transactionHash: order.tx_hash || "",
        purchaseDate: order.created_at,
        devices: order.node_id
          ? [
              {
                deviceId: order.node_id,
                deviceName: `${PRODUCT_NAMES[productType as keyof typeof PRODUCT_NAMES]}-${order.node_id.slice(0, 8)}`,
                status: order.status || "active",
                earnings: order.total_earnings || 0,
              },
            ]
          : [],
      }
    })

    const summary = {
      totalOrders: devices.length,
      totalAmount: devices.reduce((sum: number, d: any) => sum + d.totalAmount, 0),
      hostingCount: devices.filter((d: any) => d.productType === "hosting").length,
      imageCount: devices.filter((d: any) => d.productType === "image").length,
    }

    return NextResponse.json({
      success: true,
      walletAddress,
      devices,
      summary,
    })
  } catch (error: any) {
    console.error("[v0] Customer devices API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "查询设备失败",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
