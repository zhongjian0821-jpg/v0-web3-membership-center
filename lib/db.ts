import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

export const sql = neon(process.env.DATABASE_URL)

// 钱包相关查询
export async function getWalletInfo(walletAddress: string) {
  const result = await sql`
    SELECT * FROM wallets WHERE wallet_address = ${walletAddress.toLowerCase()}
  `
  return result[0] || null
}

export async function createOrUpdateWallet(walletAddress: string, ashvaBalance: number, parentWallet?: string) {
  // 获取现有钱包信息
  const existing = await getWalletInfo(walletAddress)

  // 保持现有等级或使用默认的普通会员
  const memberLevel = existing?.member_level || "normal"
  const commissionRate1 = existing?.commission_rate_level1 || 3.0
  const commissionRate2 = existing?.commission_rate_level2 || 2.0

  const result = await sql`
    INSERT INTO wallets (
      wallet_address, ashva_balance, member_level, parent_wallet,
      commission_rate_level1, commission_rate_level2
    )
    VALUES (
      ${walletAddress.toLowerCase()}, ${ashvaBalance}, ${memberLevel},
      ${parentWallet?.toLowerCase() || null}, ${commissionRate1}, ${commissionRate2}
    )
    ON CONFLICT (wallet_address) 
    DO UPDATE SET 
      ashva_balance = ${ashvaBalance},
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `
  return result[0]
}

// 获取团队层级
export async function getTeamHierarchy(walletAddress: string) {
  const result = await sql`
    SELECT w.*, h.level
    FROM wallets w
    JOIN hierarchy h ON w.wallet_address = h.wallet_address
    WHERE h.parent_wallet = ${walletAddress.toLowerCase()}
    ORDER BY h.level, w.created_at
  `
  return result
}

// 获取节点列表
export async function getNodesByWallet(walletAddress: string) {
  const result = await sql`
    SELECT * FROM nodes 
    WHERE wallet_address = ${walletAddress.toLowerCase()}
    ORDER BY created_at DESC
  `
  return result
}

// 获取市场转让列表
export async function getMarketplaceListings() {
  const result = await sql`
    SELECT nl.*, n.*, w.wallet_address as seller_address
    FROM node_listings nl
    JOIN nodes n ON nl.node_id = n.node_id
    JOIN wallets w ON nl.seller_wallet = w.wallet_address
    WHERE nl.status = 'active'
    ORDER BY nl.created_at DESC
  `
  return result
}

// 创建节点
export async function createNode(
  walletAddress: string,
  nodeType: "cloud" | "image",
  purchasePrice: number,
  specs: {
    cpuCores: number
    memoryGb: number
    storageGb: number
  },
) {
  const nodeId = `NODE-${nodeType.toUpperCase()}-${Date.now()}`
  const isTransferable = nodeType === "cloud"

  const result = await sql`
    INSERT INTO nodes (
      node_id, wallet_address, node_type, purchase_price,
      cpu_cores, memory_gb, storage_gb, is_transferable, status
    )
    VALUES (
      ${nodeId}, ${walletAddress.toLowerCase()}, ${nodeType}, ${purchasePrice},
      ${specs.cpuCores}, ${specs.memoryGb}, ${specs.storageGb}, ${isTransferable}, 'active'
    )
    RETURNING *
  `
  return result[0]
}

// 从 Ashva 网站同步钱包数据
export async function syncFromAshvaSite(walletAddress: string) {
  try {
    // 调用 Ashva 网站 API 获取钱包数据
    const response = await fetch(`https://www.ashvacoin.dev/api/wallet/${walletAddress}`)

    if (!response.ok) {
      throw new Error("Failed to fetch from Ashva site")
    }

    const data = await response.json()

    // 更新本地数据库
    await createOrUpdateWallet(
      walletAddress,
      data.ashvaBalance || 0,
      data.parentWallet || "0xea75cb12bbe6232eb082b365f450d3fe06d02fb3",
    )

    return data
  } catch (error) {
    console.error("Error syncing from Ashva site:", error)
    return null
  }
}
