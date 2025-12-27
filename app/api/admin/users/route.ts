import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const memberLevel = searchParams.get("member_level")
    const search = searchParams.get("search")

    const offset = (page - 1) * limit

    // 构建查询条件
    let whereClause = "WHERE 1=1"
    const params: any[] = []

    if (memberLevel) {
      params.push(memberLevel)
      whereClause += ` AND member_level = $${params.length}`
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`)
      whereClause += ` AND LOWER(wallet_address) LIKE $${params.length}`
    }

    // 获取用户列表
    const users = await sql.unsafe(
      `
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
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `,
      [...params, limit, offset],
    )

    // 获取总数
    const countResult = await sql.unsafe(
      `
      SELECT COUNT(*) as total FROM wallets ${whereClause}
    `,
      params,
    )

    const total = Number(countResult[0].total)
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: {
        users: users.map((user: any) => ({
          wallet_address: user.wallet_address,
          member_level: user.member_level,
          ashva_balance: Number(user.ashva_balance),
          total_earnings: Number(user.total_earnings),
          parent_wallet: user.parent_wallet,
          direct_referrals: Number(user.direct_referrals || 0),
          team_size: Number(user.team_size || 0),
          created_at: user.created_at,
          updated_at: user.updated_at,
        })),
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
        },
      },
    })
  } catch (error) {
    console.error("[v0] Admin users list error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 })
  }
}
