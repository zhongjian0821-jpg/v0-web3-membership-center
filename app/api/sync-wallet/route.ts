import { type NextRequest, NextResponse } from "next/server"
import { syncFromAshvaSite, getWalletInfo } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json()

    if (!walletAddress) {
      return NextResponse.json({ error: "缺少钱包地址" }, { status: 400 })
    }

    // 从 Ashva 网站同步数据
    await syncFromAshvaSite(walletAddress)

    // 获取更新后的钱包信息
    const walletInfo = await getWalletInfo(walletAddress)

    return NextResponse.json({
      success: true,
      wallet: walletInfo,
    })
  } catch (error) {
    console.error("同步钱包数据错误:", error)
    return NextResponse.json({ error: "同步失败" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("address")

    if (!walletAddress) {
      return NextResponse.json({ error: "缺少钱包地址" }, { status: 400 })
    }

    const walletInfo = await getWalletInfo(walletAddress)

    if (!walletInfo) {
      return NextResponse.json({ error: "钱包未找到" }, { status: 404 })
    }

    return NextResponse.json({ wallet: walletInfo })
  } catch (error) {
    console.error("获取钱包数据错误:", error)
    return NextResponse.json({ error: "获取失败" }, { status: 500 })
  }
}
