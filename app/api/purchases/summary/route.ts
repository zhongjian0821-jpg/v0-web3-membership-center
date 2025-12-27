import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Fetching purchase summary")

    const totals = await sql`
      SELECT 
        COUNT(*) as total_purchases,
        COUNT(*) as total_nodes,
        COALESCE(SUM(CAST(purchase_price AS DECIMAL)), 0) as total_revenue
      FROM nodes
      WHERE node_type = 'cloud'
    `

    const pendingRevenue = await sql`
      SELECT 
        COALESCE(SUM(CAST(purchase_price AS DECIMAL)), 0) as pending_revenue
      FROM nodes
      WHERE node_type = 'cloud'
        AND status IN ('pending', 'deploying')
    `

    const statusCounts = await sql`
      SELECT 
        COUNT(CASE WHEN status IN ('active', 'running') THEN 1 END) as completed_count,
        COUNT(CASE WHEN status IN ('pending', 'deploying') THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
      FROM nodes
      WHERE node_type = 'cloud'
    `

    const uniqueBuyers = await sql`
      SELECT COUNT(DISTINCT wallet_address) as unique_buyers
      FROM nodes
      WHERE node_type = 'cloud'
        AND wallet_address IS NOT NULL
    `

    const topBuyers = await sql`
      SELECT 
        wallet_address,
        COUNT(*) as purchase_count,
        COUNT(*) as total_nodes,
        COALESCE(SUM(CAST(purchase_price AS DECIMAL)), 0) as total_spent
      FROM nodes
      WHERE node_type = 'cloud'
        AND wallet_address IS NOT NULL
      GROUP BY wallet_address
      ORDER BY total_spent DESC
      LIMIT 10
    `

    const data = {
      total_purchases: Number(totals[0].total_purchases),
      total_nodes: Number(totals[0].total_nodes),
      total_revenue: Number(totals[0].total_revenue),
      pending_revenue: Number(pendingRevenue[0].pending_revenue),
      completed_count: Number(statusCounts[0].completed_count),
      pending_count: Number(statusCounts[0].pending_count),
      failed_count: Number(statusCounts[0].failed_count),
      unique_buyers: Number(uniqueBuyers[0].unique_buyers),
      top_buyers: topBuyers.map((buyer: any) => ({
        wallet_address: buyer.wallet_address,
        purchase_count: Number(buyer.purchase_count),
        total_nodes: Number(buyer.total_nodes),
        total_spent: Number(buyer.total_spent),
      })),
    }

    console.log("[v0] Purchase summary generated:", data)

    const response = NextResponse.json({
      success: true,
      data,
    })

    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Accept")

    return response
  } catch (error) {
    console.error("[v0] Failed to fetch purchase summary:", error)

    const response = NextResponse.json(
      {
        success: false,
        error: "Failed to fetch summary",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )

    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Accept")

    return response
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
    },
  })
}
