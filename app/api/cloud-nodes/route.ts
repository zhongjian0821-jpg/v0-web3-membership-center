import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")

    console.log("[v0] Fetching cloud nodes for wallet:", address)

    let result
    if (address) {
      // 查询特定用户的云节点
      result = await sql`
        SELECT 
          node_id,
          wallet_address,
          node_type,
          status,
          cpu_cores,
          memory_gb,
          storage_gb,
          cpu_usage_percentage,
          memory_usage_percentage,
          storage_used_percentage,
          uptime_percentage,
          data_transferred_gb,
          total_earnings,
          purchase_price,
          staking_amount,
          staking_required_usd,
          staking_status,
          is_transferable,
          install_command,
          tx_hash,
          created_at,
          updated_at
        FROM nodes
        WHERE wallet_address = ${address.toLowerCase()}
        AND node_type = 'cloud'
        ORDER BY created_at DESC
      `
    } else {
      // 查询所有云节点
      result = await sql`
        SELECT 
          node_id,
          wallet_address,
          node_type,
          status,
          cpu_cores,
          memory_gb,
          storage_gb,
          cpu_usage_percentage,
          memory_usage_percentage,
          storage_used_percentage,
          uptime_percentage,
          data_transferred_gb,
          total_earnings,
          purchase_price,
          staking_amount,
          staking_required_usd,
          staking_status,
          is_transferable,
          install_command,
          tx_hash,
          created_at,
          updated_at
        FROM nodes
        WHERE node_type = 'cloud'
        ORDER BY created_at DESC
      `
    }

    console.log("[v0] Found cloud nodes:", result.length)

    const cloudNodes = result.map((node) => ({
      nodeId: node.node_id,
      walletAddress: node.wallet_address,
      type: node.node_type,
      status: node.status,
      specs: {
        cpu: node.cpu_cores,
        memory: node.memory_gb,
        storage: node.storage_gb,
      },
      usage: {
        cpu: node.cpu_usage_percentage || 0,
        memory: node.memory_usage_percentage || 0,
        storage: node.storage_used_percentage || 0,
      },
      performance: {
        uptime: node.uptime_percentage || 0,
        dataTransferred: node.data_transferred_gb || 0,
        earnings: node.total_earnings || 0,
      },
      financial: {
        purchasePrice: node.purchase_price || 0,
        stakingAmount: node.staking_amount || 0,
        stakingRequired: node.staking_required_usd || 0,
        stakingStatus: node.staking_status || "none",
      },
      isTransferable: node.is_transferable ?? true,
      installCommand: node.install_command || null,
      txHash: node.tx_hash,
      createdAt: node.created_at,
      updatedAt: node.updated_at,
    }))

    return NextResponse.json({
      success: true,
      count: cloudNodes.length,
      nodes: cloudNodes,
    })
  } catch (error) {
    console.error("[v0] Cloud nodes API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "获取云节点数据失败",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
