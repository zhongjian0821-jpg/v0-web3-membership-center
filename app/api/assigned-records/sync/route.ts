import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

interface AssignedRecord {
  device_id: string
  wallet_address: string
  record_date: string
  daily_income_cny: number
  daily_income_ashva: number
  daily_flow_gb: number
  daily_fine_cny?: number
  daily_fine_ashva?: number
  net_income_ashva: number
  ashva_price_usd?: number
  cny_to_usd_rate?: number
  price_source?: string
  assigned_at?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const records: AssignedRecord[] = Array.isArray(body) ? body : [body]

    console.log("[v0] Syncing records:", records.length)

    if (records.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No records provided",
        },
        { status: 400 },
      )
    }

    // 验证必需字段
    for (const record of records) {
      if (!record.device_id || !record.wallet_address || !record.record_date) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing required fields: device_id, wallet_address, record_date",
          },
          { status: 400 },
        )
      }
    }

    const insertedRecords = []
    const updatedRecords = []

    for (const record of records) {
      const result = await sql`
        INSERT INTO assigned_records (
          device_id,
          wallet_address,
          record_date,
          daily_income_cny,
          daily_income_ashva,
          daily_flow_gb,
          daily_fine_cny,
          daily_fine_ashva,
          net_income_ashva,
          ashva_price_usd,
          cny_to_usd_rate,
          price_source,
          assigned_at,
          created_at,
          updated_at
        ) VALUES (
          ${record.device_id},
          ${record.wallet_address.toLowerCase()},
          ${record.record_date},
          ${record.daily_income_cny || 0},
          ${record.daily_income_ashva || 0},
          ${record.daily_flow_gb || 0},
          ${record.daily_fine_cny || 0},
          ${record.daily_fine_ashva || 0},
          ${record.net_income_ashva || 0},
          ${record.ashva_price_usd || null},
          ${record.cny_to_usd_rate || null},
          ${record.price_source || null},
          ${record.assigned_at || new Date().toISOString()},
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (device_id, record_date)
        DO UPDATE SET
          wallet_address = EXCLUDED.wallet_address,
          daily_income_cny = EXCLUDED.daily_income_cny,
          daily_income_ashva = EXCLUDED.daily_income_ashva,
          daily_flow_gb = EXCLUDED.daily_flow_gb,
          daily_fine_cny = EXCLUDED.daily_fine_cny,
          daily_fine_ashva = EXCLUDED.daily_fine_ashva,
          net_income_ashva = EXCLUDED.net_income_ashva,
          ashva_price_usd = EXCLUDED.ashva_price_usd,
          cny_to_usd_rate = EXCLUDED.cny_to_usd_rate,
          price_source = EXCLUDED.price_source,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id, device_id, record_date, (xmax = 0) AS inserted
      `

      if (result[0]?.inserted) {
        insertedRecords.push(result[0])
      } else {
        updatedRecords.push(result[0])
      }
    }

    console.log("[v0] Sync complete:", {
      inserted: insertedRecords.length,
      updated: updatedRecords.length,
    })

    return NextResponse.json({
      success: true,
      message: "Records synced successfully",
      summary: {
        total: records.length,
        inserted: insertedRecords.length,
        updated: updatedRecords.length,
      },
      data: {
        inserted: insertedRecords,
        updated: updatedRecords,
      },
    })
  } catch (error) {
    console.error("[v0] Error syncing records:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to sync records",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
