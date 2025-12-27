import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 })
    }

    try {
      await sql`
        ALTER TABLE wallets 
        ADD COLUMN IF NOT EXISTS self_commission_rate NUMERIC(5, 2) DEFAULT 0
      `
    } catch (e) {
      console.log("[v0] self_commission_rate column check completed")
    }

    const walletResult = await sql`
      SELECT commission_rate_level1, commission_rate_level2, member_level, COALESCE(self_commission_rate, 0) as self_commission_rate
      FROM wallets
      WHERE LOWER(wallet_address) = LOWER(${address})
    `

    if (walletResult.length === 0) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
    }

    let allocations: any[] = []
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS commission_distribution (
          id SERIAL PRIMARY KEY,
          from_wallet VARCHAR(255) NOT NULL,
          to_wallet VARCHAR(255) NOT NULL,
          rate DECIMAL(5, 2) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(from_wallet, to_wallet)
        )
      `

      allocations = await sql`
        SELECT to_wallet, rate, created_at
        FROM commission_distribution
        WHERE LOWER(from_wallet) = LOWER(${address})
        ORDER BY created_at DESC
      `
    } catch (e: any) {
      console.error("[v0] Error with commission_distribution:", e.message)
      allocations = []
    }

    return NextResponse.json({
      level1: Number(walletResult[0].commission_rate_level1),
      level2: Number(walletResult[0].commission_rate_level2),
      selfRate: Number(walletResult[0].self_commission_rate),
      member_level: walletResult[0].member_level,
      allocations: allocations,
    })
  } catch (error) {
    console.error("[v0] Error fetching commission config:", error)
    return NextResponse.json({ error: "Failed to fetch commission configuration" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("[v0] Received POST body:", body)

    if (body.allocations) {
      const { from_wallet, allocations } = body

      if (!from_wallet) {
        return NextResponse.json({ error: "from_wallet is required" }, { status: 400 })
      }

      await sql`
        CREATE TABLE IF NOT EXISTS commission_distribution (
          id SERIAL PRIMARY KEY,
          from_wallet VARCHAR(255) NOT NULL,
          to_wallet VARCHAR(255) NOT NULL,
          rate DECIMAL(5, 2) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(from_wallet, to_wallet)
        )
      `

      await sql`
        DELETE FROM commission_distribution
        WHERE LOWER(from_wallet) = LOWER(${from_wallet})
      `

      for (const allocation of allocations) {
        if (allocation.rate > 0) {
          await sql`
            INSERT INTO commission_distribution (from_wallet, to_wallet, rate)
            VALUES (${from_wallet.toLowerCase()}, ${allocation.to_wallet.toLowerCase()}, ${allocation.rate})
          `
        }
      }

      return NextResponse.json({ success: true })
    } else {
      const { address, selfRate, level1, level2 } = body

      if (!address) {
        console.error("[v0] Missing address in request")
        return NextResponse.json({ error: "Address is required" }, { status: 400 })
      }

      if (level1 === undefined || level2 === undefined) {
        console.error("[v0] Missing level1 or level2 in request")
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
      }

      if (level1 < 0 || level1 > 20 || level2 < 0 || level2 > 20) {
        return NextResponse.json({ error: "Commission rates must be between 0% and 20%" }, { status: 400 })
      }

      const walletCheck = await sql`
        SELECT wallet_address FROM wallets WHERE LOWER(wallet_address) = LOWER(${address})
      `

      if (walletCheck.length === 0) {
        console.error("[v0] Wallet not found:", address)
        return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
      }

      console.log("[v0] Updating commission config for:", address, {
        selfRate: selfRate || 0,
        level1,
        level2,
      })

      try {
        await sql`
          ALTER TABLE wallets 
          ADD COLUMN IF NOT EXISTS self_commission_rate NUMERIC(5, 2) DEFAULT 0
        `
        console.log("[v0] self_commission_rate column ensured")
      } catch (e) {
        console.log("[v0] self_commission_rate column may already exist")
      }

      await sql`
        UPDATE wallets
        SET 
          commission_rate_level1 = ${level1},
          commission_rate_level2 = ${level2},
          self_commission_rate = ${selfRate || 0},
          updated_at = NOW()
        WHERE LOWER(wallet_address) = LOWER(${address})
      `

      console.log("[v0] Commission config saved successfully")
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error("[v0] Error saving commission config:", error)
    return NextResponse.json(
      { error: `Failed to save: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}
