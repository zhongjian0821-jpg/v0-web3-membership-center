export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST() {
  try {
    const results: any = {
      step1_check_commissions: null,
      step2_find_purchases: null,
      step3_restore_nodes: null
    };
    
    // 1. 查询所有 node_purchase 类型的佣金记录
    const commissions = await sql`
      SELECT 
        from_wallet,
        amount,
        commission_level,
        created_at,
        COUNT(*) OVER (PARTITION BY from_wallet) as commission_count
      FROM commission_records
      WHERE transaction_type = 'node_purchase'
      ORDER BY from_wallet, created_at
    `;
    
    results.step1_check_commissions = {
      count: commissions.length,
      data: commissions
    };
    
    // 2. 根据佣金推算购买金额
    // 佣金是购买金额的一定比例
    // level 1: 12% (822593.94 / 0.12 = 6854949.5)
    // level 2: 2% (137098.99 / 0.02 = 6854949.5)
    
    const purchases = [];
    const processedWallets = new Set();
    
    for (const comm of commissions) {
      if (processedWallets.has(comm.from_wallet)) continue;
      
      // 假设 level 1 佣金是 12%
      const purchaseAmount = comm.commission_level === 1 
        ? parseFloat(comm.amount) / 0.12 
        : parseFloat(comm.amount) / 0.02;
      
      purchases.push({
        wallet_address: comm.from_wallet,
        purchase_amount: purchaseAmount,
        created_at: comm.created_at
      });
      
      processedWallets.add(comm.from_wallet);
    }
    
    results.step2_find_purchases = {
      count: purchases.length,
      data: purchases
    };
    
    // 3. 将购买记录插入 nodes 表
    const restoredNodes = [];
    
    for (const purchase of purchases) {
      const nodeId = `node_restored_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        const inserted = await sql`
          INSERT INTO nodes (
            node_id,
            wallet_address,
            node_type,
            status,
            purchase_price,
            staking_amount,
            total_earnings,
            cpu_cores,
            memory_gb,
            storage_gb,
            created_at
          ) VALUES (
            ${nodeId},
            ${purchase.wallet_address},
            'cloud',
            'active',
            ${purchase.purchase_amount},
            0,
            0,
            8,
            16,
            500,
            ${purchase.created_at}
          )
          ON CONFLICT (node_id) DO NOTHING
          RETURNING *
        `;
        
        if (inserted.length > 0) {
          restoredNodes.push(inserted[0]);
        }
      } catch (e: any) {
        results.step3_restore_nodes = {
          error: e.message,
          at_wallet: purchase.wallet_address
        };
        break;
      }
    }
    
    results.step3_restore_nodes = {
      restored_count: restoredNodes.length,
      data: restoredNodes
    };
    
    // 4. 查询当前 nodes 表总数
    const totalNodes = await sql`SELECT COUNT(*) as count FROM nodes`;
    results.total_nodes_after_restore = parseInt(totalNodes[0].count);
    
    return NextResponse.json({ 
      success: true, 
      message: `成功恢复 ${restoredNodes.length} 个订单`,
      data: results 
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // 只查看可以恢复的订单，不实际恢复
    const commissions = await sql`
      SELECT 
        from_wallet,
        amount,
        commission_level,
        created_at
      FROM commission_records
      WHERE transaction_type = 'node_purchase'
      ORDER BY from_wallet, created_at
    `;
    
    const purchases = [];
    const processedWallets = new Set();
    
    for (const comm of commissions) {
      if (processedWallets.has(comm.from_wallet)) continue;
      
      const purchaseAmount = comm.commission_level === 1 
        ? parseFloat(comm.amount) / 0.12 
        : parseFloat(comm.amount) / 0.02;
      
      purchases.push({
        wallet_address: comm.from_wallet,
        estimated_purchase_amount: purchaseAmount,
        commission_date: comm.created_at
      });
      
      processedWallets.add(comm.from_wallet);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `发现 ${purchases.length} 个可恢复的订单`,
      data: {
        can_restore_count: purchases.length,
        purchases: purchases
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
