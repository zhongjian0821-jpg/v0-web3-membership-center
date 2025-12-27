"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, TrendingUp, Award } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

interface TeamStats {
  totalMembers: number
  globalPartners: number
  regularMembers: number
  totalVolume: string
  monthlyGrowth: number
}

interface TeamHierarchyProps {
  address: string
}

export function TeamHierarchy({ address }: TeamHierarchyProps) {
  const { t } = useTranslation()
  const [stats, setStats] = useState<TeamStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeamStats()
  }, [address])

  const fetchTeamStats = async () => {
    try {
      // TODO: Replace with actual API call
      // Mock data
      setStats({
        totalMembers: 48,
        globalPartners: 3,
        regularMembers: 45,
        totalVolume: "45,678.90 ASHVA",
        monthlyGrowth: 23.5,
      })
    } catch (error) {
      console.error("[v0] Error fetching team stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          {t("actions.teamOverview")}
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-2xl font-bold">{stats.totalMembers}</p>
            <p className="text-sm text-muted-foreground">{t("teamStats.totalMembers")}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{stats.totalVolume}</p>
            <p className="text-sm text-muted-foreground">{t("teamStats.totalVolume")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="text-green-500 font-semibold">+{stats.monthlyGrowth}%</span>
          <span className="text-muted-foreground">{t("member.monthlyIncrease")}</span>
        </div>
      </Card>

      <Card className="p-4 border-primary/20">
        <h3 className="font-semibold mb-4">{t("actions.memberDistribution")}</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="font-medium">{t("member.level.globalPartner")}</p>
                <p className="text-xs text-muted-foreground">{t("actions.holding")} ≥ $10,000 ASHVA</p>
              </div>
            </div>
            <Badge className="bg-yellow-500 text-black">{stats.globalPartners}</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium">{t("member.level.normal")}</p>
                <p className="text-xs text-muted-foreground">{t("actions.standardMember")}</p>
              </div>
            </div>
            <Badge className="bg-blue-500 text-white">{stats.regularMembers}</Badge>
          </div>
        </div>
      </Card>

      <Card className="p-4 border-primary/20 bg-muted/30">
        <p className="text-sm text-muted-foreground leading-relaxed">{t("actions.hierarchyDescription")}</p>
      </Card>
    </div>
  )
}
