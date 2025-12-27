import { NextResponse } from "next/server"

// 模拟从数据库获取的层级数据
// 实际应用中，这些数据应该从您的数据库中获取
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")

  // 模拟数据 - 实际应该从数据库查询
  const hierarchyData = {
    currentUser: {
      address: address || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      level: 2,
      totalRewards: "1,234.56",
      teamSize: 15,
      directReferrals: 5,
      joinDate: "2024-01-15",
    },
    upline: {
      address: "0xea75cb12bbe6232eb082b365f450d3fe06d02fb3", // Ashva合约地址作为上层
      level: 1,
      status: "active",
    },
    downlines: [
      {
        address: "0x9876...abcd",
        level: 3,
        joinDate: "2024-02-01",
        rewards: "456.78",
        status: "active",
        teamSize: 8,
      },
      {
        address: "0x5432...efgh",
        level: 3,
        joinDate: "2024-02-15",
        rewards: "234.56",
        status: "active",
        teamSize: 4,
      },
      {
        address: "0x1234...ijkl",
        level: 3,
        joinDate: "2024-03-01",
        rewards: "123.45",
        status: "active",
        teamSize: 3,
      },
    ],
    teamStats: {
      totalVolume: "5,678.90",
      totalMembers: 15,
      activeMembers: 12,
      levelDistribution: {
        level3: 5,
        level4: 7,
        level5: 3,
      },
    },
  }

  return NextResponse.json(hierarchyData)
}
