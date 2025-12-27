import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")

    if (!address) {
      return NextResponse.json({ error: "Missing wallet address" }, { status: 400 })
    }

    const sql = neon(process.env.DATABASE_URL!)

    // Get level 1 team (direct children)
    const level1Members = await sql`
      SELECT 
        w.wallet_address as address,
        w.ashva_balance,
        w.created_at as join_date,
        COALESCE(
          (SELECT COUNT(*) 
           FROM wallets w2 
           WHERE LOWER(w2.parent_wallet) = LOWER(w.wallet_address)),
          0
        ) as team_size,
        COALESCE(
          (SELECT SUM(amount) 
           FROM commission_records 
           WHERE LOWER(from_wallet) = LOWER(w.wallet_address) 
           AND LOWER(wallet_address) = LOWER(${address})),
          0
        ) as total_commission
      FROM wallets w
      WHERE LOWER(w.parent_wallet) = LOWER(${address})
      ORDER BY w.created_at DESC
    `

    // Get level 2 team (grandchildren)
    const level2Members = await sql`
      SELECT 
        w.wallet_address as address,
        w.ashva_balance,
        w.created_at as join_date,
        COALESCE(
          (SELECT COUNT(*) 
           FROM wallets w2 
           WHERE LOWER(w2.parent_wallet) = LOWER(w.wallet_address)),
          0
        ) as team_size,
        COALESCE(
          (SELECT SUM(amount) 
           FROM commission_records 
           WHERE LOWER(from_wallet) = LOWER(w.wallet_address) 
           AND LOWER(wallet_address) = LOWER(${address})),
          0
        ) as total_commission
      FROM wallets w
      WHERE LOWER(w.parent_wallet) IN (
        SELECT LOWER(wallet_address) 
        FROM wallets 
        WHERE LOWER(parent_wallet) = LOWER(${address})
      )
      ORDER BY w.created_at DESC
    `

    // Format the data
    const level1 = level1Members.map((member: any) => ({
      address: member.address,
      level: 1,
      earnings: `${Number.parseFloat(member.total_commission || "0").toFixed(2)} ASHVA`,
      teamSize: Number.parseInt(member.team_size || "0"),
      joinDate: new Date(member.join_date).toISOString().split("T")[0],
    }))

    const level2 = level2Members.map((member: any) => ({
      address: member.address,
      level: 2,
      earnings: `${Number.parseFloat(member.total_commission || "0").toFixed(2)} ASHVA`,
      teamSize: Number.parseInt(member.team_size || "0"),
      joinDate: new Date(member.join_date).toISOString().split("T")[0],
    }))

    return NextResponse.json({
      level1,
      level2,
      totalLevel1: level1.length,
      totalLevel2: level2.length,
    })
  } catch (error) {
    console.error("[v0] Hierarchy API error:", error)
    return NextResponse.json({ error: "Failed to fetch hierarchy data" }, { status: 500 })
  }
}
