import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("walletAddress")

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    const stats = await sql`
      SELECT 
        COUNT(*) as "totalNodes",
        COUNT(*) FILTER (WHERE status = 'active') as "activeNodes",
        COUNT(*) FILTER (WHERE status = 'inactive') as "inactiveNodes",
        COUNT(*) FILTER (WHERE status = 'maintenance') as "maintenanceNodes",
        COUNT(*) FILTER (WHERE node_type = 'hosting') as "hostingNodes",
        COUNT(*) FILTER (WHERE node_type = 'image') as "imageNodes",
        COALESCE(SUM(total_earnings), 0) as "totalEarnings",
        COALESCE(AVG(uptime_percentage), 0) as "avgUptime",
        COALESCE(SUM(data_transferred_gb), 0) as "totalDataTransferred",
        COALESCE(SUM(purchase_price), 0) as "totalInvestment"
      FROM nodes
      WHERE wallet_address = ${walletAddress}
    `

    const result = stats[0] || {}

    return NextResponse.json({
      success: true,
      walletAddress,
      stats: {
        totalNodes: Number(result.totalNodes) || 0,
        activeNodes: Number(result.activeNodes) || 0,
        inactiveNodes: Number(result.inactiveNodes) || 0,
        maintenanceNodes: Number(result.maintenanceNodes) || 0,
        hostingNodes: Number(result.hostingNodes) || 0,
        imageNodes: Number(result.imageNodes) || 0,
        totalEarnings: Number(result.totalEarnings) || 0,
        avgUptime: Number(result.avgUptime) || 0,
        totalDataTransferred: Number(result.totalDataTransferred) || 0,
        totalInvestment: Number(result.totalInvestment) || 0,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching assignment stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats", details: error }, { status: 500 })
  }
}
