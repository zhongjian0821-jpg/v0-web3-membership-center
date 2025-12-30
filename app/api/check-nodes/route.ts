import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    // 查询所有节点数据
    const nodes = await sql`
      SELECT 
        node_id,
        wallet_address,
        node_type,
        purchase_price,
        status,
        created_at
      FROM nodes
      ORDER BY created_at DESC
    `;
    
    // 统计
    const stats = {
      total: nodes.length,
      cloud: nodes.filter((n: any) => n.node_type === 'cloud').length,
      image: nodes.filter((n: any) => n.node_type === 'image').length
    };
    
    return NextResponse.json({
      success: true,
      data: { nodes, stats }
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
