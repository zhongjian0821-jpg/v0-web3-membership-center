export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const results: any = {};
    
    // 1. 查询所有钱包及其余额
    try {
      const wallets = await sql`
        SELECT 
          wallet_address,
          ashva_balance,
          member_level,
          parent_wallet,
          total_earnings,
          distributable_commission,
          created_at
        FROM wallets 
        WHERE ashva_balance > 0 OR total_earnings > 0
        ORDER BY created_at DESC
      `;
      results.wallets_with_balance = {
        count: wallets.length,
        data: wallets
      };
    } catch (e: any) {
      results.wallets_with_balance = { error: e.message };
    }
    
    // 2. 查询所有交易记录
    try {
      const transactions = await sql`
        SELECT * FROM transactions 
        ORDER BY created_at DESC 
        LIMIT 100
      `;
      results.transactions = {
        count: transactions.length,
        data: transactions
      };
      
      const transTotal = await sql`SELECT COUNT(*) as count FROM transactions`;
      results.transactions_total = parseInt(transTotal[0].count);
    } catch (e: any) {
      results.transactions = { error: e.message };
    }
    
    // 3. 查询佣金记录
    try {
      const commissions = await sql`
        SELECT * FROM commission_records 
        ORDER BY created_at DESC 
        LIMIT 100
      `;
      results.commission_records = {
        count: commissions.length,
        data: commissions
      };
      
      const commTotal = await sql`SELECT COUNT(*) as count FROM commission_records`;
      results.commission_records_total = parseInt(commTotal[0].count);
    } catch (e: any) {
      results.commission_records = { error: e.message };
    }
    
    // 4. 查询收益记录
    try {
      const earnings = await sql`
        SELECT * FROM earnings 
        ORDER BY created_at DESC 
        LIMIT 100
      `;
      results.earnings = {
        count: earnings.length,
        data: earnings
      };
      
      const earnTotal = await sql`SELECT COUNT(*) as count FROM earnings`;
      results.earnings_total = parseInt(earnTotal[0].count);
    } catch (e: any) {
      results.earnings = { error: e.message };
    }
    
    // 5. 查询 assigned_records (分配记录)
    try {
      const assigned = await sql`
        SELECT * FROM assigned_records 
        ORDER BY created_at DESC 
        LIMIT 100
      `;
      results.assigned_records = {
        count: assigned.length,
        data: assigned
      };
      
      const assignedTotal = await sql`SELECT COUNT(*) as count FROM assigned_records`;
      results.assigned_records_total = parseInt(assignedTotal[0].count);
    } catch (e: any) {
      results.assigned_records = { error: e.message };
    }
    
    // 6. 查询所有有数据的表（记录数 > 0）
    try {
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;
      
      const tablesWithData = [];
      
      for (const table of tables) {
        const tableName = table.table_name;
        try {
          const countResult = await sql.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          const count = parseInt(countResult.rows[0].count);
          
          if (count > 0) {
            tablesWithData.push({
              table_name: tableName,
              record_count: count
            });
          }
        } catch (e) {
          // 忽略错误
        }
      }
      
      results.tables_with_data = tablesWithData;
    } catch (e: any) {
      results.tables_with_data = { error: e.message };
    }
    
    // 7. 查询激活码记录
    try {
      const codes = await sql`
        SELECT * FROM activation_codes 
        ORDER BY created_at DESC 
        LIMIT 50
      `;
      results.activation_codes = {
        count: codes.length,
        data: codes
      };
      
      const codesTotal = await sql`SELECT COUNT(*) as count FROM activation_codes`;
      results.activation_codes_total = parseInt(codesTotal[0].count);
    } catch (e: any) {
      results.activation_codes = { error: e.message };
    }
    
    return NextResponse.json({ success: true, data: results });
    
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
