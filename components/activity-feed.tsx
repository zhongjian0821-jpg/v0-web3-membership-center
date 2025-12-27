"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle2, AlertCircle, TrendingUp, Coins } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

export function ActivityFeed() {
  const { t } = useTranslation()

  const activities = [
    {
      icon: Coins,
      title: t("actions.rewardsClaimed") || "Rewards Claimed",
      description: t("actions.claimedAmount") || "Successfully claimed 245.6 ASHVA",
      time: t("actions.hoursAgo", { hours: 2 }) || "2 hours ago",
      type: "success",
    },
    {
      icon: CheckCircle2,
      title: "Node-003 " + (t("actions.milestone") || "Milestone"),
      description: t("actions.uptimeMilestone") || "Reached 100% uptime for 30 days",
      time: t("actions.hoursAgo", { hours: 5 }) || "5 hours ago",
      type: "success",
    },
    {
      icon: TrendingUp,
      title: t("actions.performanceBoost") || "Performance Boost",
      description: "Node-001 " + (t("actions.topTier") || "improved to top 10% tier"),
      time: t("actions.daysAgo", { days: 1 }) || "1 day ago",
      type: "info",
    },
    {
      icon: AlertCircle,
      title: "Node-004 " + (t("actions.syncing") || "Syncing"),
      description: t("actions.nodeSyncing") || "Node is currently syncing with network",
      time: t("actions.daysAgo", { days: 1 }) || "1 day ago",
      type: "warning",
    },
    {
      icon: Coins,
      title: t("actions.rewardsDistributed") || "Rewards Distributed",
      description: t("actions.receivedFromStaking") || "Received 89.4 ASHVA from staking",
      time: t("actions.daysAgo", { days: 2 }) || "2 days ago",
      type: "success",
    },
  ]

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">{t("actions.recentActivity") || "Recent Activity"}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = activity.icon
              return (
                <div
                  key={index}
                  className="flex gap-4 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div
                    className={`p-2 rounded-lg h-fit ${
                      activity.type === "success"
                        ? "bg-accent/10"
                        : activity.type === "warning"
                          ? "bg-destructive/10"
                          : "bg-primary/10"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        activity.type === "success"
                          ? "text-accent"
                          : activity.type === "warning"
                            ? "text-destructive"
                            : "text-primary"
                      }`}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-foreground text-sm">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
