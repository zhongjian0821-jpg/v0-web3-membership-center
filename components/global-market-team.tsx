"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Users, TrendingUp, Lock, DollarSign, Settings, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { openWalletSwap, ASHVA_CONTRACT } from "@/lib/wallet-swap"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/context"
import { GLOBAL_PARTNER_THRESHOLD } from "@/constants/member-levels"

interface GlobalMarketTeamProps {
  address: string
  isGlobalPartner: boolean
  ashvaValueUSD: number
}

interface TeamMember {
  wallet_address: string
  ashva_balance: string
  member_level: string
  created_at: string
  level: number
}

interface CommissionData {
  level1Total: number
  level2Total: number
  level1Count: number
  level2Count: number
}

export function GlobalMarketTeam({ address, isGlobalPartner, ashvaValueUSD }: GlobalMarketTeamProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const [teamData, setTeamData] = useState<{
    totalMembers: number
    globalPartners: number
    regularMembers: number
    totalPerformance: string
    monthlyGrowth: string
    members: TeamMember[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchaseInitiated, setPurchaseInitiated] = useState(false)
  const [commissionLevel1, setCommissionLevel1] = useState(25)
  const [commissionLevel2, setCommissionLevel2] = useState(25)
  const [isEditingCommission, setIsEditingCommission] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [commissions, setCommissions] = useState<CommissionData>({
    level1Total: 0,
    level2Total: 0,
    level1Count: 0,
    level2Count: 0,
  })

  useEffect(() => {
    if (isGlobalPartner) {
      fetchGlobalTeamData()
      fetchCommissionConfig()
      fetchCommissions()
    } else {
      setLoading(false)
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "ashvaBalance") {
        console.log("[v0] ASHVA balance updated, reloading page...")
        window.location.reload()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [address, isGlobalPartner])

  const fetchGlobalTeamData = async () => {
    try {
      const response = await fetch(`/api/global-team?address=${address}`)
      if (response.ok) {
        const data = await response.json()
        setTeamData(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching global team data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCommissionConfig = async () => {
    try {
      const response = await fetch(`/api/commission-config?address=${address}`)
      if (response.ok) {
        const data = await response.json()
        setCommissionLevel1(data.level1)
        setCommissionLevel2(data.level2)
      }
    } catch (error) {
      console.error("[v0] Error fetching commission config:", error)
    }
  }

  const fetchCommissions = async () => {
    try {
      const response = await fetch(`/api/commissions?address=${address}`)
      if (response.ok) {
        const data = await response.json()
        setCommissions(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching commissions:", error)
    }
  }

  const handleBuyAshva = () => {
    setPurchaseInitiated(true)
    console.log("[v0] Opening wallet swap interface...")
    openWalletSwap({
      tokenAddress: ASHVA_CONTRACT,
      chain: "ethereum",
    })

    setTimeout(() => {
      alert(t("common.purchaseCompleteMessage"))
    }, 1000)
  }

  const saveCommissionConfig = async () => {
    if (commissionLevel1 + commissionLevel2 > 50) {
      alert(t("member.commissionLimitError"))
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/commission-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          level1: commissionLevel1,
          level2: commissionLevel2,
        }),
      })

      if (response.ok) {
        alert(t("member.commissionSaved"))
        setIsEditingCommission(false)
      } else {
        alert(t("common.saveFailed"))
      }
    } catch (error) {
      console.error("[v0] Error saving commission config:", error)
      alert(t("common.saveFailed"))
    } finally {
      setIsSaving(false)
    }
  }

  if (!isGlobalPartner) {
    const requiredUSD = GLOBAL_PARTNER_THRESHOLD
    const shortfall = requiredUSD - ashvaValueUSD
    const shortfallPercentage = Math.round((ashvaValueUSD / requiredUSD) * 100)

    return (
      <Card className="p-6 border-primary/20 bg-gradient-to-br from-muted/30 to-muted/10">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold">{t("member.globalMarketTeam")}</h3>
            <p className="text-sm text-muted-foreground">{t("requireToken.globalPartnerDesc")}</p>
          </div>

          {purchaseInitiated && (
            <div className="w-full p-3 bg-primary/10 rounded-lg border border-primary/20 text-sm">
              💡 {t("common.purchaseCompleteMessage")}
            </div>
          )}

          <div className="w-full space-y-3">
            <div className="p-4 bg-card rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{t("requireToken.currentHolding")}</span>
                <span className="font-bold text-primary">${ashvaValueUSD.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{t("requireToken.requirement")}</span>
                <span className="font-bold">$10,000</span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t("requireToken.progress")}</span>
                  <span>{shortfallPercentage}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.min(shortfallPercentage, 100)}%` }}
                  />
                </div>
              </div>

              {shortfall > 0 && (
                <div className="mt-3 text-sm">
                  <span className="text-muted-foreground">{t("requireToken.stillNeed")}:</span>
                  <span className="font-semibold text-primary ml-1">
                    ${shortfall.toLocaleString()} {t("requireToken.normalDesc")}
                  </span>
                </div>
              )}
            </div>

            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                {t("commissions.benefits")}
              </h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>✓ {t("commissions.benefit1")}</li>
                <li>✓ {t("commissions.benefit2")}</li>
                <li>✓ {t("commissions.benefit3")}</li>
                <li>✓ {t("commissions.benefit4")}</li>
              </ul>
            </div>

            <Button className="w-full" onClick={handleBuyAshva}>
              <DollarSign className="w-4 h-4 mr-2" />
              {t("requireToken.buyNow")}
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Card>
    )
  }

  if (!teamData) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">{t("common.noData")}</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5 border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            {t("member.commissionConfig")}
          </h3>
          <div className="flex flex-wrap gap-2">
            <Link href={`/commissions?address=${address}`} className="flex-1 sm:flex-none">
              <Button variant="outline" size="sm" className="w-full sm:w-auto h-8 text-xs bg-transparent">
                <Eye className="w-3 h-3 mr-1" />
                {t("common.viewDetails")}
              </Button>
            </Link>
            {!isEditingCommission ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingCommission(true)}
                className="flex-1 sm:flex-none h-8 text-xs"
              >
                <Settings className="w-3 h-3 mr-1" />
                {t("member.adjustRate")}
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={saveCommissionConfig}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none h-8 text-xs"
                >
                  {isSaving ? t("common.saving") : t("common.save")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditingCommission(false)
                    fetchCommissionConfig()
                  }}
                  className="flex-1 sm:flex-none h-8 text-xs"
                >
                  {t("common.cancel")}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="p-3 sm:p-4 bg-card rounded-lg border">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-xs sm:text-sm font-medium">{t("member.level1Commission")}</span>
              <span className="text-xl sm:text-2xl font-bold text-primary">{commissionLevel1}%</span>
            </div>
            {isEditingCommission && (
              <div className="space-y-2">
                <Slider
                  value={[commissionLevel1]}
                  onValueChange={(value) => setCommissionLevel1(value[0])}
                  min={1}
                  max={50}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1%</span>
                  <span>50%</span>
                </div>
              </div>
            )}
            {!isEditingCommission && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-muted-foreground">
                  {t("member.totalEarnings")}: {commissions.level1Total.toFixed(2)} ASHVA
                </p>
                <p className="text-xs text-muted-foreground">
                  {commissions.level1Count} {t("member.transactions")}
                </p>
              </div>
            )}
          </div>

          <div className="p-3 sm:p-4 bg-card rounded-lg border">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-xs sm:text-sm font-medium">{t("member.level2Commission")}</span>
              <span className="text-xl sm:text-2xl font-bold text-primary">{commissionLevel2}%</span>
            </div>
            {isEditingCommission && (
              <div className="space-y-2">
                <Slider
                  value={[commissionLevel2]}
                  onValueChange={(value) => setCommissionLevel2(value[0])}
                  min={1}
                  max={50}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1%</span>
                  <span>50%</span>
                </div>
              </div>
            )}
            {!isEditingCommission && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-muted-foreground">
                  {t("member.totalEarnings")}: {commissions.level2Total.toFixed(2)} ASHVA
                </p>
                <p className="text-xs text-muted-foreground">
                  {commissions.level2Count} {t("member.transactions")}
                </p>
              </div>
            )}
          </div>

          {isEditingCommission && (
            <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20 text-xs sm:text-sm">
              <p className="text-yellow-600 font-medium">💡 {t("member.commissionNote")}</p>
              <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                <li>• {t("member.commissionLimitNote")}</li>
                <li>
                  • {t("common.currentTotal")}: {commissionLevel1 + commissionLevel2}%
                </li>
                <li>• {t("member.applyToNewTransactions")}</li>
              </ul>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-4 sm:p-5 border-primary/20">
        <h3 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          {t("member.globalTeamOverview")}
        </h3>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div>
            <div className="text-xl sm:text-2xl font-bold">{teamData.totalMembers}</div>
            <div className="text-xs text-muted-foreground">{t("member.totalMembers")}</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-primary">{teamData.totalPerformance}</div>
            <div className="text-xs text-muted-foreground">{t("member.teamPerformance")}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-success" />
          <span className="text-success font-medium">{teamData.monthlyGrowth}</span>
          <span className="text-muted-foreground">{t("member.monthlyGrowth")}</span>
        </div>
      </Card>

      <Card className="p-4 sm:p-5 border-primary/20">
        <h4 className="font-semibold mb-3 text-sm sm:text-base">{t("member.memberDistribution")}</h4>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-xs sm:text-sm truncate">{t("member.level.globalPartner")}</div>
                <div className="text-xs text-muted-foreground truncate">{t("member.holding")} ≥ $10,000</div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-yellow-500 text-black flex-shrink-0 text-xs sm:text-sm">
              {teamData.globalPartners}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-xs sm:text-sm truncate">{t("member.level.normal")}</div>
                <div className="text-xs text-muted-foreground truncate">{t("member.holding")} &lt; $10,000</div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-500 text-white flex-shrink-0 text-xs sm:text-sm">
              {teamData.regularMembers}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}
