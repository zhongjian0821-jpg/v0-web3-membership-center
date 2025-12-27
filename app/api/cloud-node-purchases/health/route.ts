import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  try {
    console.log("[v0] Health check started")
    console.log("[v0] DATABASE_URL exists:", !!process.env.DATABASE_URL)

    const sql = neon(process.env.DATABASE_URL!)

    const result = await sql`SELECT 1 as test`

    console.log("[v0] Test query result:", result)

    return NextResponse.json({
      status: "healthy",
      message: "API is working correctly",
      database: "connected",
      test_result: result,
      endpoint: "/api/cloud-node-purchases",
      sql_syntax: "tagged-template (correct)",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Health check failed:", error)

    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
