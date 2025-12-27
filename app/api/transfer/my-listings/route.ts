import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")

    if (!address) {
      return NextResponse.json({ error: "缺少钱包地址" }, { status: 400 })
    }

    // TODO: Replace with actual database query
    const listings = [
      {
        id: "L-001",
        nodeId: "CN-001",
        price: 2500,
        description: "正常运行的云节点，收益稳定",
        status: "active",
        createdAt: "2024-03-15",
        specs: {
          cpu: 8,
          memory: 16,
          storage: 500,
        },
      },
    ]

    return NextResponse.json({ listings })
  } catch (error) {
    console.error("[v0] My listings error:", error)
    return NextResponse.json({ error: "获取挂单列表失败" }, { status: 500 })
  }
}
