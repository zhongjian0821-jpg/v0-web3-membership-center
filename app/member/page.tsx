"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  LogOut,
  Users,
  DollarSign,
  Award,
  RefreshCw,
  UserPlus,
  Gift,
  ShoppingCart,
  Package,
  ArrowLeftRight,
  Wallet,
  Server,
} from "lucide-react"
import { MemberHierarchy } from "@/components/member-hierarchy"
import { GlobalMarketTeam } from "@/components/global-market-team"
import { useLanguage } from "@/lib/i18n/context"

interface MemberData {
  address: string
  memberType: "global_partner" | "market_partner" | "normal"
  ashvaBalance: string
  ashvaValueUSD: number
  ashvaPrice: number
  directTeam: number
  totalTeam: number
  totalEarnings: string
  level1Commission: number
  level2Commission: number
}

interface DailyNodeRecord {
  date: string
  earnings_ashva: number
  uptime: number
}

export default function MemberPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [memberData, setMemberData] = useState<MemberData>({
    address: "",
    memberType: "normal",
    ashvaBalance: "0.00 ASHVA",
    ashvaValueUSD: 0,
    ashvaPrice: 0,
    directTeam: 0,
    totalTeam: 0,
    totalEarnings: "0.00 ASHVA",
    level1Commission: 3,
    level2Commission: 2,
  })
  const [loading, setLoading] = useState(true)
  const [userAddress, setUserAddress] = useState<string>("")
  const [refreshing, setRefreshing] = useState(false)
  const [ashvaPrice, setAshvaPrice] = useState(0)
  const [nodeEarnings, setNodeEarnings] = useState(0)
  const [dailyNodeRecords, setDailyNodeRecords] = useState<DailyNodeRecord[]>([])

  useEffect(() => {
    const address = localStorage.getItem("walletAddress")
    if (!address) {
      router.push("/")
      return
    }
    setUserAddress(address)
    fetchMemberData(address)
    fetchNodeEarnings(address)
  }, [router])

  const fetchMemberData = async (address: string) => {
    try {
      console.log("[v0] Fetching member data for:", address)
      const response = await fetch(`/api/member?address=${address}`)

      if (!response.ok) {
        if (response.status === 404) {
          router.push("/")
          return
        }
        console.error("[v0] API error:", response.status)
        return
      }

      const apiResponse = await response.json()
      console.log("[v0] Member API response:", apiResponse)

      if (apiResponse.success && apiResponse.data) {
        const apiData = apiResponse.data

        const ashvaBalanceNum = Number(apiData.ashvaBalance) || 0
        const priceValue = Number(apiResponse.ashvaPrice) || 0.00006883

        console.log("[v0] Price from API:", {
          ashvaPrice: apiResponse.ashvaPrice,
          priceSource: apiResponse.priceSource,
          ashvaValueUSD: apiResponse.ashvaValueUSD,
          calculatedUSD: ashvaBalanceNum * priceValue,
        })

        const mappedData = {
          address: apiData.address,
          memberType: apiData.memberType,
          ashvaBalance: `${ashvaBalanceNum.toFixed(2)} ASHVA`,
          // 使用API返回的USD值，如果不存在则自己计算
          ashvaValueUSD: Number(apiResponse.ashvaValueUSD) || ashvaBalanceNum * priceValue,
          ashvaPrice: priceValue,
          directTeam: apiData.directTeam || 0,
          totalTeam: apiData.totalTeam || 0,
          totalEarnings: `${Number(apiData.teamRewards_ashva || apiData.teamRewards || 0).toFixed(2)} ASHVA`,
          level1Commission: 3,
          level2Commission: 2,
        }

        console.log("[v0] Mapped member data:", mappedData)
        setMemberData(mappedData)
        setAshvaPrice(mappedData.ashvaPrice)
      } else {
        console.error("[v0] Invalid API response structure:", apiResponse)
      }
    } catch (error) {
      console.error("[v0] Error fetching member data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchNodeEarnings = async (address: string) => {
    try {
      const summaryResponse = await fetch(`/api/proxy/assigned-records/summary?wallet=${address}`)
      if (!summaryResponse.ok) {
        console.error("[v0] Failed to fetch node earnings:", summaryResponse.status)
        return
      }
      const summaryData = await summaryResponse.json()

      if (summaryData.success && summaryData.data) {
        setNodeEarnings(summaryData.data.total_income_ashva || 0)
        console.log("[v0] Node earnings fetched:", summaryData.data.total_income_ashva)
      }

      const recordsResponse = await fetch(`/api/proxy/assigned-records?wallet=${address}&limit=100`)
      if (!recordsResponse.ok) {
        console.error("[v0] Failed to fetch daily records:", recordsResponse.status)
        return
      }
      const recordsData = await recordsResponse.json()

      if (recordsData.success && recordsData.data) {
        const dailyMap = new Map<string, number>()

        recordsData.data.forEach((record: any) => {
          const date = new Date(record.record_date).toLocaleDateString("zh-CN")
          const earnings = Number.parseFloat(record.daily_income_ashva || "0")
          dailyMap.set(date, (dailyMap.get(date) || 0) + earnings)
        })

        const dailyRecords: DailyNodeRecord[] = Array.from(dailyMap.entries())
          .map(([date, earnings]) => ({
            date,
            earnings_ashva: earnings,
            uptime: 99.9, // 默认值
          }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        setDailyNodeRecords(dailyRecords)
        console.log("[v0] Daily node records fetched:", dailyRecords.length)
      }
    } catch (error) {
      console.error("[v0] Error fetching node earnings:", error)
    }
  }

  const handleRefresh = async () => {
    if (refreshing || !userAddress) return
    setRefreshing(true)
    await fetchMemberData(userAddress)
    await fetchNodeEarnings(userAddress)
    setRefreshing(false)
  }

  const handleLogout = () => {
    localStorage.clear()
    sessionStorage.clear()

    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes("wagmi") || key.includes("wallet") || key.includes("wc@"))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key))

    if (typeof window !== "undefined" && window.indexedDB) {
      window.indexedDB.deleteDatabase("WALLET_CONNECT_V2_INDEXED_DB")
    }

    console.log("[v0] Logged out and cleared all cache")
    window.location.href = "/"
  }

  const calculatedUSDValue = memberData.ashvaValueUSD || 0

  const getMemberLevel = () => {
    const memberType = memberData.memberType || "normal"

    if (memberType === "global_partner") {
      return { label: t("member.level.globalPartner"), color: "bg-yellow-500 text-black", type: "global_partner" }
    } else if (memberType === "market_partner") {
      return { label: t("member.level.partner"), color: "bg-blue-500 text-white", type: "market_partner" }
    } else {
      return { label: t("member.level.normal"), color: "bg-gray-500 text-white", type: "normal" }
    }
  }

  const commissionRules = {
    title:
      memberData.memberType === "global_partner"
        ? "全球合伙人"
        : memberData.memberType === "market_partner"
          ? "市场合伙人"
          : "普通会员",
    totalRate:
      memberData.memberType === "global_partner" ? "5%" : memberData.memberType === "market_partner" ? "10%" : "5%",
    maxLevels: memberData.memberType === "global_partner" ? 100 : memberData.memberType === "market_partner" ? 10 : 2,
    description:
      memberData.memberType === "global_partner"
        ? "可管理100层团队，5%总收益权可分配给下级市场合伙人"
        : memberData.memberType === "market_partner"
          ? "可管理10层团队，10%总收益权可分配给下级"
          : "直推3%，间推2%（固定比例）",
    canDistribute: memberData.memberType === "global_partner" || memberData.memberType === "market_partner",
  }

  const teamEarningsValue = Number.parseFloat(memberData.totalEarnings?.replace(/[^0-9.]/g, "") || "0")
  const teamEarningsUSD = teamEarningsValue * ashvaPrice

  const totalBalance = teamEarningsValue + nodeEarnings
  const totalBalanceUSD = totalBalance * ashvaPrice

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold">{t("member.title")}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-mono truncate">{userAddress}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div
                className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${getMemberLevel().color}`}
              >
                {getMemberLevel().label}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 h-8 text-xs sm:text-sm bg-transparent"
                onClick={() => router.push("/invite?address=" + memberData.address)}
              >
                <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                {t("member.referrer")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 h-8 text-xs sm:text-sm bg-transparent"
                onClick={handleLogout}
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                {t("member.logout")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Card className="p-4 border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <DollarSign className="w-4 h-4" />
                {t("member.ashvaHolding")}
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <div className="font-bold text-lg sm:text-xl mb-1 break-all">{memberData.ashvaBalance}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">≈ ${calculatedUSDValue.toFixed(2)}</div>
            {ashvaPrice > 0 && <div className="text-xs text-green-500 mt-1">@${ashvaPrice.toFixed(8)} 实时</div>}
          </Card>

          <Card className="p-4 border-primary/20">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <Wallet className="w-4 h-4" />
              {t("member.walletCenter")}
            </div>
            <div className="font-bold text-xl mb-1 text-green-500">{totalBalance.toFixed(2)} ASHVA</div>
            <div className="text-xs text-muted-foreground mb-2">≈ ${totalBalanceUSD.toFixed(2)} USD</div>

            <div className="space-y-1 mb-2 pt-2 border-t border-border/50">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Gift className="w-3 h-3" />
                  {t("member.teamRewards")}
                </span>
                <span className="font-medium">{teamEarningsValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Server className="w-3 h-3" />
                  {t("member.nodeEarnings")}
                </span>
                <span className="font-medium">{nodeEarnings.toFixed(2)}</span>
              </div>
            </div>

            {dailyNodeRecords.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                  <Server className="w-3 h-3" />
                  {t("nodes.dailyRecords")}
                </h4>
                <div className="max-h-40 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs py-2">{t("nodes.date")}</TableHead>
                        <TableHead className="text-xs py-2">{t("nodes.usageRate")}</TableHead>
                        <TableHead className="text-xs py-2 text-right">{t("nodes.earnings")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyNodeRecords.map((record, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-xs py-2">{record.date}</TableCell>
                          <TableCell className="text-xs py-2">{record.uptime}%</TableCell>
                          <TableCell className="text-xs py-2 text-right text-green-500 font-medium">
                            {record.earnings_ashva.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs bg-transparent mt-2"
              onClick={() => router.push("/withdraw")}
            >
              <Gift className="w-3 h-3 mr-1" />
              {t("member.withdrawRewards")}
            </Button>
          </Card>

          <Card className="p-4 border-primary/20">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <Users className="w-4 h-4" />
              {t("member.directTeam")}
            </div>
            <div className="font-bold text-xl mb-1">{memberData.directTeam}</div>
            <div className="text-sm text-muted-foreground">{t("member.firstLevel")}</div>
          </Card>

          <Card className="p-4 border-primary/20">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <Award className="w-4 h-4" />
              {t("member.totalTeam")}
            </div>
            <div className="font-bold text-xl mb-1">{memberData.totalTeam}</div>
            <div className="text-sm text-muted-foreground">{t("member.allLevels")}</div>
          </Card>
        </div>

        <Card className="p-5 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-base">
            <Award className="w-5 h-5 text-primary" />
            佣金规则 - {commissionRules.title}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
              <span className="text-sm text-muted-foreground">总收益权：</span>
              <span className="font-bold text-primary text-lg">{commissionRules.totalRate}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
              <span className="text-sm text-muted-foreground">可管理层级：</span>
              <span className="font-bold text-lg">{commissionRules.maxLevels} 层</span>
            </div>
            <div className="p-3 bg-background/50 rounded-lg">
              <p className="text-sm text-muted-foreground">{commissionRules.description}</p>
            </div>

            {commissionRules.canDistribute && (
              <Button
                variant="outline"
                className="w-full mt-2 bg-transparent"
                onClick={() => router.push("/commission-manage")}
              >
                管理佣金分配
              </Button>
            )}
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="hierarchy" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="hierarchy">{t("member.partners")}</TabsTrigger>
            <TabsTrigger value="globalteam">{t("member.globalMarketTeam")}</TabsTrigger>
          </TabsList>

          <TabsContent value="hierarchy" className="mt-0 space-y-4">
            <MemberHierarchy
              address={userAddress}
              memberType={memberData.memberType === "global_partner" ? "global_partner" : "regular"}
              ashvaValueUSD={calculatedUSDValue}
              actualMemberType={memberData.memberType}
            />
          </TabsContent>

          <TabsContent value="globalteam" className="mt-0">
            <GlobalMarketTeam
              address={userAddress}
              isGlobalPartner={memberData.memberType === "global_partner"}
              ashvaValueUSD={calculatedUSDValue}
            />
          </TabsContent>
        </Tabs>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
        <div className="container mx-auto">
          <div className="grid grid-cols-4 gap-1 px-2 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center justify-center gap-1 h-auto py-2 px-1"
              onClick={() => router.push("/purchase")}
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="text-[11px] leading-tight text-center truncate w-full">{t("nav.purchase")}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center justify-center gap-1 h-auto py-2 px-1"
              onClick={() => router.push("/nodes")}
            >
              <Package className="w-5 h-5" />
              <span className="text-[11px] leading-tight text-center truncate w-full">{t("nav.nodes")}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center justify-center gap-1 h-auto py-2 px-1"
              onClick={() => router.push("/transfer")}
            >
              <ArrowLeftRight className="w-5 h-5" />
              <span className="text-[11px] leading-tight text-center truncate w-full">{t("nav.transfer")}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center justify-center gap-1 h-auto py-2 px-1 bg-primary/10"
            >
              <Users className="w-5 h-5 text-primary" />
              <span className="text-[11px] leading-tight text-center truncate w-full text-primary">
                {t("nav.member")}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
