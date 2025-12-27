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

    // Check if user has a parent in wallets table
    const walletResult = await sql`
      SELECT parent_wallet FROM wallets 
      WHERE LOWER(wallet_address) = LOWER(${address})
    `

    const hasParent = walletResult.length > 0 && walletResult[0].parent_wallet !== null

    return NextResponse.json({ hasParent, parentWallet: walletResult[0]?.parent_wallet || null })
  } catch (error) {
    console.error("[API] Error checking referral status:", error)
    return NextResponse.json({ error: "Failed to check referral status" }, { status: 500 })
  }
}
