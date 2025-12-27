import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { withdrawalId, action, txHash, rejectReason } = await request.json()

    if (!withdrawalId || !action) {
      return NextResponse.json({ error: "Missing withdrawal ID or action" }, { status: 400 })
    }

    if (action === "approve" && !txHash) {
      return NextResponse.json({ error: "Transaction hash required for approval" }, { status: 400 })
    }

    // 获取提现记录
    const withdrawal = await sql`
      SELECT * FROM withdrawal_records WHERE id = ${withdrawalId}
    `

    if (withdrawal.length === 0) {
      return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 })
    }

    if (withdrawal[0].status !== "pending") {
      return NextResponse.json({ error: `Withdrawal is already ${withdrawal[0].status}` }, { status: 400 })
    }

    if (action === "approve") {
      // 审核通过
      await sql`
        UPDATE withdrawal_records
        SET 
          status = 'completed',
          tx_hash = ${txHash},
          processed_at = NOW()
        WHERE id = ${withdrawalId}
      `

      return NextResponse.json({
        success: true,
        message: "Withdrawal approved successfully",
        tx_hash: txHash,
      })
    } else if (action === "reject") {
      // 拒绝提现，退还用户余额
      const amount = Number(withdrawal[0].amount)
      const walletAddress = withdrawal[0].wallet_address

      await sql`
        UPDATE withdrawal_records
        SET 
          status = 'failed',
          reject_reason = ${rejectReason || "Rejected by admin"},
          processed_at = NOW()
        WHERE id = ${withdrawalId}
      `

      // 退还余额
      await sql`
        UPDATE wallets
        SET 
          total_earnings = total_earnings + ${amount},
          updated_at = NOW()
        WHERE LOWER(wallet_address) = LOWER(${walletAddress})
      `

      return NextResponse.json({
        success: true,
        message: "Withdrawal rejected and balance refunded",
        refunded_amount: amount,
      })
    } else {
      return NextResponse.json({ error: "Invalid action. Use 'approve' or 'reject'" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Withdrawal approval error:", error)
    return NextResponse.json({ success: false, error: "Failed to process withdrawal" }, { status: 500 })
  }
}
