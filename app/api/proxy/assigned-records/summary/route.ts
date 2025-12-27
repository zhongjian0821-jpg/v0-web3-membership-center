import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const wallet = searchParams.get("wallet")
    const device_id = searchParams.get("device_id")
    const start_date = searchParams.get("start_date")
    const end_date = searchParams.get("end_date")

    const externalApiBase = process.env.NEXT_PUBLIC_EXTERNAL_API_URL || "https://v0-pve-operations-center.vercel.app"

    // 构建查询参数
    const params = new URLSearchParams()
    if (wallet) params.append("wallet_address", wallet)
    if (device_id) params.append("device_id", device_id)
    if (start_date) params.append("start_date", start_date)
    if (end_date) params.append("end_date", end_date)

    const url = `${externalApiBase}/api/assigned-records/summary?${params.toString()}`
    console.log("[v0] Proxying request to:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()
    console.log("[v0] External API response:", data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error proxying summary request:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch data" }, { status: 500 })
  }
}
