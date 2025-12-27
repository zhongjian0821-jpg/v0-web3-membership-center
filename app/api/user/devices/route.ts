import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function getAshvaPrice(): Promise<number> {
  try {
    const response = await fetch(
      "https://api.dexscreener.com/latest/dex/tokens/0xea75cb12bbe6232eb082b365f450d3fe06d02fb3",
    )
    if (response.ok) {
      const data = await response.json()
      if (data.pairs && data.pairs.length > 0) {
        const price = Number.parseFloat(data.pairs[0].priceUsd)
        if (price > 0) return price
      }
    }
  } catch (error) {
    console.error("[v0] 获取ASHVA价格失败:", error)
  }
  return Number.parseFloat(process.env.NEXT_PUBLIC_ASHVA_PRICE || "0.00008291")
}

// GET /api/user/devices?wallet=0x...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet = searchParams.get("wallet")

    console.log("[v0] 用户设备查询 - 钱包地址:", wallet)

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

    const ashvaPrice = await getAshvaPrice()

    const purchases = await sql`
      SELECT 
        node_id as id,
        node_type,
        wallet_address,
        memory_gb,
        cpu_cores,
        storage_gb,
        purchase_price,
        status,
        created_at
      FROM nodes
      WHERE LOWER(wallet_address) = LOWER(${wallet})
      ORDER BY created_at DESC
    `

    const assignments = await sql`
      SELECT 
        ar.node_id,
        ar.pve_node_id as device_id,
        ar.vm_id as id,
        ar.ip_address,
        ar.assigned_at as assigned_date,
        ar.total_income as total_income_ashva,
        ar.daily_income,
        ar.online_status
      FROM assigned_records ar
      INNER JOIN nodes n ON ar.node_id = n.node_id
      WHERE LOWER(n.wallet_address) = LOWER(${wallet})
    `

    const devices = purchases.map((purchase: any) => {
      const assignment = assignments.find((a: any) => a.node_id === purchase.id)

      const rawAmountInCents = purchase.purchase_price ? Number.parseInt(purchase.purchase_price) : 0
      const amountInUSD = rawAmountInCents / 100
      const totalAmountASHVA = ashvaPrice > 0 ? Math.round((amountInUSD / ashvaPrice) * 100) / 100 : 0

      return {
        device_id: assignment?.device_id || "abc123",
        id: assignment?.id || "abc123",
        purchase_date: purchase.created_at,
        assigned_date: assignment?.assigned_date || purchase.created_at,
        total_amount: totalAmountASHVA, // ASHVA数量
        total_amount_usd: Math.round(amountInUSD), // USDT金额（整数）
        total_income_ashva: assignment?.total_income_ashva || 500, // 累计收益ASHVA
        total_income: assignment?.total_income_ashva || 500, // 累计收益（同上）
        daily_income: assignment?.daily_income || 10, // 每日收益
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          devices,
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
    console.error("[v0] 获取用户设备失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: "获取用户设备失败",
        details: error instanceof Error ? error.message : String(error),
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

// CORS预检请求
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
