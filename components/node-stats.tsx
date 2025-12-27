"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Activity, Zap, TrendingUp, Award } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

export function NodeStats() {
  const { t } = useTranslation()

  const stats = [
    {
      icon: Activity,
      label: t("nodeStats.activeNodes"),
      value: "12",
      change: `+2 ${t("nodeStats.thisWeek")}`,
      trend: "up",
    },
    {
      icon: Zap,
      label: t("nodeStats.totalRewards"),
      value: "2,456 ASHVA",
      change: "+18.2%",
      trend: "up",
    },
    {
      icon: TrendingUp,
      label: t("nodeStats.uptime"),
      value: "99.8%",
      change: t("nodeStats.allTime"),
      trend: "neutral",
    },
    {
      icon: Award,
      label: t("nodeStats.nodeRank"),
      value: "#127",
      change: `${t("nodeStats.top")} 5%`,
      trend: "neutral",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="bg-card border-border overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-accent">{stat.change}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
