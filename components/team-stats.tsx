"use client"

import { Card } from "@/components/ui/card"
import { Users, TrendingUp, Activity, Award } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

interface TeamStatsProps {
  totalVolume: string
  totalMembers: number
  activeMembers: number
  levelDistribution: {
    level3: number
    level4: number
    level5: number
  }
}

export function TeamStats({ totalVolume, totalMembers, activeMembers, levelDistribution }: TeamStatsProps) {
  const { t } = useTranslation()

  return (
    <Card className="p-6 bg-card border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        {t("teamStats.title")}
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="space-y-2 p-4 bg-secondary/30 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">{t("teamStats.totalVolume")}</span>
          </div>
          <p className="text-xl font-semibold text-primary">{totalVolume}</p>
        </div>

        <div className="space-y-2 p-4 bg-secondary/30 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-xs">{t("teamStats.totalMembers")}</span>
          </div>
          <p className="text-xl font-semibold text-foreground">{totalMembers}</p>
        </div>

        <div className="space-y-2 p-4 bg-secondary/30 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span className="text-xs">{t("teamStats.activeMembers")}</span>
          </div>
          <p className="text-xl font-semibold text-accent">{activeMembers}</p>
        </div>

        <div className="space-y-2 p-4 bg-secondary/30 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Award className="h-4 w-4" />
            <span className="text-xs">{t("teamStats.activeRate")}</span>
          </div>
          <p className="text-xl font-semibold text-foreground">{Math.round((activeMembers / totalMembers) * 100)}%</p>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">{t("teamStats.levelDistribution")}</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">{t("wallet.level")} 3</span>
            <div className="flex items-center gap-2 flex-1 mx-4">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-chart-1 rounded-full transition-all"
                  style={{ width: `${(levelDistribution.level3 / totalMembers) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-foreground w-8">{levelDistribution.level3}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">{t("wallet.level")} 4</span>
            <div className="flex items-center gap-2 flex-1 mx-4">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-chart-2 rounded-full transition-all"
                  style={{ width: `${(levelDistribution.level4 / totalMembers) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-foreground w-8">{levelDistribution.level4}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">{t("wallet.level")} 5</span>
            <div className="flex items-center gap-2 flex-1 mx-4">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-chart-3 rounded-full transition-all"
                  style={{ width: `${(levelDistribution.level5 / totalMembers) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-foreground w-8">{levelDistribution.level5}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
