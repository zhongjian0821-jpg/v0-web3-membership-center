import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { createPublicClient, http, parseUnits, type Address } from "viem"
import { mainnet } from "viem/chains"

const sql = neon(process.env.DATABASE_URL!)

const ERC20_ABI = [
  {
    name: "Transfer",
    type: "event",
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
  },
] as const

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
})

const ASHVA_CONTRACT = process.env.NEXT_PUBLIC_ASHVA_CONTRACT_ADDRESS as Address
const RECIPIENT_WALLET = process.env.NEXT_PUBLIC_RECIPIENT_WALLET as Address

// 普通会员：直推3%，间推2%
// 市场合伙人：10%收益权，可管理10层，可自定义分配
// 全球合伙人：5%收益权，可管理100层
async function distributeCommissions(purchaserWallet: string, purchaseAmount: number) {
  console.log("[v0] Starting commission distribution for purchase:", purchaseAmount)

  // 获取购买者的层级链（从直接上级到最顶层）
  const hierarchyChain = await sql`
    WITH RECURSIVE chain AS (
      SELECT wallet_address, parent_wallet, 1 as depth
      FROM hierarchy
      WHERE LOWER(wallet_address) = LOWER(${purchaserWallet})
      
      UNION ALL
      
      SELECT h.wallet_address, h.parent_wallet, c.depth + 1
      FROM hierarchy h
      JOIN chain c ON LOWER(h.wallet_address) = LOWER(c.parent_wallet)
      WHERE c.depth < 100
    )
    SELECT 
      c.parent_wallet, 
      c.depth, 
      w.member_level,
      w.commission_rate_level1,
      w.commission_rate_level2
    FROM chain c
    JOIN wallets w ON LOWER(w.wallet_address) = LOWER(c.parent_wallet)
    WHERE c.parent_wallet IS NOT NULL
    ORDER BY c.depth
  `

  console.log("[v0] Hierarchy chain found:", hierarchyChain.length, "levels")

  for (const ancestor of hierarchyChain) {
    const { parent_wallet, depth, member_level, commission_rate_level1, commission_rate_level2 } = ancestor
    let commissionRate = 0

    // 根据会员等级和层级深度计算佣金
    if (member_level === "global_partner") {
      // 全球合伙人：5%总收益权，可管理100层
      // 分配方式：第1层1%，第2层0.5%，其余层级递减
      if (depth <= 100) {
        if (depth === 1)
          commissionRate = 0.01 // 1%
        else if (depth === 2)
          commissionRate = 0.005 // 0.5%
        else if (depth <= 10)
          commissionRate = 0.003 // 0.3%
        else if (depth <= 50)
          commissionRate = 0.001 // 0.1%
        else commissionRate = 0.0005 // 0.05%
      }
    } else if (member_level === "market_partner") {
      // 市场合伙人：10%总收益权，可管理10层，可自定义分配
      if (depth <= 10) {
        if (depth === 1) {
          // 直推：使用配置的 level1 比例（默认3%，可增加到最多13%）
          commissionRate = Number(commission_rate_level1 || 3) / 100
        } else if (depth === 2) {
          // 间推：使用配置的 level2 比例（默认2%，可增加到最多12%）
          commissionRate = Number(commission_rate_level2 || 2) / 100
        } else if (depth === 3) {
          commissionRate = 0.015 // 1.5%
        } else if (depth === 4) {
          commissionRate = 0.01 // 1%
        } else {
          commissionRate = 0.005 // 0.5%
        }
      }
    } else {
      // 普通会员：直推3%，间推2%（默认值）
      if (depth === 1) {
        commissionRate = Number(commission_rate_level1 || 3) / 100
      } else if (depth === 2) {
        commissionRate = Number(commission_rate_level2 || 2) / 100
      }
    }

    if (commissionRate > 0) {
      const commission = purchaseAmount * commissionRate

      // 更新上级余额和收益
      await sql`
        UPDATE wallets 
        SET ashva_balance = ashva_balance + ${commission},
            total_earnings = total_earnings + ${commission},
            updated_at = NOW()
        WHERE LOWER(wallet_address) = LOWER(${parent_wallet})
      `

      // 记录佣金明细
      await sql`
        INSERT INTO commission_records (
          wallet_address,
          from_wallet,
          amount,
          commission_level,
          transaction_type,
          created_at
        ) VALUES (
          ${parent_wallet.toLowerCase()},
          ${purchaserWallet.toLowerCase()},
          ${commission},
          ${depth},
          'node_purchase',
          NOW()
        )
      `

      console.log(
        `[v0] Commission distributed: Level ${depth}, ${member_level}, ${commissionRate * 100}%, ${commission} ASHVA to ${parent_wallet}`,
      )
    }
  }
}

async function notifyOperationsCenter(purchaseData: {
  walletAddress: string
  productType: string
  quantity: number
  totalAmount: number
  transactionHash: string
  createdAt: string
}) {
  const webhookUrl = process.env.OPERATIONS_CENTER_WEBHOOK_URL

  if (!webhookUrl) {
    console.log("[v0] No operations center webhook URL configured, skipping notification")
    return
  }

  try {
    console.log("[v0] Sending purchase notification to operations center:", webhookUrl)
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(purchaseData),
    })

    if (response.ok) {
      console.log("[v0] Successfully notified operations center")
    } else {
      console.error("[v0] Failed to notify operations center:", response.status, await response.text())
    }
  } catch (error) {
    console.error("[v0] Error sending webhook notification:", error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, amountASHVA, txHash } = await request.json()

    console.log("[v0] Cloud node purchase request:", {
      walletAddress,
      amountASHVA,
      txHash,
    })

    if (!walletAddress || !amountASHVA || !txHash) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 })
    }

    const existingTx = await sql`
      SELECT node_id FROM nodes WHERE tx_hash = ${txHash}
    `

    if (existingTx.length > 0) {
      return NextResponse.json({ error: "此交易已经处理过，请勿重复购买" }, { status: 400 })
    }

    console.log("[v0] Verifying transaction on blockchain:", txHash)

    let transactionReceipt
    try {
      console.log("[v0] Waiting for transaction confirmation...")
      transactionReceipt = await publicClient.waitForTransactionReceipt({
        hash: txHash as `0x${string}`,
        timeout: 60_000, // 60 seconds timeout
        confirmations: 1, // Wait for 1 confirmation
      })
      console.log("[v0] Transaction confirmed!")
    } catch (error) {
      console.error("[v0] Failed to get transaction receipt:", error)
      return NextResponse.json(
        {
          error: "交易确认超时或失败，请稍后重试",
        },
        { status: 400 },
      )
    }

    if (transactionReceipt.status !== "success") {
      console.log("[v0] Transaction failed on blockchain:", txHash)
      return NextResponse.json(
        {
          error: "交易在区块链上失败，无法完成购买",
        },
        { status: 400 },
      )
    }

    const transaction = await publicClient.getTransaction({ hash: txHash as `0x${string}` })
    if (transaction.from.toLowerCase() !== walletAddress.toLowerCase()) {
      console.log("[v0] Transaction sender mismatch:", transaction.from, "vs", walletAddress)
      return NextResponse.json(
        {
          error: "交易发送者与当前钱包不匹配",
        },
        { status: 400 },
      )
    }

    const transferLog = transactionReceipt.logs.find(
      (log) =>
        log.address.toLowerCase() === ASHVA_CONTRACT.toLowerCase() &&
        log.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    )

    if (!transferLog) {
      console.log("[v0] No transfer event found in transaction")
      return NextResponse.json(
        {
          error: "交易中未找到有效的转账记录",
        },
        { status: 400 },
      )
    }

    const toAddress = `0x${transferLog.topics[2]?.slice(26)}` as Address
    const transferAmount = BigInt(transferLog.data)
    const expectedAmount = parseUnits(amountASHVA.toFixed(18), 18)

    console.log("[v0] Transfer verification:", {
      to: toAddress,
      expectedTo: RECIPIENT_WALLET,
      amount: transferAmount.toString(),
      expectedAmount: expectedAmount.toString(),
    })

    if (toAddress.toLowerCase() !== RECIPIENT_WALLET.toLowerCase()) {
      console.log("[v0] Recipient address mismatch")
      return NextResponse.json(
        {
          error: "交易接收地址不正确",
        },
        { status: 400 },
      )
    }

    const amountDiff =
      transferAmount > expectedAmount ? transferAmount - expectedAmount : expectedAmount - transferAmount
    const tolerance = expectedAmount / BigInt(100)

    if (amountDiff > tolerance) {
      console.log("[v0] Transfer amount mismatch")
      return NextResponse.json(
        {
          error: "交易金额不正确",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Transaction verified successfully!")

    const walletResult = await sql`
      SELECT ashva_balance FROM wallets 
      WHERE LOWER(wallet_address) = LOWER(${walletAddress})
    `

    if (walletResult.length === 0) {
      console.log("[v0] Wallet not found in database:", walletAddress)
      return NextResponse.json({ error: "钱包不存在。请先连接钱包并刷新页面。" }, { status: 404 })
    }

    const nodeId = `CN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    await sql`
      INSERT INTO nodes (
        node_id,
        wallet_address,
        node_type,
        status,
        cpu_cores,
        memory_gb,
        storage_gb,
        purchase_price,
        total_earnings,
        uptime_percentage,
        cpu_usage_percentage,
        memory_usage_percentage,
        storage_used_percentage,
        data_transferred_gb,
        is_transferable,
        tx_hash,
        created_at,
        updated_at
      ) VALUES (
        ${nodeId},
        ${walletAddress.toLowerCase()},
        'cloud',
        'pending',
        8,
        16,
        500,
        ${amountASHVA},
        0,
        99.9,
        45,
        60,
        35,
        0,
        true,
        ${txHash},
        NOW(),
        NOW()
      )
    `

    console.log("[v0] Cloud node created successfully:", nodeId)

    await distributeCommissions(walletAddress, amountASHVA)

    await notifyOperationsCenter({
      walletAddress: walletAddress.toLowerCase(),
      productType: "hosting",
      quantity: 1,
      totalAmount: amountASHVA,
      transactionHash: txHash,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      nodeId,
      txHash,
      message: "云节点购买成功！节点正在部署中，预计24小时内完成。",
    })
  } catch (error) {
    console.error("[v0] Cloud node purchase error:", error)
    return NextResponse.json(
      {
        error: "购买失败，请重试。如果问题持续，请联系客服。",
      },
      { status: 500 },
    )
  }
}
