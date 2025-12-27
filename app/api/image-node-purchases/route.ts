import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet = searchParams.get("wallet")
    const status = searchParams.get("status")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50"), 100)
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    console.log("[v0] Image node purchases API called", { wallet, status, limit, offset })

    // Build query with filters
    let query = `
      SELECT 
        node_id as id,
        wallet_address,
        cpu_cores,
        memory_gb,
        storage_gb,
        status,
        purchase_price as total_amount,
        staking_amount,
        staking_required_usd,
        tx_hash,
        created_at as purchase_date,
        node_type
      FROM nodes
      WHERE node_type = 'image'
    `

    const conditions = []
    if (wallet) {
      conditions.push(`AND wallet_address = '${wallet}'`)
    }
    if (status) {
      conditions.push(`AND status = '${status}'`)
    }

    query += conditions.join(" ")
    query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM nodes WHERE node_type = 'image'`
    if (wallet) {
      countQuery += ` AND wallet_address = '${wallet}'`
    }
    if (status) {
      countQuery += ` AND status = '${status}'`
    }

    const [purchases, countResult] = await Promise.all([sql`${sql.unsafe(query)}`, sql`${sql.unsafe(countQuery)}`])

    const total = Number.parseInt(countResult[0]?.total || "0")

    // Format response
    const formattedPurchases = purchases.map((node: any) => ({
      id: node.id,
      wallet_address: node.wallet_address,
      node_count: 1,
      purchase_type: "image",
      purchase_date: node.purchase_date,
      total_amount: Number.parseFloat(node.total_amount || "0"),
      staking_amount: Number.parseFloat(node.staking_amount || "0"),
      staking_required_usd: Number.parseFloat(node.staking_required_usd || "0"),
      payment_status: node.status === "active" || node.status === "running" ? "completed" : "pending",
      tx_hash: node.tx_hash || "",
      cpu_cores: Number.parseInt(node.cpu_cores || "0"),
      memory_gb: Number.parseInt(node.memory_gb || "0"),
      storage_gb: Number.parseInt(node.storage_gb || "0"),
    }))

    const response = NextResponse.json({
      success: true,
      data: {
        purchases: formattedPurchases,
        pagination: {
          total,
          limit,
          offset,
        },
      },
    })

    // Add CORS headers
    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Accept")

    return response
  } catch (error) {
    console.error("[v0] Image node purchases API error:", error)
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch image node purchases",
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
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
    },
  })
}
