import { NextResponse } from "next/server"

// 价格预言机API - 获取ASHVA的昨日最高价
// 这个API可供前端直接调用，用于显示当前价格
export async function GET() {
  try {
    // 从环境变量获取配置的价格
    const configuredPrice = process.env.NEXT_PUBLIC_ASHVA_PRICE

    if (configuredPrice) {
      const price = Number.parseFloat(configuredPrice)
      return NextResponse.json({
        success: true,
        price: price, // ASHVA价格（CNY）
        currency: "CNY",
        timestamp: new Date().toISOString(),
        source: "environment_variable",
        note: "使用环境变量配置的价格 (NEXT_PUBLIC_ASHVA_PRICE)",
      })
    }

    const yesterdayHighPrice = 0.06

    return NextResponse.json({
      success: true,
      price: yesterdayHighPrice, // 1 ASHVA = 0.06 CNY
      currency: "CNY",
      timestamp: new Date().toISOString(),
      source: "default_price",
      note: "使用默认价格。请在环境变量中设置 NEXT_PUBLIC_ASHVA_PRICE 来配置真实价格",
    })
  } catch (error) {
    console.error("[v0] Error in price oracle:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get price",
        details: String(error),
      },
      { status: 500 },
    )
  }
}
