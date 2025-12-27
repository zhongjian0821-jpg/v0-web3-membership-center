import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

const SYSTEM_DEFAULT_SUFFIX = "00000000001" // 11个字符的尾号

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const walletAddress = body.walletAddress
    const referralAddress = body.referralAddress || body.referrerAddress

    console.log("[v0] Update referral API received:", { walletAddress, referralAddress, body })

    if (!walletAddress || !referralAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate addresses
    if (walletAddress.toLowerCase() === referralAddress.toLowerCase()) {
      return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 })
    }

    // Check if user already has a parent
    const existing = await sql`
      SELECT parent_wallet FROM wallets 
      WHERE LOWER(wallet_address) = LOWER(${walletAddress})
    `

    if (existing.length > 0 && existing[0].parent_wallet !== null) {
      const currentParent = existing[0].parent_wallet.toLowerCase()
      const isSystemDefault = currentParent.endsWith(SYSTEM_DEFAULT_SUFFIX.toLowerCase())

      console.log("[v0] Current parent:", currentParent)
      console.log("[v0] Ends with system suffix:", isSystemDefault)

      if (!isSystemDefault) {
        // 如果不是系统默认地址（尾号不是00000000001），不允许修改
        return NextResponse.json({ error: "Referral already set" }, { status: 400 })
      }

      console.log("[v0] Current referral is system default, allowing change")
    }

    // Verify referral address exists in database
    const referralExists = await sql`
      SELECT wallet_address FROM wallets 
      WHERE LOWER(wallet_address) = LOWER(${referralAddress})
    `

    if (referralExists.length === 0) {
      return NextResponse.json({ error: "Referral address not found" }, { status: 404 })
    }

    // Update parent_wallet in wallets table
    await sql`
      UPDATE wallets 
      SET parent_wallet = ${referralAddress}, updated_at = NOW()
      WHERE LOWER(wallet_address) = LOWER(${walletAddress})
    `

    // Update or insert hierarchy record
    const hierarchyExists = await sql`
      SELECT id FROM hierarchy 
      WHERE LOWER(wallet_address) = LOWER(${walletAddress})
    `

    if (hierarchyExists.length > 0) {
      await sql`
        UPDATE hierarchy 
        SET parent_wallet = ${referralAddress}
        WHERE LOWER(wallet_address) = LOWER(${walletAddress})
      `
    } else {
      await sql`
        INSERT INTO hierarchy (wallet_address, parent_wallet, level, created_at)
        VALUES (${walletAddress}, ${referralAddress}, 2, NOW())
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error updating referral:", error)
    return NextResponse.json({ error: "Failed to update referral" }, { status: 500 })
  }
}
