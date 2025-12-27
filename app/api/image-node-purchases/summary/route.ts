import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("[v0] Image node purchases summary API called")

    // Query summary statistics
    const summaryResult = await sql`
      SELECT 
        COUNT(*) as total_purchases,
        COUNT(DISTINCT wallet_address) as unique_buyers,
        SUM(CAST(purchase_price AS NUMERIC)) as total_revenue,
        SUM(CASE WHEN status IN ('pending', 'deploying') THEN CAST(purchase_price AS NUMERIC) ELSE 0 END) as pending_revenue,
        SUM(CAST(staking_amount AS NUMERIC)) as total_staking,
        COUNT(CASE WHEN status IN ('active', 'running') THEN 1 END) as completed_count,
        COUNT(CASE WHEN status IN ('pending', 'deploying') THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
      FROM nodes
      WHERE node_type = 'image'
    `

    // Query top buyers
    const topBuyersResult = await sql`
      SELECT 
        wallet_address,
        COUNT(*) as purchase_count,
        COUNT(*) as total_nodes,
        SUM(CAST(purchase_price AS NUMERIC)) as total_spent
      FROM nodes
      WHERE node_type = 'image'
      GROUP BY wallet_address
      ORDER BY total_spent DESC
      LIMIT 10
    `

    const summary = summaryResult[0] || {}

    const response = NextResponse.json({
      success: true,
      data: {
        total_purchases: Number.parseInt(summary.total_purchases || "0"),
        total_nodes: Number.parseInt(summary.total_purchases || "0"),
        total_revenue: Number.parseFloat(summary.total_revenue || "0"),
        pending_revenue: Number.parseFloat(summary.pending_revenue || "0"),
        total_staking: Number.parseFloat(summary.total_staking || "0"),
        completed_count: Number.parseInt(summary.completed_count || "0"),
        pending_count: Number.parseInt(summary.pending_count || "0"),
        failed_count: Number.parseInt(summary.failed_count || "0"),
        unique_buyers: Number.parseInt(summary.unique_buyers || "0"),
        top_buyers: topBuyersResult.map((buyer: any) => ({
          wallet_address: buyer.wallet_address,
          purchase_count: Number.parseInt(buyer.purchase_count || "0"),
          total_nodes: Number.parseInt(buyer.total_nodes || "0"),
          total_spent: Number.parseFloat(buyer.total_spent || "0"),
        })),
      },
    })

    // Add CORS headers
    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Accept")

    return response
  } catch (error) {
    console.error("[v0] Image node purchases summary API error:", error)
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch summary",
      },
      { status: 500 },
    )

    errorResponse.headers.set("Access-Control-Allow-Origin", "*")
    return errorResponse
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
