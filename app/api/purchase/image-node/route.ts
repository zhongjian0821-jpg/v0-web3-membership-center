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

async function distributeCommissions(purchaserWallet: string, purchaseAmount: number) {
  console.log("[v0] Starting commission distribution for image node purchase:", purchaseAmount)

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
      // 市场合伙人使用配置的佣金比例
      if (depth <= 10) {
        if (depth === 1) {
          commissionRate = Number(commission_rate_level1 || 3) / 100
        } else if (depth === 2) {
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
      // 普通会员使用配置的佣金比例
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
          'image_node_purchase',
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
    const { walletAddress, specs, stakeAmount, stakeAmountASHVA, stakingTxHash } = await request.json()

    if (!walletAddress || !specs || !stakeAmount || !stakingTxHash) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 })
    }

    if (!specs.cpu || !specs.memory || !specs.storage) {
      return NextResponse.json({ error: "请填写完整的服务器配置" }, { status: 400 })
    }

    const txCheck = await sql`
      SELECT id FROM nodes WHERE tx_hash = ${stakingTxHash}
    `

    if (txCheck.length > 0) {
      return NextResponse.json({ error: "该交易已被使用，请勿重复购买" }, { status: 400 })
    }

    console.log("[v0] Verifying staking transaction on blockchain:", stakingTxHash)

    let transactionReceipt
    try {
      transactionReceipt = await publicClient.getTransactionReceipt({ hash: stakingTxHash as `0x${string}` })
    } catch (error) {
      console.error("[v0] Failed to get transaction receipt:", error)
      return NextResponse.json(
        {
          error: "无法验证交易，请确保交易已确认并重试",
        },
        { status: 400 },
      )
    }

    if (transactionReceipt.status !== "success") {
      console.log("[v0] Transaction failed on blockchain:", stakingTxHash)
      return NextResponse.json(
        {
          error: "交易在区块链上失败，无法完成购买",
        },
        { status: 400 },
      )
    }

    const transaction = await publicClient.getTransaction({ hash: stakingTxHash as `0x${string}` })
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
    const expectedAmount = parseUnits(stakeAmountASHVA.toFixed(18), 18)

    console.log("[v0] Staking transfer verification:", {
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
    const tolerance = expectedAmount / BigInt(100) // 1% tolerance

    if (amountDiff > tolerance) {
      console.log("[v0] Transfer amount mismatch")
      return NextResponse.json(
        {
          error: "交易金额不正确",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Staking transaction verified successfully!")

    const normalizedAddress = walletAddress.toLowerCase()

    const walletResult = await sql`
      SELECT * FROM wallets 
      WHERE LOWER(wallet_address) = LOWER(${normalizedAddress})
    `

    if (walletResult.length === 0) {
      return NextResponse.json({ error: "钱包不存在，请先连接钱包" }, { status: 404 })
    }

    const nodeId = `IN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const installCommand = `curl -sSL https://install.ashvacoin.dev | bash -s -- --id=${nodeId}`
    const unlockDate = new Date()
    unlockDate.setDate(unlockDate.getDate() + 180) // 180天后解锁

    await sql`
      INSERT INTO staking_records (
        wallet_address,
        node_id,
        staked_amount_usd,
        staked_amount,
        stake_tx_hash,
        unlock_date,
        lock_period_days,
        status,
        created_at
      ) VALUES (
        ${normalizedAddress},
        ${nodeId},
        ${stakeAmount},
        ${stakeAmountASHVA},
        ${stakingTxHash},
        ${unlockDate.toISOString()},
        180,
        'active',
        NOW()
      )
    `

    await sql`
      INSERT INTO nodes (
        node_id,
        wallet_address,
        node_type,
        cpu_cores,
        memory_gb,
        storage_gb,
        status,
        install_command,
        purchase_price,
        staking_amount,
        staking_required_usd,
        staking_status,
        tx_hash,
        total_earnings,
        uptime_percentage,
        cpu_usage_percentage,
        memory_usage_percentage,
        storage_used_percentage,
        data_transferred_gb,
        is_transferable,
        created_at,
        updated_at
      ) VALUES (
        ${nodeId},
        ${normalizedAddress},
        'image',
        ${Number.parseInt(specs.cpu)},
        ${Number.parseInt(specs.memory)},
        ${Number.parseInt(specs.storage)},
        'deploying',
        ${installCommand},
        0,
        ${stakeAmountASHVA},
        ${stakeAmount},
        'active',
        ${stakingTxHash},
        0,
        99.9,
        35,
        50,
        25,
        0,
        true,
        NOW(),
        NOW()
      )
    `

    console.log("[v0] Image node created successfully:", nodeId)
    console.log("[v0] Staking recorded, txHash:", stakingTxHash)

    await distributeCommissions(walletAddress, stakeAmountASHVA)

    await notifyOperationsCenter({
      walletAddress: normalizedAddress,
      productType: "image",
      quantity: 1,
      totalAmount: stakeAmountASHVA,
      transactionHash: stakingTxHash,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      nodeId,
      installCommand,
      stakingTxHash,
      message: "镜像节点购买成功！节点正在部署中，预计24小时内完成。",
    })
  } catch (error) {
    console.error("[v0] Image node purchase error:", error)
    return NextResponse.json({ error: "购买失败，请重试" }, { status: 500 })
  }
}
