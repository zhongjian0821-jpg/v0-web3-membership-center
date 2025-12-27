import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")

    if (!address) {
      return NextResponse.json({ error: "缺少钱包地址" }, { status: 400 })
    }

    const sql = neon(process.env.DATABASE_URL!)

    // Verify user is a global partner
    const userWallet = await sql`
      SELECT member_level 
      FROM wallets 
      WHERE LOWER(wallet_address) = LOWER(${address})
      LIMIT 1
    `

    if (!userWallet || userWallet.length === 0 || userWallet[0].member_level !== "global_partner") {
      return NextResponse.json({ error: "需要全球市场合伙人权限" }, { status: 403 })
    }

    // Get all team members across all levels
    const allTeamMembers = await sql`
      WITH RECURSIVE team_tree AS (
        SELECT 
          h.wallet_address, 
          h.parent_wallet, 
          1 as level,
          w.ashva_balance,
          w.member_level,
          w.created_at
        FROM hierarchy h
        LEFT JOIN wallets w ON LOWER(h.wallet_address) = LOWER(w.wallet_address)
        WHERE LOWER(h.parent_wallet) = LOWER(${address})
        
        UNION ALL
        
        SELECT 
          h.wallet_address, 
          h.parent_wallet, 
          t.level + 1,
          w.ashva_balance,
          w.member_level,
          w.created_at
        FROM hierarchy h
        INNER JOIN team_tree t ON LOWER(h.parent_wallet) = LOWER(t.wallet_address)
        LEFT JOIN wallets w ON LOWER(h.wallet_address) = LOWER(w.wallet_address)
        WHERE t.level < 50
      )
      SELECT * FROM team_tree
      ORDER BY level ASC, created_at DESC
    `

    const totalMembers = allTeamMembers.length
    const globalPartners = allTeamMembers.filter((m) => m.member_level === "global_partner").length
    const regularMembers = totalMembers - globalPartners

    // Calculate total performance
    let totalPerformance = 0
    allTeamMembers.forEach((member) => {
      if (member.ashva_balance) {
        totalPerformance += Number.parseFloat(member.ashva_balance)
      }
    })

    // Calculate monthly growth (mock data for now)
    const monthlyGrowth = "+23.5%"

    return NextResponse.json({
      totalMembers,
      globalPartners,
      regularMembers,
      totalPerformance: `${totalPerformance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ASHVA`,
      monthlyGrowth,
      members: allTeamMembers,
    })
  } catch (error) {
    console.error("[v0] Global team API error:", error)
    return NextResponse.json({ error: "获取团队数据失败" }, { status: 500 })
  }
}
