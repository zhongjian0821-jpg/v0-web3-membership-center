import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeDetails = searchParams.get("details") === "true"

    // 查询所有会员并按等级分组
    const allMembers = await sql`
      SELECT 
        wallet_address,
        member_level,
        ashva_balance,
        total_earnings,
        parent_wallet,
        direct_referrals,
        team_size,
        created_at,
        updated_at
      FROM wallets
      ORDER BY 
        CASE member_level
          WHEN 'global_partner' THEN 1
          WHEN 'market_partner' THEN 2
          WHEN 'normal' THEN 3
          ELSE 4
        END,
        ashva_balance DESC
    `

    // 按等级分组
    const normalMembers: any[] = []
    const marketPartners: any[] = []
    const globalPartners: any[] = []

    allMembers.forEach((member: any) => {
      const memberData = {
        wallet_address: member.wallet_address,
        member_level: member.member_level,
        ashva_balance: Number(member.ashva_balance),
        total_earnings: Number(member.total_earnings),
        direct_referrals: Number(member.direct_referrals || 0),
        team_size: Number(member.team_size || 0),
        created_at: member.created_at,
      }

      // 只在details=true时包含更多信息
      if (includeDetails) {
        Object.assign(memberData, {
          parent_wallet: member.parent_wallet,
          updated_at: member.updated_at,
        })
      }

      switch (member.member_level) {
        case "global_partner":
          globalPartners.push(memberData)
          break
        case "market_partner":
          marketPartners.push(memberData)
          break
        case "normal":
        default:
          normalMembers.push(memberData)
          break
      }
    })

    // 统计数据
    const statistics = {
      total_members: allMembers.length,
      normal_members_count: normalMembers.length,
      market_partners_count: marketPartners.length,
      global_partners_count: globalPartners.length,
      normal_percentage: ((normalMembers.length / allMembers.length) * 100).toFixed(2) + "%",
      market_partner_percentage: ((marketPartners.length / allMembers.length) * 100).toFixed(2) + "%",
      global_partner_percentage: ((globalPartners.length / allMembers.length) * 100).toFixed(2) + "%",
    }

    return NextResponse.json(
      {
        success: true,
        statistics,
        data: {
          global_partners: globalPartners,
          market_partners: marketPartners,
          normal_members: normalMembers,
        },
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Members by level error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch members by level",
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      },
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
