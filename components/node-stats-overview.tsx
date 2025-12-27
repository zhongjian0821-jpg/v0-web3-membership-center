"use client"

import { Card } from "@/components/ui/card"
import { Server, Activity, DollarSign } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

interface NodeStatsProps {
  totalNodes: number
  activeNodes: number
  totalEarnings: string
}

export function NodeStats({ totalNodes, activeNodes, totalEarnings }: NodeStatsProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <Card className="p-4 border-primary/20">
        <div className="flex flex-col items-center text-center">
          <Server className="w-5 h-5 text-primary mb-2" />
          <div className="text-2xl font-bold">{totalNodes}</div>
          <div className="text-xs text-muted-foreground">{t("actions.totalNodes")}</div>
        </div>
      </Card>

      <Card className="p-4 border-primary/20">
        <div className="flex flex-col items-center text-center">
          <Activity className="w-5 h-5 text-green-500 mb-2" />
          <div className="text-2xl font-bold text-green-500">{activeNodes}</div>
          <div className="text-xs text-muted-foreground">{t("nodes.active")}</div>
        </div>
      </Card>

      <Card className="p-4 border-primary/20">
        <div className="flex flex-col items-center text-center">
          <DollarSign className="w-5 h-5 text-primary mb-2" />
          <div className="text-lg font-bold">{totalEarnings}</div>
          <div className="text-xs text-muted-foreground">{t("member.totalEarnings")}</div>
        </div>
      </Card>
    </div>
  )
}
