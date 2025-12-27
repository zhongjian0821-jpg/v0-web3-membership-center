import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    const listings = await sql`
      SELECT 
        nl.listing_id as id,
        nl.node_id as "nodeId",
        nl.seller_wallet as seller,
        nl.asking_price as price,
        nl.description,
        nl.created_at::text as "createdAt",
        n.cpu_cores,
        n.memory_gb,
        n.storage_gb,
        n.uptime_percentage,
        n.total_earnings
      FROM node_listings nl
      INNER JOIN nodes n ON nl.node_id = n.node_id
      WHERE nl.status = 'active'
      ORDER BY nl.created_at DESC
    `

    // Format the response to match the expected structure
    const formattedListings = listings.map((listing) => ({
      id: listing.id,
      nodeId: listing.nodeId,
      seller: listing.seller,
      price: Number(listing.price),
      description: listing.description || "",
      createdAt: new Date(listing.createdAt).toISOString().split("T")[0],
      specs: {
        cpu: listing.cpu_cores,
        memory: listing.memory_gb,
        storage: listing.storage_gb,
      },
      performance: {
        uptime: Number(listing.uptime_percentage),
        earnings: `${Number(listing.total_earnings).toFixed(2)} ASHVA`,
      },
    }))

    console.log(`[v0] Found ${formattedListings.length} active listings`)

    return NextResponse.json({ listings: formattedListings })
  } catch (error) {
    console.error("[v0] Marketplace error:", error)
    return NextResponse.json({ error: "获取市场列表失败" }, { status: 500 })
  }
}
