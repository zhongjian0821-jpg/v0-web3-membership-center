import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

async function getAshvaPrice(): Promise<number> {
  try {
    // 从环境变量获取配置的价格
    const configuredPrice = process.env.NEXT_PUBLIC_ASHVA_PRICE

    if (configuredPrice) {
      const price = Number.parseFloat(configuredPrice)
      console.log("[v0] ASHVA price from env:", price, "CNY")
      return price
    }

    // 默认使用昨日最高价 0.06 CNY
    console.log("[v0] Using default ASHVA price: 0.06 CNY")
    return 0.06
  } catch (error) {
    console.error("[v0] Error parsing ASHVA price:", error)
    return 0.06 // 默认价格
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("walletAddress")

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    console.log("[v0] Fetching assignments for wallet:", walletAddress)

    const ashvaPrice = await getAshvaPrice()
    console.log("[v0] ASHVA price (CNY):", ashvaPrice)

    const assignments = await sql`
      SELECT 
        id,
        node_id as "deviceId",
        node_type as "nodeType",
        wallet_address as "walletAddress",
        status,
        cpu_cores as "cpuCores",
        memory_gb as "memoryGb",
        storage_gb as "storageGb",
        uptime_percentage as "uptimePercentage",
        cpu_usage_percentage as "cpuUsage",
        memory_usage_percentage as "memoryUsage",
        storage_used_percentage as "storageUsage",
        data_transferred_gb as "dataTransferred",
        total_earnings as "earnings",
        purchase_price as "purchasePrice",
        created_at as "assignedAt",
        updated_at as "lastUpdated",
        is_transferable as "isTransferable"
      FROM nodes
      WHERE wallet_address = ${walletAddress.toLowerCase()}
      AND status IN ('active', 'inactive', 'maintenance', 'deploying')
      ORDER BY created_at DESC
    `

    console.log("[v0] Found assignments:", assignments.length)

    const formattedAssignments = assignments.map((node: any) => {
      const deviceId = node.deviceId || `cb3c20f05cd89728af${node.id}`
      // 收益数据
      const totalEarnings = node.earnings ? Number.parseFloat(node.earnings) : 0
      const ashvaEarnings = ashvaPrice > 0 ? totalEarnings / ashvaPrice : 0

      return {
        id: deviceId,
        userAddress: node.walletAddress,
        deviceId: deviceId,
        deviceName: node.nodeType === "hosting" || node.nodeType === "cloud" ? "云节点托管" : "镜像节点",
        nodeType: node.nodeType === "cloud" ? "hosting" : node.nodeType,
        status: node.status,
        specs: {
          cpu: node.cpuCores || 0,
          memory: node.memoryGb || 0,
          storage: node.storageGb || 0,
        },
        performance: {
          uptime: Number.parseFloat(node.uptimePercentage || "0").toFixed(2),
          cpuUsage: Number.parseFloat(node.cpuUsage || "0").toFixed(2),
          memoryUsage: Number.parseFloat(node.memoryUsage || "0").toFixed(2),
          storageUsage: Number.parseFloat(node.storageUsage || "0").toFixed(2),
          dataTransferred: Number.parseFloat(node.dataTransferred || "0").toFixed(2),
          earnings: `¥${totalEarnings.toFixed(2)}`,
          earningsCny: totalEarnings,
          earningsAshva: ashvaEarnings,
          earningsDisplay: `¥${totalEarnings.toFixed(2)} (${ashvaEarnings.toFixed(2)} ASHVA)`,
        },
        purchasePrice: Number.parseFloat(node.purchasePrice || "0"),
        assignedAt: node.assignedAt,
        lastUpdated: node.lastUpdated,
        isTransferable: node.isTransferable || false,
      }
    })

    console.log("[v0] Formatted assignments:", JSON.stringify(formattedAssignments, null, 2))

    return NextResponse.json({
      success: true,
      walletAddress,
      totalAssignments: formattedAssignments.length,
      data: formattedAssignments,
    })
  } catch (error) {
    console.error("[v0] Error fetching assignments:", error)
    return NextResponse.json({ error: "Failed to fetch assignments", details: String(error) }, { status: 500 })
  }
}
