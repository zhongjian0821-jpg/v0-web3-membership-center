"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, Wallet } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

export function RewardsOverview() {
  const { t } = useTranslation()

  return (
    <Card className="bg-card border-border overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground">{t("wallet.totalRewards")}</CardTitle>
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Wallet className="h-4 w-4 mr-2" />
            {t("actions.claimRewards") || "Claim Rewards"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t("actions.availableToClaim") || "Available to Claim"}</p>
            <p className="text-3xl font-bold text-primary">456.78 ASHVA</p>
            <p className="text-xs text-muted-foreground">≈ $1,234.56 USD</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t("member.totalEarnings")}</p>
            <p className="text-3xl font-bold text-foreground">12,345 ASHVA</p>
            <p className="text-xs text-accent flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              +24.5% {t("actions.vsLastMonth") || "vs last month"}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t("actions.nextPayout") || "Next Payout"}</p>
            <p className="text-3xl font-bold text-foreground">2d 14h</p>
            <p className="text-xs text-muted-foreground">Est. 89.2 ASHVA</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
