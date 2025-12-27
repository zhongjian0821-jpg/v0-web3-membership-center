import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet = searchParams.get("wallet")

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: "钱包地址必填" },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        },
      )
    }

    const walletData = await sql`
      SELECT total_earnings
      FROM wallets
      WHERE LOWER(wallet_address) = LOWER(${wallet})
      LIMIT 1
    `

    const teamRewards = walletData[0]?.total_earnings ? Number.parseFloat(walletData[0].total_earnings) : 0

    let nodeIncome = 0
    try {
      const nodeData = await sql`
        SELECT COALESCE(SUM(total_income), 0) as total_node_income
        FROM assigned_records ar
        INNER JOIN nodes n ON ar.node_id = n.node_id
        WHERE LOWER(n.wallet_address) = LOWER(${wallet})
      `
      nodeIncome = nodeData[0]?.total_node_income ? Number.parseFloat(nodeData[0].total_node_income) : 0
    } catch (error) {
      nodeIncome = 0
    }

    const totalEarnings = teamRewards + nodeIncome

    const response = {
      success: true,
      data: {
        teamRewards: Number(teamRewards.toFixed(2)),
        totalEarnings: Number(totalEarnings.toFixed(2)),
        nodeIncome: Number(nodeIncome.toFixed(2)),
        referralBonus: 0,
        levelBonus: 0,
      },
    }

    return NextResponse.json(response, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "查询失败",
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
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    },
  )
}
