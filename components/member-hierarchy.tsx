"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, User, Lock, DollarSign, TrendingUp, Eye, Users } from "lucide-react"
import { openWalletSwap, ASHVA_CONTRACT } from "@/lib/wallet-swap"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/context"

interface HierarchyMember {
  address: string
  level: number
  earnings: string
  teamSize: number
  joinDate: string
}

interface MemberHierarchyProps {
  address: string
  memberType: "global_partner" | "regular"
  ashvaValueUSD: number
  actualMemberType?: "global_partner" | "market_partner" | "normal"
}

export function MemberHierarchy({ address, memberType, ashvaValueUSD, actualMemberType }: MemberHierarchyProps) {
  const { t } = useTranslation()
  const [level1, setLevel1] = useState<HierarchyMember[]>([])
  const [level2, setLevel2] = useState<HierarchyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [purchaseInitiated, setPurchaseInitiated] = useState(false)
  const [hasParent, setHasParent] = useState(false)
  const [commissions, setCommissions] = useState({
    level1Total: 0,
    level2Total: 0,
    level1Count: 0,
    level2Count: 0,
  })

  const [upgradeInfo, setUpgradeInfo] = useState({
    currentValue: 0,
    requiredValue: 3000,
    progressPercentage: 0,
    shortfall: 3000,
  })

  const effectiveMemberType = actualMemberType || memberType
  const isMarketPartner = effectiveMemberType === "market_partner" || effectiveMemberType === "global_partner"

  useEffect(() => {
    checkReferralStatus()

    if (effectiveMemberType === "normal") {
      fetchUpgradeInfo()
    }

    if (isMarketPartner) {
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
  }, [address, isMarketPartner])

  const fetchUpgradeInfo = async () => {
    try {
      const response = await fetch(`/api/member?address=${address}`)
      if (response.ok) {
        const data = await response.json()

        // 后端返回的upgradeProgress包含所有升级信息
        if (data.upgradeProgress) {
          setUpgradeInfo(data.upgradeProgress)
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching upgrade info:", error)
    }
  }

  const checkReferralStatus = async () => {
    try {
      const response = await fetch(`/api/wallet/referral-status?address=${address}`)
      if (response.ok) {
        const data = await response.json()
        setHasParent(!!data.hasParent)
        console.log("[v0] Referral status check:", { hasParent: !!data.hasParent, address })

        if (data.hasParent && isMarketPartner) {
          fetchHierarchy()
        } else {
          setLoading(false)
        }
      }
    } catch (error) {
      console.error("[v0] Error checking referral status:", error)
      setLoading(false)
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

  const fetchHierarchy = async () => {
    try {
      const response = await fetch(`/api/member/hierarchy?address=${address}`)
      if (response.ok) {
        const data = await response.json()
        setLevel1(data.level1 || [])
        setLevel2(data.level2 || [])
        console.log("[v0] Hierarchy data loaded:", {
          level1Count: data.level1?.length || 0,
          level2Count: data.level2?.length || 0,
        })
      } else {
        setLevel1([])
        setLevel2([])
      }
    } catch (error) {
      console.error("[v0] Error fetching hierarchy:", error)
      setLevel1([])
      setLevel2([])
    } finally {
      setLoading(false)
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

  if (effectiveMemberType === "normal") {
    return (
      <Card className="p-6 border-primary/20 bg-gradient-to-br from-muted/30 to-muted/10">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold">{t("member.marketPartnerTeam")}</h3>
            <p className="text-sm text-muted-foreground">{t("member.needMarketPartner")}</p>
          </div>

          {purchaseInitiated && (
            <div className="w-full p-3 bg-primary/10 rounded-lg border border-primary/20 text-sm">
              💡 {t("common.purchaseCompleteMessage")}
            </div>
          )}

          <div className="w-full space-y-3">
            <div className="p-4 bg-card rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{t("member.currentHolding")}</span>
                <span className="font-bold text-primary">${upgradeInfo.currentValue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{t("member.upgradeRequirement")}</span>
                <span className="font-bold">${upgradeInfo.requiredValue.toLocaleString()}</span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t("member.progress")}</span>
                  <span>{upgradeInfo.progressPercentage}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${upgradeInfo.progressPercentage}%` }}
                  />
                </div>
              </div>

              {upgradeInfo.shortfall > 0 && (
                <div className="mt-3 text-sm">
                  <span className="text-muted-foreground">{t("member.stillNeed")}:</span>
                  <span className="font-semibold text-primary ml-1">
                    ${upgradeInfo.shortfall.toLocaleString()} {t("common.usdtEquivalent")}
                  </span>
                </div>
              )}
            </div>

            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                {t("member.becomePartnerBenefits")}
              </h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>✓ {t("member.partnerBenefit1")}</li>
                <li>✓ {t("member.partnerBenefit2")}</li>
                <li>✓ {t("member.partnerBenefit3")}</li>
                <li>✓ {t("member.partnerBenefit4")}</li>
              </ul>
            </div>

            <Button className="w-full" onClick={handleBuyAshva}>
              <DollarSign className="w-4 h-4 mr-2" />
              {t("common.buyAshvaNow")}
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  if (isMarketPartner && !hasParent && !loading) {
    return (
      <Card className="p-6 border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <User className="w-8 h-8 text-yellow-600" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold">{t("member.noReferrerTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("member.noReferrerDescription")}</p>
          </div>

          <Link href="/invite">
            <Button className="gap-2">
              <User className="w-4 h-4" />
              {t("member.referral.addReferrer")}
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (level1.length === 0 && level2.length === 0) {
    return (
      <Card className="p-6 border-primary/20">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold">{t("member.noTeamYet")}</h3>
            <p className="text-sm text-muted-foreground">{t("member.inviteToEarn")}</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {isMarketPartner && (
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
            <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              {t("member.commissionEarnings")}
            </h3>
            <Link href={`/commissions?address=${address}`} className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full sm:w-auto h-8 text-xs bg-transparent">
                <Eye className="w-3 h-3 mr-1" />
                {t("common.viewDetails")}
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 bg-card rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">{t("member.level1CommissionTotal")}</p>
              <p className="text-base sm:text-lg font-bold text-primary break-all">
                {commissions.level1Total.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                ASHVA
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {commissions.level1Count} {t("common.transactions")}
              </p>
            </div>

            <div className="p-3 bg-card rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">{t("member.level2CommissionTotal")}</p>
              <p className="text-base sm:text-lg font-bold text-primary break-all">
                {commissions.level2Total.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                ASHVA
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {commissions.level2Count} {t("common.transactions")}
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-3 sm:p-4 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm sm:text-base">{t("member.level1Team")}</h3>
          <Badge variant="secondary" className="text-xs">
            {level1.length} {t("common.people")}
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
          {effectiveMemberType === "global_partner"
            ? t("member.customCommissionApplies")
            : t("member.get3PercentCommission")}
        </p>

        {level1.length === 0 ? (
          <div className="p-3 sm:p-4 text-center text-xs sm:text-sm text-muted-foreground bg-muted/30 rounded-lg">
            {t("member.noLevel1Team")}
          </div>
        ) : (
          <div className="space-y-2">
            {level1.map((member, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 sm:p-3 bg-card rounded-lg border border-border gap-2"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs sm:text-sm truncate">
                      {member.address.slice(0, 6)}...{member.address.slice(-4)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("member.team")} {member.teamSize} {t("common.people")}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-xs sm:text-sm text-primary">{member.earnings}</p>
                  <p className="text-xs text-muted-foreground">{member.joinDate}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-3 sm:p-4 border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm sm:text-base">{t("member.level2Team")}</h3>
          <Badge variant="outline" className="text-xs">
            {level2.length} {t("common.people")}
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
          {effectiveMemberType === "global_partner"
            ? t("member.remainingCommissionApplies")
            : t("member.get2PercentCommission")}
        </p>

        {level2.length === 0 ? (
          <div className="p-3 sm:p-4 text-center text-xs sm:text-sm text-muted-foreground bg-muted/30 rounded-lg">
            {t("member.noLevel2Team")}
          </div>
        ) : (
          <div className="space-y-2">
            {level2.map((member, index) => (
              <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs sm:text-sm truncate">
                      {member.address.slice(0, 6)}...{member.address.slice(-4)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("member.team")} {member.teamSize} {t("common.people")}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-xs sm:text-sm">{member.earnings}</p>
                  <p className="text-xs text-muted-foreground">{member.joinDate}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
