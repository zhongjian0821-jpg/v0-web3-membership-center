"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldCheck, Lock, TrendingUp, AlertCircle, Clock } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

interface StakingAgreementProps {
  requiredAmountUSD: number
  requiredAmountASHVA: number
  ashvaPrice: number
  onAccept: (accepted: boolean) => void
}

export function StakingAgreement({
  requiredAmountUSD,
  requiredAmountASHVA,
  ashvaPrice,
  onAccept,
}: StakingAgreementProps) {
  const [agreed, setAgreed] = useState(false)
  const { t } = useTranslation()

  const handleCheckboxChange = (checked: boolean) => {
    setAgreed(checked)
    onAccept(checked)
  }

  const lockPeriodDays = 180
  const unlockDate = new Date()
  unlockDate.setDate(unlockDate.getDate() + lockPeriodDays)

  return (
    <Card className="p-6 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <ShieldCheck className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h3 className="font-bold text-lg">{t("purchase.stakingAgreement")}</h3>
          <p className="text-xs text-muted-foreground">Staking Agreement</p>
        </div>
      </div>

      <Alert className="mb-4 border-amber-500/30 bg-amber-500/5">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        <AlertDescription className="text-sm">
          <p className="font-semibold mb-1">{t("purchase.stakingRequired", { amount: requiredAmountUSD })}</p>
          <p className="text-xs text-muted-foreground">{t("purchase.stakingDescription")}</p>
        </AlertDescription>
      </Alert>

      <div className="space-y-4 mb-6">
        <div className="p-4 rounded-lg bg-muted/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("purchase.stakingAmount")}:</span>
            <span className="font-bold text-amber-500">{requiredAmountASHVA.toLocaleString()} ASHVA</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("common.usdEquivalent")}:</span>
            <span className="font-semibold">${requiredAmountUSD}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("common.currentPrice")}:</span>
            <span className="text-xs font-mono">${ashvaPrice.toFixed(8)}/ASHVA</span>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <Lock className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-blue-500">{t("purchase.lockPeriod")}</p>
              <p className="text-xs text-muted-foreground">
                {t("purchase.lockPeriodDescription", { days: lockPeriodDays })}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("purchase.expectedUnlock")}: {unlockDate.toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
            <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-green-500">{t("purchase.stakingRewards")}</p>
              <p className="text-xs text-muted-foreground">{t("purchase.stakingRewardsDescription")}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-500">{t("purchase.unstaking")}</p>
              <p className="text-xs text-muted-foreground">{t("purchase.unstakingDescription")}</p>
              <p className="text-xs text-muted-foreground">{t("purchase.withdrawTime")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 mb-4">
        <h4 className="font-semibold text-sm mb-2 text-destructive">{t("common.importantNotes")}</h4>
        <ul className="space-y-1 text-xs text-muted-foreground list-disc list-inside">
          <li>{t("purchase.stakingNote1")}</li>
          <li>{t("purchase.stakingNote2")}</li>
          <li>{t("purchase.stakingNote3")}</li>
          <li>{t("purchase.stakingNote4")}</li>
        </ul>
      </div>

      <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
        <Checkbox id="agree-staking" checked={agreed} onCheckedChange={handleCheckboxChange} className="mt-1" />
        <label htmlFor="agree-staking" className="text-sm leading-relaxed cursor-pointer select-none">
          {t("purchase.agreementText", { amount: requiredAmountASHVA.toLocaleString(), days: lockPeriodDays })}
        </label>
      </div>
    </Card>
  )
}
