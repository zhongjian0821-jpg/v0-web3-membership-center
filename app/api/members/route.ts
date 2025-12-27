import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""

    const sql = neon(process.env.DATABASE_URL!)

    let members
    if (search) {
      members = await sql`
        SELECT 
          w.id,
          w.wallet_address,
          w.member_level,
          w.created_at,
          w.parent_wallet,
          COUNT(DISTINCT n.id) as devices_count
        FROM wallets w
        LEFT JOIN nodes n ON LOWER(n.wallet_address) = LOWER(w.wallet_address) AND n.status = 'active'
        WHERE LOWER(w.wallet_address) LIKE LOWER(${"%" + search + "%"})
        GROUP BY w.id, w.wallet_address, w.member_level, w.created_at, w.parent_wallet
        ORDER BY w.created_at DESC
      `
    } else {
      members = await sql`
        SELECT 
          w.id,
          w.wallet_address,
          w.member_level,
          w.created_at,
          w.parent_wallet,
          COUNT(DISTINCT n.id) as devices_count
        FROM wallets w
        LEFT JOIN nodes n ON LOWER(n.wallet_address) = LOWER(w.wallet_address) AND n.status = 'active'
        GROUP BY w.id, w.wallet_address, w.member_level, w.created_at, w.parent_wallet
        ORDER BY w.created_at DESC
      `
    }

    const transformedMembers = members.map((member: any) => {
      let tier = "bronze"
      const deviceCount = Number.parseInt(member.devices_count) || 0
      const memberLevel = member.member_level || "normal"

      // 根据member_level和设备数量判断tier
      if (memberLevel === "global_partner") {
        tier = "platinum"
      } else if (memberLevel === "market_partner") {
        tier = "gold"
      } else if (deviceCount >= 5) {
        tier = "silver"
      } else {
        tier = "bronze"
      }

      const shortAddress =
        member.wallet_address.substring(0, 6) +
        "..." +
        member.wallet_address.substring(member.wallet_address.length - 4)

      return {
        walletAddress: member.wallet_address,
        name: shortAddress,
        tier, // bronze/silver/gold/platinum
        joinedDate: member.created_at,
      }
    })

    return NextResponse.json(
      {
        success: true,
        members: transformedMembers,
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
    console.error("[v0] Members API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "获取会员列表失败",
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
