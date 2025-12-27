import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// 最低提现金额 10 USD
const MIN_WITHDRAW_USD = 10

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, amount, ashvaPrice, burnRate } = await request.json()

    console.log("[v0] Withdraw request:", { walletAddress, amount, ashvaPrice, burnRate })

    if (!walletAddress || !amount || !ashvaPrice) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 })
    }

    // 计算USD价值
    const amountUSD = amount * ashvaPrice

    // 检查最低提现金额
    if (amountUSD < MIN_WITHDRAW_USD) {
      return NextResponse.json(
        {
          error: `提现金额不足，最低提现金额为 $${MIN_WITHDRAW_USD} USD`,
        },
        { status: 400 },
      )
    }

    const burnAmount = amount * (burnRate || 0)
    const actualAmount = amount - burnAmount

    console.log("[v0] Burn calculation:", {
      originalAmount: amount,
      burnRate: `${(burnRate * 100).toFixed(1)}%`,
      burnAmount,
      actualAmount,
    })

    // 检查用户余额
    const walletResult = await sql`
      SELECT total_earnings FROM wallets 
      WHERE LOWER(wallet_address) = LOWER(${walletAddress})
    `

    if (walletResult.length === 0) {
      return NextResponse.json({ error: "钱包不存在" }, { status: 404 })
    }

    const currentEarnings = Number.parseFloat(walletResult[0].total_earnings) || 0

    if (currentEarnings < amount) {
      return NextResponse.json(
        {
          error: "可提现余额不足",
          available: currentEarnings,
          requested: amount,
        },
        { status: 400 },
      )
    }

    const withdrawResult = await sql`
      INSERT INTO withdrawal_records (
        wallet_address,
        amount,
        amount_usd,
        burn_rate,
        burn_amount,
        actual_amount,
        status,
        created_at
      ) VALUES (
        ${walletAddress.toLowerCase()},
        ${amount},
        ${amountUSD},
        ${burnRate || 0},
        ${burnAmount},
        ${actualAmount},
        'pending',
        NOW()
      )
      RETURNING id
    `

    // 扣除用户余额
    await sql`
      UPDATE wallets 
      SET total_earnings = total_earnings - ${amount},
          updated_at = NOW()
      WHERE LOWER(wallet_address) = LOWER(${walletAddress})
    `

    console.log("[v0] Withdrawal created:", withdrawResult[0].id)

    return NextResponse.json({
      success: true,
      withdrawalId: withdrawResult[0].id,
      amount,
      amountUSD,
      burnRate: burnRate || 0,
      burnAmount,
      actualAmount,
      message: `提现申请已提交，实际到账 ${actualAmount.toFixed(2)} ASHVA（燃烧 ${burnAmount.toFixed(2)} ASHVA），预计24-48小时内处理完成。`,
    })
  } catch (error) {
    console.error("[v0] Withdraw error:", error)
    return NextResponse.json({ error: "提现失败，请重试" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("address")

    if (!walletAddress) {
      return NextResponse.json({ error: "缺少钱包地址" }, { status: 400 })
    }

    // 获取提现记录
    const records = await sql`
      SELECT id, amount, amount_usd, status, tx_hash, created_at, processed_at
      FROM withdrawal_records
      WHERE LOWER(wallet_address) = LOWER(${walletAddress})
      ORDER BY created_at DESC
      LIMIT 50
    `

    // 获取可提现余额
    const walletResult = await sql`
      SELECT total_earnings FROM wallets 
      WHERE LOWER(wallet_address) = LOWER(${walletAddress})
    `

    const availableBalance = walletResult.length > 0 ? Number.parseFloat(walletResult[0].total_earnings) || 0 : 0

    return NextResponse.json({
      records,
      availableBalance,
      minWithdrawUSD: MIN_WITHDRAW_USD,
    })
  } catch (error) {
    console.error("[v0] Get withdrawals error:", error)
    return NextResponse.json({ error: "获取提现记录失败" }, { status: 500 })
  }
}
