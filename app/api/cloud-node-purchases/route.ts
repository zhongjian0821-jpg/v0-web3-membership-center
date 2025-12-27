import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(request: Request) {
  try {
    console.log("[v0] Cloud node purchases API called")
    const sql = neon(process.env.DATABASE_URL!)

    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("wallet_address")
    const limit = Number.parseInt(searchParams.get("limit") || "100", 10)

    console.log("[v0] Query params:", { walletAddress, limit })

    let result

    if (walletAddress) {
      result = await sql`
        SELECT 
          node_id as id,
          wallet_address,
          1 as node_count,
          memory_gb,
          cpu_cores,
          storage_gb,
          node_type as purchase_type,
          created_at,
          status
        FROM nodes 
        WHERE LOWER(wallet_address) = LOWER(${walletAddress})
          AND status IN ('pending', 'deploying')
          AND node_type = 'cloud'
        ORDER BY created_at ASC
        LIMIT ${limit}
      `
    } else {
      result = await sql`
        SELECT 
          node_id as id,
          wallet_address,
          1 as node_count,
          memory_gb,
          cpu_cores,
          storage_gb,
          node_type as purchase_type,
          created_at,
          status
        FROM nodes 
        WHERE status IN ('pending', 'deploying')
          AND node_type = 'cloud'
        ORDER BY created_at ASC
        LIMIT ${limit}
      `
    }

    console.log("[v0] Query result count:", result.length)

    const dataWithCountdown = result.map((node: any) => {
      const createdAt = new Date(node.created_at)
      const now = new Date()
      const deploymentDeadline = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000)
      const timeRemaining = deploymentDeadline.getTime() - now.getTime()

      const hours = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)))
      const minutes = Math.max(0, Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)))
      const seconds = Math.max(0, Math.floor((timeRemaining % (1000 * 60)) / 1000))
      const isExpired = timeRemaining <= 0
      const progressPercent = Math.min(
        100,
        Math.max(0, ((24 * 60 * 60 * 1000 - timeRemaining) / (24 * 60 * 60 * 1000)) * 100),
      )

      return {
        id: node.id?.toString() || "",
        wallet_address: node.wallet_address || "",
        node_count: 1,
        created_at: node.created_at,
        status: node.status || "deploying",
        memory_gb: Number(node.memory_gb) || 0,
        cpu_cores: Number(node.cpu_cores) || 0,
        storage_gb: Number(node.storage_gb) || 0,
        purchase_type: node.purchase_type || "cloud",
        deployment_countdown_hours: hours,
        deployment_countdown_minutes: minutes,
        deployment_countdown_seconds: seconds,
        deployment_time_expired: isExpired,
        deployment_progress_percent: Math.round(progressPercent * 10) / 10,
      }
    })

    console.log("[v0] Returning data:", dataWithCountdown.length, "records")

    const response = NextResponse.json({
      success: true,
      data: dataWithCountdown,
    })

    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Accept")

    return response
  } catch (error: any) {
    console.error("[v0] API Error:", error)
    console.error("[v0] Error stack:", error.stack)

    const response = NextResponse.json(
      {
        success: false,
        error: "Failed to fetch cloud node purchases",
        message: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )

    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Accept")

    return response
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
    },
  })
}
