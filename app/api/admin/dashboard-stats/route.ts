import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // 获取用户统计
    const userStats = await sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN member_level = 'market_partner' THEN 1 END) as market_partners,
        COUNT(CASE WHEN member_level = 'global_partner' THEN 1 END) as global_partners,
        COUNT(CASE WHEN member_level = 'normal' THEN 1 END) as normal_members,
        SUM(CAST(ashva_balance AS DECIMAL)) as total_ashva_held
      FROM wallets
    `

    // 获取订单统计
    const orderStats = await sql`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN node_type = 'cloud' THEN 1 END) as cloud_orders,
        COUNT(CASE WHEN node_type = 'image' THEN 1 END) as image_orders,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_nodes,
        COUNT(CASE WHEN status = 'deploying' THEN 1 END) as deploying_nodes,
        SUM(CAST(purchase_price AS DECIMAL)) as total_revenue_cents
      FROM nodes
    `

    // 获取今日数据
    const todayStats = await sql`
      SELECT 
        COUNT(DISTINCT wallet_address) as new_users_today,
        COUNT(*) as orders_today,
        SUM(CAST(purchase_price AS DECIMAL)) as revenue_today_cents
      FROM nodes
      WHERE created_at >= CURRENT_DATE
    `

    // 获取提现统计
    const withdrawalStats = await sql`
      SELECT 
        COUNT(*) as total_withdrawals,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_withdrawals,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_withdrawals,
        SUM(CAST(amount AS DECIMAL)) as total_withdrawn_amount
      FROM withdrawal_records
    `

    // 获取佣金统计
    const commissionStats = await sql`
      SELECT 
        SUM(CAST(amount AS DECIMAL)) as total_commissions,
        COUNT(DISTINCT wallet_address) as earners_count
      FROM commission_records
    `

    // 获取设备分配统计
    const deviceStats = await sql`
      SELECT 
        COUNT(*) as total_assigned,
        COUNT(CASE WHEN online_status = true THEN 1 END) as online_devices
      FROM assigned_records
    `

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: Number(userStats[0].total_users),
          market_partners: Number(userStats[0].market_partners),
          global_partners: Number(userStats[0].global_partners),
          normal_members: Number(userStats[0].normal_members),
          total_ashva_held: Number(userStats[0].total_ashva_held),
          new_today: Number(todayStats[0].new_users_today || 0),
        },
        orders: {
          total: Number(orderStats[0].total_orders),
          cloud: Number(orderStats[0].cloud_orders),
          image: Number(orderStats[0].image_orders),
          active_nodes: Number(orderStats[0].active_nodes),
          deploying_nodes: Number(orderStats[0].deploying_nodes),
          total_revenue_ashva: Math.round(Number(orderStats[0].total_revenue_cents) / 100),
          orders_today: Number(todayStats[0].orders_today || 0),
          revenue_today_ashva: Math.round(Number(todayStats[0].revenue_today_cents || 0) / 100),
        },
        withdrawals: {
          total: Number(withdrawalStats[0].total_withdrawals || 0),
          pending: Number(withdrawalStats[0].pending_withdrawals || 0),
          completed: Number(withdrawalStats[0].completed_withdrawals || 0),
          total_amount: Number(withdrawalStats[0].total_withdrawn_amount || 0),
        },
        commissions: {
          total_amount: Number(commissionStats[0].total_commissions || 0),
          earners_count: Number(commissionStats[0].earners_count || 0),
        },
        devices: {
          total_assigned: Number(deviceStats[0].total_assigned || 0),
          online: Number(deviceStats[0].online_devices || 0),
        },
      },
    })
  } catch (error) {
    console.error("[v0] Dashboard stats error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
