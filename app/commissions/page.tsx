"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, User, Lock, DollarSign } from "lucide-react"
import { openWalletSwap, ASHVA_CONTRACT } from "@/lib/wallet-swap"
import { useTranslation } from "@/lib/i18n/context"

interface CommissionRecord {
  id: number
  from_wallet: string
  amount: number
  commission_level: number
  transaction_type: string
  created_at: string
}

export default function CommissionsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const address = searchParams.get("address")
  const levelParam = searchParams.get("level")
  const { t } = useTranslation()

  const [records, setRecords] = useState<CommissionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | 1 | 2>(levelParam === "1" ? 1 : levelParam === "2" ? 2 : "all")
  const [hasAccess, setHasAccess] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [memberType, setMemberType] = useState<string>("normal")
  const [upgradeInfo, setUpgradeInfo] = useState({
    currentValue: 0,
    requiredValue: 3000,
    progressPercentage: 0,
    shortfall: 3000,
  })

  useEffect(() => {
    if (!address) {
      router.push("/member")
      return
    }
    checkAccessPermission()
  }, [address])

  useEffect(() => {
    if (hasAccess) {
      fetchCommissionRecords()
    }
  }, [filter, hasAccess])

  const checkAccessPermission = async () => {
    try {
      setCheckingAccess(true)
      const response = await fetch(`/api/member?address=${address}`)
      if (response.ok) {
        const data = await response.json()

        const backendMemberType = data.memberType || "normal"
        setMemberType(backendMemberType)
        const hasPermission = backendMemberType === "market_partner" || backendMemberType === "global_partner"
        setHasAccess(hasPermission)

        if (!hasPermission) {
          const currentValue = data.ashvaValueUSD || 0
          const requiredValue = 3000
          const shortfall = Math.max(0, requiredValue - currentValue)
          const progressPercentage = Math.min(Math.round((currentValue / requiredValue) * 100), 100)

          setUpgradeInfo({
            currentValue,
            requiredValue,
            progressPercentage,
            shortfall,
          })
        }

        if (!hasPermission) {
          console.log("[v0] User does not meet market partner requirement")
        }
      } else {
        router.push("/member")
      }
    } catch (error) {
      console.error("[v0] Error checking access permission:", error)
      router.push("/member")
    } finally {
      setCheckingAccess(false)
    }
  }

  const fetchCommissionRecords = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/commissions/details?address=${address}&level=${filter}`)
      if (response.ok) {
        const data = await response.json()
        setRecords(data.records)
      }
    } catch (error) {
      console.error("[v0] Error fetching commission records:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBuyAshva = () => {
    console.log("[v0] Opening wallet swap interface...")
    openWalletSwap({
      tokenAddress: ASHVA_CONTRACT,
      chain: "ethereum",
    })

    setTimeout(() => {
      alert(t("commissions.buyNow"))
    }, 1000)
  }

  const filteredRecords = filter === "all" ? records : records.filter((r) => r.commission_level === filter)

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/member")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("commissions.backToMember")}
            </Button>
            <h1 className="text-2xl font-bold">{t("commissions.title")}</h1>
          </div>

          <Card className="p-8 border-primary/20 bg-gradient-to-br from-muted/30 to-muted/10">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Lock className="w-8 h-8 text-muted-foreground" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold">{t("commissions.needUpgrade")}</h3>
                <p className="text-sm text-muted-foreground">{t("commissions.upgradeDesc")}</p>
              </div>

              <div className="w-full max-w-md space-y-3 mt-4">
                <div className="p-4 bg-card rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{t("commissions.currentHolding")}</span>
                    <span className="font-bold text-primary">${upgradeInfo.currentValue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">{t("commissions.upgradeRequirement")}</span>
                    <span className="font-bold">${upgradeInfo.requiredValue.toLocaleString()}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{t("commissions.progress")}</span>
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
                      <span className="text-muted-foreground">{t("commissions.stillNeed")}：</span>
                      <span className="font-semibold text-primary ml-1">
                        ${upgradeInfo.shortfall.toLocaleString()} USDT{" "}
                        {t("requireToken.normalDesc").includes("等值") ? "等值" : "equivalent"} ASHVA
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <h4 className="font-semibold text-sm mb-2">{t("commissions.benefits")}</h4>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>{t("commissions.benefit1")}</li>
                    <li>{t("commissions.benefit2")}</li>
                    <li>{t("commissions.benefit3")}</li>
                    <li>{t("commissions.benefit4")}</li>
                  </ul>
                </div>

                <Button className="w-full" onClick={handleBuyAshva}>
                  <DollarSign className="w-4 h-4 mr-2" />
                  {t("commissions.buyNow")}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("back")}
          </Button>
          <h1 className="text-2xl font-bold">{t("commissions.title")}</h1>
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {t("commissions.walletAddress")}: {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
            <div className="flex gap-2">
              <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
                {t("commissions.all")}
              </Button>
              <Button variant={filter === 1 ? "default" : "outline"} size="sm" onClick={() => setFilter(1)}>
                {t("commissions.level1")}
              </Button>
              <Button variant={filter === 2 ? "default" : "outline"} size="sm" onClick={() => setFilter(2)}>
                {t("commissions.level2")}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">{t("commissions.noRecords")}</div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map((record) => (
                <div key={record.id} className="p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {record.from_wallet.slice(0, 6)}...{record.from_wallet.slice(-4)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={record.commission_level === 1 ? "default" : "secondary"}>
                            {record.commission_level === 1 ? t("commissions.level1") : t("commissions.level2")}
                            {t("commissions.commission")}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{record.transaction_type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        +{record.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                        ASHVA
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(record.created_at).toLocaleString("zh-CN")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
