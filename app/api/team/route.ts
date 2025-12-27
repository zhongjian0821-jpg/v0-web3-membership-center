import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")
    const level = searchParams.get("level") // "1" or "2"

    if (!address) {
      return NextResponse.json({ error: "缺少钱包地址" }, { status: 400 })
    }

    if (!level || (level !== "1" && level !== "2")) {
      return NextResponse.json({ error: "无效的层级" }, { status: 400 })
    }

    // Fetch ASHVA price
    let ashvaPrice = 0.00008291
    try {
      const priceResponse = await fetch(`${request.nextUrl.origin}/api/ashva-price`, {
        next: { revalidate: 300 },
      })
      if (priceResponse.ok) {
        const priceData = await priceResponse.json()
        ashvaPrice = priceData.price
      }
    } catch (error) {
      console.log("[v0] Using fallback price for team query")
    }

    if (level === "1") {
      // Level 1: Direct referrals
      const level1Members = await sql`
        SELECT 
          wallet_address,
          ashva_balance,
          member_level,
          created_at
        FROM wallets 
        WHERE LOWER(parent_wallet) = LOWER(${address})
        ORDER BY created_at DESC
      `

      const membersWithEarnings = level1Members.map((member: any) => {
        const balance = Number.parseFloat(member.ashva_balance || "0")
        const usdValue = balance * ashvaPrice
        // 3% commission on their holdings
        const commission = balance * 0.03
        const commissionUSD = commission * ashvaPrice

        return {
          address: member.wallet_address,
          ashvaBalance: balance,
          usdValue: usdValue,
          memberLevel: member.member_level,
          commission: commission,
          commissionUSD: commissionUSD,
          joinedAt: member.created_at,
        }
      })

      const totalCommission = membersWithEarnings.reduce((sum, m) => sum + m.commission, 0)
      const totalCommissionUSD = membersWithEarnings.reduce((sum, m) => sum + m.commissionUSD, 0)

      return NextResponse.json({
        level: 1,
        commissionRate: 3,
        members: membersWithEarnings,
        totalMembers: membersWithEarnings.length,
        totalCommission: totalCommission,
        totalCommissionUSD: totalCommissionUSD,
      })
    } else {
      // Level 2: Second-level referrals
      const level2Members = await sql`
        WITH level1 AS (
          SELECT wallet_address 
          FROM wallets 
          WHERE LOWER(parent_wallet) = LOWER(${address})
        )
        SELECT 
          w.wallet_address,
          w.ashva_balance,
          w.member_level,
          w.parent_wallet,
          w.created_at
        FROM wallets w
        INNER JOIN level1 l1 ON LOWER(w.parent_wallet) = LOWER(l1.wallet_address)
        ORDER BY w.created_at DESC
      `

      const membersWithEarnings = level2Members.map((member: any) => {
        const balance = Number.parseFloat(member.ashva_balance || "0")
        const usdValue = balance * ashvaPrice
        // 2% commission on their holdings
        const commission = balance * 0.02
        const commissionUSD = commission * ashvaPrice

        return {
          address: member.wallet_address,
          ashvaBalance: balance,
          usdValue: usdValue,
          memberLevel: member.member_level,
          referrer: member.parent_wallet,
          commission: commission,
          commissionUSD: commissionUSD,
          joinedAt: member.created_at,
        }
      })

      const totalCommission = membersWithEarnings.reduce((sum, m) => sum + m.commission, 0)
      const totalCommissionUSD = membersWithEarnings.reduce((sum, m) => sum + m.commissionUSD, 0)

      return NextResponse.json({
        level: 2,
        commissionRate: 2,
        members: membersWithEarnings,
        totalMembers: membersWithEarnings.length,
        totalCommission: totalCommission,
        totalCommissionUSD: totalCommissionUSD,
      })
    }
  } catch (error) {
    console.error("[v0] Team API error:", error)
    return NextResponse.json({ error: "获取团队数据失败" }, { status: 500 })
  }
}
