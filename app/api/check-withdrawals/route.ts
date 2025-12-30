export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const results: any = {};
    
    // 1. 查询 withdrawal_records 表的所有数据
    const withdrawals = await sql`
      SELECT * FROM withdrawal_records 
      ORDER BY created_at DESC
      LIMIT 100
    `;
    
    results.withdrawal_records = {
      count: withdrawals.length,
      data: withdrawals
    };
    
    // 2. 统计
    const stats = await sql`
      SELECT 
        COUNT(*) as total_count,
        SUM(amount) as total_amount,
        SUM(actual_amount) as total_actual_amount,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count
      FROM withdrawal_records
    `;
    
    results.stats = stats[0];
    
    // 3. 查询表结构
    const schema = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'withdrawal_records'
      ORDER BY ordinal_position
    `;
    
    results.table_schema = schema;
    
    return NextResponse.json({ success: true, data: results });
    
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
