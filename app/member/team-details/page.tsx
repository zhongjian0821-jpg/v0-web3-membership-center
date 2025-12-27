"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, DollarSign, TrendingUp } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

interface TeamMember {
  address: string
  ashvaBalance: number
  usdValue: number
  memberLevel: string // 从后端API直接获取
  referrer?: string
  commission: number
  commissionUSD: number
  joinedAt: string
}

interface TeamData {
  level: number
  commissionRate: number
  members: TeamMember[]
  totalMembers: number
  totalCommission: number
  totalCommissionUSD: number
}

export default function TeamDetailsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const level = searchParams.get("level")
  const { t } = useTranslation()

  const [teamData, setTeamData] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const walletAddress = localStorage.getItem("walletAddress")
    if (!walletAddress) {
      router.push("/")
      return
    }

    if (!level || (level !== "1" && level !== "2")) {
      router.push("/member")
      return
    }

    fetchTeamData(walletAddress, level)
  }, [router, level])

  const fetchTeamData = async (address: string, level: string) => {
    try {
      const response = await fetch(`/api/team?address=${address}&level=${level}`)
      if (!response.ok) {
        console.error("[v0] Team API error:", response.status)
        return
      }
      const data = await response.json()
      setTeamData(data)
    } catch (error) {
      console.error("[v0] Error fetching team data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background p-4">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </main>
    )
  }

  if (!teamData) {
    return null
  }

  return (
    <main className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent p-6 text-white mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/member")}
          className="text-white hover:bg-white/20 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("back")}
        </Button>
        <h1 className="text-2xl font-bold mb-1">
          {teamData.level === 1 ? t("teamDetails.level1Team") : t("teamDetails.level2Team")}
        </h1>
        <p className="text-sm opacity-90">
          {t("teamDetails.commissionRate")}：{teamData.commissionRate}%
        </p>
      </div>

      {/* Summary Cards */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 border-primary/20">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="w-3 h-3" />
              {t("teamDetails.totalMembers")}
            </div>
            <div className="font-bold text-lg">{teamData.totalMembers}</div>
          </Card>

          <Card className="p-4 border-primary/20">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="w-3 h-3" />
              {t("teamDetails.totalCommission")}
            </div>
            <div className="font-bold text-sm">
              {teamData.totalCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-muted-foreground">ASHVA</div>
          </Card>

          <Card className="p-4 border-primary/20">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <DollarSign className="w-3 h-3" />
              {t("teamDetails.usdValue")}
            </div>
            <div className="font-bold text-sm">${teamData.totalCommissionUSD.toFixed(2)}</div>
          </Card>
        </div>
      </div>

      {/* Members List */}
      <div className="px-4">
        <h2 className="font-semibold mb-3 text-sm text-muted-foreground">{t("teamDetails.memberList")}</h2>
        {teamData.members.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">{t("teamDetails.noMembers")}</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {teamData.members.map((member, index) => (
              <Card key={member.address} className="p-4 border-primary/20">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm">
                        {member.address.slice(0, 6)}...{member.address.slice(-4)}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${member.memberLevel === "global_partner" ? "bg-yellow-500 text-black" : member.memberLevel === "market_partner" ? "bg-purple-500 text-white" : "bg-blue-500 text-white"}`}
                      >
                        {member.memberLevel === "global_partner"
                          ? t("teamDetails.globalPartner")
                          : member.memberLevel === "market_partner"
                            ? t("teamDetails.marketPartner")
                            : t("teamDetails.normal")}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("teamDetails.joinTime")}：{new Date(member.joinedAt).toLocaleDateString()}
                    </div>
                    {member.referrer && teamData.level === 2 && (
                      <div className="text-xs text-muted-foreground">
                        {t("teamDetails.referrer")}：{member.referrer.slice(0, 6)}...{member.referrer.slice(-4)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">{t("teamDetails.holding")}</div>
                    <div className="font-semibold text-sm">
                      {member.ashvaBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })} ASHVA
                    </div>
                    <div className="text-xs text-muted-foreground">≈ ${member.usdValue.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {t("teamDetails.myCommission")} ({teamData.commissionRate}%)
                    </div>
                    <div className="font-semibold text-sm text-green-600">
                      {member.commission.toLocaleString(undefined, { maximumFractionDigits: 0 })} ASHVA
                    </div>
                    <div className="text-xs text-green-600">≈ ${member.commissionUSD.toFixed(2)}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
