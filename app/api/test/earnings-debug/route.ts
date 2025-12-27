import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const wallet = searchParams.get("wallet") || "0x308facf463ceac1f0968e57e57d129af8122f5c0"

  const debug: any = {}

  try {
    // 检查wallets表
    const walletData = await sql`
      SELECT wallet_address, total_earnings
      FROM wallets
      WHERE LOWER(wallet_address) = LOWER(${wallet})
      LIMIT 1
    `
    debug.walletData = walletData[0] || null
    debug.teamRewards = walletData[0]?.total_earnings ? Number.parseFloat(walletData[0].total_earnings) : 0

    // 检查assigned_records表
    const nodeData = await sql`
      SELECT COALESCE(SUM(total_income), 0) as total_node_income
      FROM assigned_records ar
      INNER JOIN nodes n ON ar.node_id = n.node_id
      WHERE LOWER(n.wallet_address) = LOWER(${wallet})
    `
    debug.nodeData = nodeData[0] || null
    debug.nodeIncome = nodeData[0]?.total_node_income ? Number.parseFloat(nodeData[0].total_node_income) : 0

    debug.totalEarnings = debug.teamRewards + debug.nodeIncome

    // 测试直接调用summary API
    const summaryUrl = new URL("/api/earnings/summary", request.url)
    summaryUrl.searchParams.set("wallet", wallet)

    const summaryResponse = await fetch(summaryUrl.toString())
    const summaryData = await summaryResponse.json()

    debug.summaryApiResponse = {
      status: summaryResponse.status,
      data: summaryData,
    }

    return NextResponse.json(
      {
        success: true,
        wallet,
        debug,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        wallet,
        debug,
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
