import { type NextRequest, NextResponse } from "next/server"
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
  // 使用环境变量配置的价格或默认价格
  return Number.parseFloat(process.env.NEXT_PUBLIC_ASHVA_PRICE || "0.00008291")
}

/**
 * 购买记录API - 返回云节点托管和云镜像的购买数据（ASHVA代币金额）
 *
 * 支持两种购买类型：
 * 1. cloud - 云节点托管（Cloud Node Hosting）
 *    - 包含字段：memory_gb, cpu_cores, storage_gb, node_count
 *    - 用途：购买云服务器托管服务
 *
 * 2. image - 云镜像安装（Cloud Image Installation）
 *    - 包含字段：image_name, image_size_gb
 *    - 用途：购买系统镜像安装服务
 *
 * 查询参数：
 * - wallet: 钱包地址筛选
 * - status: 状态筛选 ("completed" 或 "pending")
 * - limit: 返回数量限制 (默认50)
 * - offset: 分页偏移量 (默认0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const walletAddress = searchParams.get("wallet")
    const statusFilter = searchParams.get("status") // "completed" 或 "pending"
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const ashvaPrice = await getAshvaPrice()

    console.log("[v0] 购买记录API查询:", {
      wallet: walletAddress,
      status: statusFilter,
      limit,
      offset,
      ashvaPrice: `$${ashvaPrice.toFixed(8)}`,
      说明: "【2000U】云节点托管=cloud, 【100U】镜像安装=image",
    })

    let allResults

    if (walletAddress && statusFilter === "completed") {
      allResults = await sql`
        SELECT 
          node_id, wallet_address, node_type, purchase_price,
          cpu_cores, memory_gb, storage_gb, status, tx_hash, created_at, image_name
        FROM nodes
        WHERE node_type IN ('cloud', 'image')
          AND wallet_address = ${walletAddress}
          AND status IN ('active', 'running')
        ORDER BY created_at DESC
      `
    } else if (walletAddress && statusFilter === "pending") {
      allResults = await sql`
        SELECT 
          node_id, wallet_address, node_type, purchase_price,
          cpu_cores, memory_gb, storage_gb, status, tx_hash, created_at, image_name
        FROM nodes
        WHERE node_type IN ('cloud', 'image')
          AND wallet_address = ${walletAddress}
          AND status IN ('pending', 'deploying')
        ORDER BY created_at DESC
      `
    } else if (walletAddress) {
      allResults = await sql`
        SELECT 
          node_id, wallet_address, node_type, purchase_price,
          cpu_cores, memory_gb, storage_gb, status, tx_hash, created_at, image_name
        FROM nodes
        WHERE node_type IN ('cloud', 'image')
          AND wallet_address = ${walletAddress}
        ORDER BY created_at DESC
      `
    } else if (statusFilter === "completed") {
      allResults = await sql`
        SELECT 
          node_id, wallet_address, node_type, purchase_price,
          cpu_cores, memory_gb, storage_gb, status, tx_hash, created_at, image_name
        FROM nodes
        WHERE node_type IN ('cloud', 'image')
          AND status IN ('active', 'running')
        ORDER BY created_at DESC
      `
    } else if (statusFilter === "pending") {
      allResults = await sql`
        SELECT 
          node_id, wallet_address, node_type, purchase_price,
          cpu_cores, memory_gb, storage_gb, status, tx_hash, created_at, image_name
        FROM nodes
        WHERE node_type IN ('cloud', 'image')
          AND status IN ('pending', 'deploying')
        ORDER BY created_at DESC
      `
    } else {
      allResults = await sql`
        SELECT 
          node_id, wallet_address, node_type, purchase_price,
          cpu_cores, memory_gb, storage_gb, status, tx_hash, created_at, image_name
        FROM nodes
        WHERE node_type IN ('cloud', 'image')
        ORDER BY created_at DESC
      `
    }

    const cloudCount = allResults.filter((n: any) => n.node_type === "cloud").length
    const imageCount = allResults.filter((n: any) => n.node_type === "image").length

    console.log("[v0] 数据库查询结果:", {
      总记录数: allResults.length,
      "【2000U】云节点托管_cloud": cloudCount,
      "【100U】镜像安装_image": imageCount,
    })

    const total = allResults.length
    const paginatedResults = allResults.slice(offset, offset + limit)

    const purchases = paginatedResults.map((node: any) => {
      const rawAmountInCents = Number(node.purchase_price || 0)
      const amountInUSD = rawAmountInCents / 100 // 33835223 cents -> 338352.23 USD
      const amountInASHVA = ashvaPrice > 0 ? Math.round((amountInUSD / ashvaPrice) * 100) / 100 : 0

      const baseData = {
        id: node.node_id,
        wallet_address: node.wallet_address,
        purchase_type: node.node_type, // "cloud" = 2000U, "image" = 100U
        purchase_date: node.created_at,
        total_amount: amountInASHVA, // ASHVA代币金额
        total_amount_usd: Math.round(amountInUSD * 100) / 100, // USD金额（保留2位小数）
        payment_status: ["active", "running"].includes(node.status) ? "completed" : "pending",
        tx_hash: node.tx_hash || "",
      }

      if (node.node_type === "cloud") {
        return {
          ...baseData,
          node_count: 1,
          memory_gb: node.memory_gb,
          cpu_cores: node.cpu_cores,
          storage_gb: node.storage_gb,
        }
      }

      if (node.node_type === "image") {
        return {
          ...baseData,
          image_name: node.image_name || "Ubuntu 22.04",
          image_size_gb: node.storage_gb || 10,
        }
      }

      return baseData
    })

    console.log("[v0] API返回数据:", {
      返回数量: purchases.length,
      总记录数: total,
      ASHVA价格: `$${ashvaPrice.toFixed(8)}`,
      "【2000U】云节点托管": purchases.filter((p: any) => p.purchase_type === "cloud").length,
      "【100U】镜像安装": purchases.filter((p: any) => p.purchase_type === "image").length,
    })

    const response = NextResponse.json({
      success: true,
      data: {
        purchases,
        ashva_price_usd: ashvaPrice, // 返回当前ASHVA价格供参考
        pagination: {
          total,
          limit,
          offset,
        },
      },
    })

    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Accept")

    return response
  } catch (error) {
    console.error("[v0] 购买记录API错误:", error)

    const response = NextResponse.json(
      {
        success: false,
        error: "Failed to fetch purchases",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )

    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Accept")

    return response
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
    },
  })
}
