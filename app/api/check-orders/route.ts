export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const results: any = {};
    
    // 查询 orders 表
    try {
      const ordersCount = await sql`SELECT COUNT(*) as count FROM orders`;
      results.orders_total = parseInt(ordersCount[0].count);
      
      const ordersData = await sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT 100`;
      results.orders_data = {
        count: ordersData.length,
        data: ordersData
      };
    } catch (e: any) {
      results.orders_data = { error: e.message };
    }
    
    // 查询 cloud_node_purchases 表
    try {
      const cloudCount = await sql`SELECT COUNT(*) as count FROM cloud_node_purchases`;
      results.cloud_purchases_total = parseInt(cloudCount[0].count);
      
      const cloudData = await sql`SELECT * FROM cloud_node_purchases ORDER BY created_at DESC LIMIT 100`;
      results.cloud_purchases_data = {
        count: cloudData.length,
        data: cloudData
      };
    } catch (e: any) {
      results.cloud_purchases_data = { error: e.message };
    }
    
    // 查询 machines 表
    try {
      const machinesCount = await sql`SELECT COUNT(*) as count FROM machines`;
      results.machines_total = parseInt(machinesCount[0].count);
      
      const machinesData = await sql`SELECT * FROM machines ORDER BY created_at DESC LIMIT 20`;
      results.machines_data = {
        count: machinesData.length,
        data: machinesData
      };
    } catch (e: any) {
      results.machines_data = { error: e.message };
    }
    
    return NextResponse.json({ success: true, data: results });
    
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
