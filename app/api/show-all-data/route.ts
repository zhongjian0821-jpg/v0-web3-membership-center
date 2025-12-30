export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const results: any = {};
    
    // 1. 列出所有表及其记录数
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    results.all_tables = [];
    
    for (const table of tables) {
      const tableName = table.table_name;
      
      try {
        const countResult = await sql`SELECT COUNT(*) as count FROM ${sql(tableName)}`;
        const count = parseInt(countResult[0].count);
        
        let sample_data = [];
        if (count > 0 && count <= 10) {
          const sampleResult = await sql`SELECT * FROM ${sql(tableName)} LIMIT 5`;
          sample_data = sampleResult;
        }
        
        results.all_tables.push({
          table_name: tableName,
          record_count: count,
          has_sample: sample_data.length > 0,
          sample_data: sample_data
        });
        
      } catch (e: any) {
        results.all_tables.push({
          table_name: tableName,
          error: e.message
        });
      }
    }
    
    // 2. nodes 表完整数据
    try {
      const allNodes = await sql`SELECT * FROM nodes ORDER BY created_at DESC LIMIT 100`;
      results.nodes_data = {
        count: allNodes.length,
        data: allNodes
      };
      
      const totalNodes = await sql`SELECT COUNT(*) as count FROM nodes`;
      results.nodes_total = parseInt(totalNodes[0].count);
    } catch (e: any) {
      results.nodes_data = { error: e.message };
    }
    
    // 3. cloud_node_purchases 完整数据  
    try {
      const allCloud = await sql`SELECT * FROM cloud_node_purchases ORDER BY created_at DESC LIMIT 100`;
      results.cloud_purchases_data = {
        count: allCloud.length,
        data: allCloud
      };
      
      const totalCloud = await sql`SELECT COUNT(*) as count FROM cloud_node_purchases`;
      results.cloud_purchases_total = parseInt(totalCloud[0].count);
    } catch (e: any) {
      results.cloud_purchases_data = { error: e.message };
    }
    
    // 4. image_node_purchases 数据
    try {
      const allImage = await sql`SELECT * FROM image_node_purchases ORDER BY created_at DESC LIMIT 100`;
      results.image_purchases_data = {
        count: allImage.length,
        data: allImage
      };
      
      const totalImage = await sql`SELECT COUNT(*) as count FROM image_node_purchases`;
      results.image_purchases_total = parseInt(totalImage[0].count);
    } catch (e: any) {
      results.image_purchases_data = { error: e.message };
    }
    
    // 5. wallets 统计
    try {
      const walletCount = await sql`SELECT COUNT(*) as count FROM wallets`;
      results.wallets_total = parseInt(walletCount[0].count);
    } catch (e: any) {
      results.wallets_total = { error: e.message };
    }
    
    return NextResponse.json({ success: true, data: results });
    
  } catch (error: any) {
    console.error('Query error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
