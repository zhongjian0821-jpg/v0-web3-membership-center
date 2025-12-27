"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, Users, TrendingUp } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

interface UplineData {
  address: string
  level: number
  status: string
}

interface DownlineData {
  address: string
  level: number
  joinDate: string
  rewards: string
  status: string
  teamSize: number
}

interface HierarchyTreeProps {
  upline: UplineData
  downlines: DownlineData[]
}

export function HierarchyTree({ upline, downlines }: HierarchyTreeProps) {
  const { t } = useTranslation()

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="space-y-4">
      {/* 上层节点 */}
      <Card className="p-6 bg-card border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          {t("actions.uplineReferrer")}
        </h3>
        <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <code className="text-sm font-mono text-foreground">{formatAddress(upline.address)}</code>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                  {t("wallet.level")} {upline.level}
                </Badge>
                <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/20">
                  {upline.status === "active" ? t("teamStats.activeMembers") : ""}
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <a href={`https://etherscan.io/address/${upline.address}`} target="_blank" rel="noopener noreferrer">
              {t("member.viewDetails")}
            </a>
          </Button>
        </div>
      </Card>

      {/* 下层节点 */}
      <Card className="p-6 bg-card border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-accent" />
          {t("actions.myTeam")} ({downlines.length})
        </h3>
        <div className="space-y-3">
          {downlines.map((member, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border hover:border-accent/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center text-xs font-semibold text-accent">
                  #{index + 1}
                </div>
                <div>
                  <code className="text-sm font-mono text-foreground">{formatAddress(member.address)}</code>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
                      {t("wallet.level")} {member.level}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{member.joinDate}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{member.rewards} ASHVA</p>
                <p className="text-xs text-muted-foreground">
                  {t("actions.team")}: {member.teamSize}
                  {t("actions.people")}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground ml-2" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
