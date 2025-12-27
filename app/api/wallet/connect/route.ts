import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { GLOBAL_PARTNER_THRESHOLD, MARKET_PARTNER_THRESHOLD } from "@/constants/member-levels"

const sql = neon(process.env.DATABASE_URL!)

const DEFAULT_UPLINE_ADDRESS = "0x0000000000000000000000000000000001"

function determineMemberLevel(ashvaValueUSD: number): string {
  if (ashvaValueUSD >= GLOBAL_PARTNER_THRESHOLD) {
    return "global_partner"
  } else if (ashvaValueUSD >= MARKET_PARTNER_THRESHOLD) {
    return "market_partner"
  } else {
    return "normal"
  }
}

export async function POST(request: NextRequest) {
  try {
    const { address, balance, referralWallet } = await request.json()

    if (!address) {
      return NextResponse.json({ error: "钱包地址不能为空" }, { status: 400 })
    }

    if (typeof balance !== "number" || balance < 0) {
      return NextResponse.json({ error: "无效的余额数据" }, { status: 400 })
    }

    console.log("[v0] Saving wallet:", address, "Balance:", balance, "Referral:", referralWallet || "none")

    let ashvaPrice = 0.00008291 // Fallback price from OKX
    try {
      const priceResponse = await fetch(`${request.nextUrl.origin}/api/ashva-price`)
      if (priceResponse.ok) {
        const priceData = await priceResponse.json()
        ashvaPrice = priceData.price
      }
    } catch (error) {
      console.log("[v0] Using fallback ASHVA price")
    }

    const usdValue = balance * ashvaPrice

    const memberLevel = determineMemberLevel(usdValue)

    let commissionRate1 = 3.0
    let commissionRate2 = 2.0

    if (memberLevel === "global_partner" || memberLevel === "market_partner") {
      commissionRate1 = 25.0
      commissionRate2 = 25.0
    }

    console.log("[v0] USD Value:", usdValue, "Member Level:", memberLevel)

    const existingWallets = await sql`
      SELECT * FROM wallets WHERE wallet_address = ${address.toLowerCase()}
    `

    if (Array.isArray(existingWallets) && existingWallets.length > 0) {
      console.log("[v0] Updating existing wallet")

      await sql`
        UPDATE wallets 
        SET ashva_balance = ${balance},
            member_level = ${memberLevel},
            commission_rate_level1 = ${commissionRate1},
            commission_rate_level2 = ${commissionRate2},
            updated_at = CURRENT_TIMESTAMP
        WHERE wallet_address = ${address.toLowerCase()}
      `

      const updated = await sql`
        SELECT * FROM wallets WHERE wallet_address = ${address.toLowerCase()}
      `

      console.log("[v0] Wallet updated successfully")

      return NextResponse.json({
        success: true,
        wallet: updated[0],
        balance: balance,
        usdValue: usdValue,
        message: "欢迎回来",
        isNewUser: false,
      })
    }

    const parentWallet = referralWallet ? referralWallet.toLowerCase() : DEFAULT_UPLINE_ADDRESS.toLowerCase()

    console.log("[v0] Creating new wallet record with parent:", parentWallet)

    if (!/^0x[a-fA-F0-9]{40}$/.test(parentWallet)) {
      return NextResponse.json({ error: "无效的推荐人地址格式" }, { status: 400 })
    }

    if (parentWallet === address.toLowerCase()) {
      return NextResponse.json({ error: "不能邀请自己" }, { status: 400 })
    }

    const newWallet = await sql`
      INSERT INTO wallets (
        wallet_address, ashva_balance, member_level, 
        commission_rate_level1, commission_rate_level2,
        parent_wallet, team_size, total_earnings,
        created_at, updated_at
      )
      VALUES (
        ${address.toLowerCase()}, ${balance}, ${memberLevel},
        ${commissionRate1}, ${commissionRate2},
        ${parentWallet}, 0, 0,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *
    `

    try {
      await sql`
        INSERT INTO hierarchy (wallet_address, parent_wallet, level, created_at)
        VALUES (${address.toLowerCase()}, ${parentWallet}, 1, CURRENT_TIMESTAMP)
      `
    } catch (hierarchyError) {
      console.warn("[v0] Failed to create hierarchy record:", hierarchyError)
      // 不影响主流程
    }

    if (!referralWallet) {
      console.log("[v0] New wallet created with default upline:", DEFAULT_UPLINE_ADDRESS)
    } else {
      console.log("[v0] New wallet created successfully with parent:", parentWallet)
    }

    return NextResponse.json({
      success: true,
      wallet: newWallet[0],
      balance: balance,
      usdValue: usdValue,
      message: "钱包已连接",
      isNewUser: true,
    })
  } catch (error: any) {
    console.error("[v0] API error:", error.message)
    console.error("[v0] Error stack:", error.stack)
    return NextResponse.json(
      {
        error: "保存失败: " + error.message,
      },
      { status: 500 },
    )
  }
}
