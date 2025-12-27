import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const GLOBAL_PARTNER_THRESHOLD = 10000 // 全球合伙人：$10,000 USD
const MARKET_PARTNER_THRESHOLD = 3000 // 市场合伙人：$3,000 USD

function calculateMemberLevel(ashvaValueUSD: number): string {
  if (ashvaValueUSD >= GLOBAL_PARTNER_THRESHOLD) {
    return "global_partner"
  } else if (ashvaValueUSD >= MARKET_PARTNER_THRESHOLD) {
    return "market_partner"
  } else {
    return "normal"
  }
}

function calculateUpgradeProgress(currentValueUSD: number, currentLevel: string) {
  let requiredValue = MARKET_PARTNER_THRESHOLD
  let targetLevel = "market_partner"

  // 如果已经是市场合伙人，显示到全球合伙人的进度
  if (currentLevel === "market_partner") {
    requiredValue = GLOBAL_PARTNER_THRESHOLD
    targetLevel = "global_partner"
  }

  const shortfall = Math.max(0, requiredValue - currentValueUSD)
  const progressPercentage = Math.min(Math.round((currentValueUSD / requiredValue) * 100), 100)

  return {
    currentValue: currentValueUSD,
    requiredValue,
    progressPercentage,
    shortfall,
    targetLevel,
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address") || searchParams.get("wallet")

    if (!address) {
      return NextResponse.json(
        { error: "缺少钱包地址" },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        },
      )
    }

    let sql
    try {
      sql = neon(process.env.DATABASE_URL!)
    } catch (dbError) {
      console.error("[v0] Database connection error:", dbError)
      return NextResponse.json(
        { error: "数据库连接失败" },
        {
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        },
      )
    }

    let wallet
    try {
      const wallets = await sql`
        SELECT 
          wallet_address,
          ashva_balance,
          member_level,
          commission_rate_level1,
          commission_rate_level2,
          parent_wallet,
          total_earnings,
          created_at
        FROM wallets 
        WHERE LOWER(wallet_address) = LOWER(${address})
        LIMIT 1
      `

      if (!wallets || wallets.length === 0) {
        return NextResponse.json(
          { error: "未找到钱包数据" },
          {
            status: 404,
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
          },
        )
      }

      wallet = wallets[0]
    } catch (queryError) {
      console.error("[v0] Wallet query error:", queryError)
      return NextResponse.json(
        { error: "查询钱包数据失败" },
        {
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        },
      )
    }

    const ashvaBalance = Number.parseFloat(wallet.ashva_balance || "0")

    let ashvaPrice = 0.00006883 // Updated default fallback to match price API
    let priceSource = "fallback"

    try {
      console.log("[v0] Fetching ASHVA price from API...")
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 增加超时到5秒

      const priceResponse = await fetch(`${request.nextUrl.origin}/api/ashva-price`, {
        signal: controller.signal,
        cache: "no-store", // 不使用缓存，确保获取最新价格
      })

      clearTimeout(timeoutId)

      if (priceResponse.ok) {
        const contentType = priceResponse.headers.get("content-type")
        if (contentType?.includes("application/json")) {
          const priceData = await priceResponse.json()
          ashvaPrice = priceData.price
          priceSource = priceData.source || "api"
          console.log("[v0] ASHVA price fetched successfully:", {
            price: ashvaPrice,
            source: priceSource,
          })
        } else {
          console.log("[v0] Price API returned non-JSON response, using fallback")
        }
      } else {
        console.log(`[v0] Price API error: ${priceResponse.status}, using fallback`)
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("[v0] Price API timeout, using fallback")
      } else {
        console.log("[v0] Price API error, using fallback:", error)
      }
    }

    // Calculate USD value with current price
    const ashvaValueUSD = Math.round(ashvaBalance * ashvaPrice * 100) / 100

    console.log("[v0] Price calculation:", {
      ashvaBalance,
      ashvaPrice,
      priceSource,
      ashvaValueUSD,
    })

    const calculatedMemberLevel = calculateMemberLevel(ashvaValueUSD)

    if (calculatedMemberLevel !== wallet.member_level) {
      try {
        await sql`
          UPDATE wallets 
          SET member_level = ${calculatedMemberLevel}
          WHERE LOWER(wallet_address) = LOWER(${address})
        `
        console.log(`[v0] Updated member_level for ${address}: ${wallet.member_level} -> ${calculatedMemberLevel}`)
      } catch (updateError) {
        console.error("[v0] Failed to update member_level:", updateError)
      }
    }

    let directTeam = 0
    let totalTeam = 0

    try {
      const directTeamResult = await sql`
        SELECT COUNT(*) as count 
        FROM wallets 
        WHERE LOWER(parent_wallet) = LOWER(${address})
      `
      directTeam = Number.parseInt(directTeamResult[0]?.count || "0")
    } catch (error) {
      console.error("[v0] Direct team query error:", error)
    }

    try {
      const hierarchyCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'hierarchy'
        ) as exists
      `

      if (hierarchyCheck[0]?.exists) {
        const maxDepth =
          calculatedMemberLevel === "global_partner" ? 100 : calculatedMemberLevel === "market_partner" ? 10 : 2

        const totalTeamResult = await sql`
          WITH RECURSIVE team_tree AS (
            SELECT wallet_address, parent_wallet, 1 as level
            FROM hierarchy
            WHERE LOWER(parent_wallet) = LOWER(${address})
            
            UNION ALL
            
            SELECT h.wallet_address, h.parent_wallet, t.level + 1
            FROM hierarchy h
            INNER JOIN team_tree t ON LOWER(h.parent_wallet) = LOWER(t.wallet_address)
            WHERE t.level < ${maxDepth}
          )
          SELECT COUNT(DISTINCT wallet_address) as count FROM team_tree
        `
        totalTeam = Number.parseInt(totalTeamResult[0]?.count || "0")
      } else {
        console.log("[v0] Hierarchy table not found, skipping total team count")
      }
    } catch (error) {
      console.error("[v0] Total team query error:", error)
    }

    let purchaseCount = 0
    let nodesPurchased = 0
    try {
      const purchaseStats = await sql`
        SELECT 
          COUNT(*) as purchase_count,
          COALESCE(SUM(purchase_price), 0) as total_spent
        FROM nodes
        WHERE LOWER(wallet_address) = LOWER(${address})
      `
      purchaseCount = Number.parseInt(purchaseStats[0]?.purchase_count || "0")
      nodesPurchased = Number.parseInt(purchaseStats[0]?.purchase_count || "0")
    } catch (error) {
      console.error("[v0] Purchase stats query error:", error)
    }

    const totalEarnings = wallet.total_earnings ? Number.parseFloat(wallet.total_earnings) : 0
    const teamRewards = totalEarnings

    const upgradeProgress = calculateUpgradeProgress(ashvaValueUSD, calculatedMemberLevel)

    const memberData = {
      success: true,
      data: {
        address: wallet.wallet_address,
        balance: ashvaBalance.toFixed(0), // 返回整数的ASHVA余额
        ashvaBalance: ashvaBalance, // 精确的ASHVA余额
        level: directTeam + 1, // 用户层级（1-5级）
        memberType: calculatedMemberLevel, // global_partner/market_partner/normal
        teamRewards: teamRewards.toFixed(2), // 团队奖励（USDT）
        teamRewards_ashva: teamRewards.toFixed(2), // 团队奖励（ASHVA）
        directTeam, // 直推人数
        totalTeam, // 总团队人数
        purchaseCount, // 购买次数
        nodesPurchased, // 已购买节点数
        referrer: wallet.parent_wallet || null, // 推荐人地址
        upgradeProgress: upgradeProgress.progressPercentage, // 升级进度（百分比）
      },
      // 在根级别添加价格信息，方便前端获取
      ashvaPrice: ashvaPrice,
      priceSource: priceSource,
      ashvaValueUSD: ashvaValueUSD,
    }

    return NextResponse.json(memberData, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    console.error("[v0] Member API error:", error)
    return NextResponse.json(
      { error: "获取会员数据失败" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      },
    )
  }
}
