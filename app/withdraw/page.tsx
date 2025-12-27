"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Wallet, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Flame, Snowflake } from "lucide-react"
import { useLanguage } from "@/lib/i18n/context"

interface WithdrawRecord {
  id: number
  amount: string
  amount_usd: string
  status: string
  tx_hash: string | null
  created_at: string
  processed_at: string | null
}

interface DailyRecord {
  record_date: string
  daily_income_ashva: string
  online_rate: string
}
// </CHANGE>

export default function WithdrawPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [teamRewardsBalance, setTeamRewardsBalance] = useState(0)
  const [nodeEarningsBalance, setNodeEarningsBalance] = useState(0)
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([])
  const [availableBalance, setAvailableBalance] = useState(0)
  const [frozenBalance, setFrozenBalance] = useState(0)
  const [burnRate, setBurnRate] = useState(0)
  // </CHANGE>
  const [ashvaPrice, setAshvaPrice] = useState(0)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [records, setRecords] = useState<WithdrawRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const MIN_WITHDRAW_USD = 10

  const totalBalance = teamRewardsBalance + nodeEarningsBalance

  const calculateWithdrawableAmounts = (records: DailyRecord[]) => {
    const now = new Date()
    let availableAmount = 0
    let frozenAmount = 0
    let totalBurnableAmount = 0
    let totalBurnRate = 0

    records.forEach((record) => {
      const recordDate = new Date(record.record_date)
      const daysSince = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24))
      const amount = Number.parseFloat(record.daily_income_ashva || "0")

      if (daysSince < 7) {
        // 7天内冻结
        frozenAmount += amount
      } else {
        // 7天后可提现
        availableAmount += amount
        if (daysSince < 30) {
          // 7-30天内提现，燃烧10%
          totalBurnableAmount += amount
          totalBurnRate += amount * 0.1
        } else {
          // 30天后提现，燃烧3%
          totalBurnableAmount += amount
          totalBurnRate += amount * 0.03
        }
      }
    })

    // 计算加权平均燃烧率
    const avgBurnRate = totalBurnableAmount > 0 ? totalBurnRate / totalBurnableAmount : 0

    return {
      availableAmount,
      frozenAmount,
      burnRate: avgBurnRate,
    }
  }
  // </CHANGE>

  const fetchData = async (address: string) => {
    try {
      const [withdrawRes, nodeRes, recordsRes, priceRes] = await Promise.all([
        fetch(`/api/withdraw?address=${address}`),
        fetch(`/api/proxy/assigned-records/summary?wallet=${address}`),
        fetch(`/api/proxy/assigned-records?wallet=${address}&limit=365`),
        // </CHANGE>
        fetch("/api/ashva-price"),
      ])

      if (withdrawRes.ok) {
        const data = await withdrawRes.json()
        setRecords(data.records || [])
        setTeamRewardsBalance(data.availableBalance || 0)
      }

      if (nodeRes.ok) {
        const nodeData = await nodeRes.json()
        console.log("[v0] Node earnings data:", nodeData)
        const nodeEarnings = nodeData?.data?.total_income_ashva || 0
        setNodeEarningsBalance(nodeEarnings)
        console.log("[v0] Node earnings balance:", nodeEarnings)
      }

      if (recordsRes.ok) {
        const recordsData = await recordsRes.json()
        const records = recordsData?.data || []
        setDailyRecords(records)

        const { availableAmount, frozenAmount, burnRate } = calculateWithdrawableAmounts(records)
        setAvailableBalance(availableAmount)
        setFrozenBalance(frozenAmount)
        setBurnRate(burnRate)

        console.log("[v0] Withdrawal calculation:", {
          availableAmount,
          frozenAmount,
          burnRate: `${(burnRate * 100).toFixed(1)}%`,
        })
      }
      // </CHANGE>

      if (priceRes.ok) {
        const priceData = await priceRes.json()
        setAshvaPrice(priceData.price || 0)
      }
    } catch (err) {
      console.error("Failed to fetch data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const address = localStorage.getItem("walletAddress")
    if (!address) {
      router.push("/")
      return
    }
    setWalletAddress(address)
    fetchData(address)
  }, [router])

  const handleWithdraw = async () => {
    if (!walletAddress || !withdrawAmount) return

    const amount = Number.parseFloat(withdrawAmount)
    if (isNaN(amount) || amount <= 0) {
      setError(t("member.withdraw.errors.invalidAmount"))
      return
    }

    if (amount > availableBalance + teamRewardsBalance) {
      setError(t("member.withdraw.errors.insufficientBalance"))
      return
    }
    // </CHANGE>

    const amountUSD = amount * ashvaPrice
    if (amountUSD < MIN_WITHDRAW_USD) {
      setError(
        `${t("member.withdraw.minAmount")}: $${MIN_WITHDRAW_USD} USD (≈ ${(MIN_WITHDRAW_USD / ashvaPrice).toFixed(2)} ASHVA)`,
      )
      return
    }

    setSubmitting(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          amount,
          ashvaPrice,
          burnRate, // 传递燃烧比例
        }),
      })
      // </CHANGE>

      const data = await res.json()

      if (res.ok) {
        setSuccess(t("member.withdraw.success"))
        setWithdrawAmount("")
        fetchData(walletAddress)
      } else {
        setError(data.error || t("member.withdraw.errors.failed"))
      }
    } catch (err) {
      setError(t("member.withdraw.errors.failed"))
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuickSelect = (percentage: number) => {
    const selectableBalance = teamRewardsBalance + availableBalance
    const amount = (selectableBalance * percentage) / 100
    // </CHANGE>
    setWithdrawAmount(amount.toFixed(2))
    setError("")
    if (amount * ashvaPrice < MIN_WITHDRAW_USD) {
      setError(
        `${t("member.withdraw.minAmount")}: $${MIN_WITHDRAW_USD} USD (≈ ${(MIN_WITHDRAW_USD / ashvaPrice).toFixed(2)} ASHVA)`,
      )
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "processing":
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusText = (status: string) => {
    return t(`member.withdraw.status.${status}`)
  }

  const usdValue = Number.parseFloat(withdrawAmount || "0") * ashvaPrice
  const burnAmount = Number.parseFloat(withdrawAmount || "0") * burnRate
  const actualReceived = Number.parseFloat(withdrawAmount || "0") - burnAmount
  // </CHANGE>

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">{t("member.withdraw.title")}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Balance Card */}
        <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-6 h-6 text-primary" />
            <span className="text-muted-foreground">{t("member.walletCenter.totalBalance")}</span>
          </div>
          <div className="text-3xl font-bold mb-2">{totalBalance.toFixed(2)} ASHVA</div>
          <div className="text-sm text-muted-foreground mb-4">≈ ${(totalBalance * ashvaPrice).toFixed(2)} USD</div>

          {/* Balance breakdown */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("member.walletCenter.teamRewards")}</span>
              <span className="font-medium">{teamRewardsBalance.toFixed(2)} ASHVA</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                {t("member.withdraw.availableBalance")}
              </span>
              <span className="font-medium text-green-500">{availableBalance.toFixed(2)} ASHVA</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Snowflake className="w-3 h-3 text-blue-400" />
                {t("member.withdraw.frozenBalance")}
              </span>
              <span className="font-medium text-blue-400">{frozenBalance.toFixed(2)} ASHVA</span>
            </div>
            {/* </CHANGE> */}
          </div>

          <div className="space-y-2">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Snowflake className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-medium text-blue-400 mb-1">{t("member.withdraw.freezeRule")}</p>
                  <p className="text-muted-foreground">{t("member.withdraw.freezeRuleDesc")}</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Flame className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-medium text-orange-400 mb-1">{t("member.withdraw.burnRule")}</p>
                  <p className="text-muted-foreground">{t("member.withdraw.burnRuleDesc")}</p>
                </div>
              </div>
            </div>
          </div>
          {/* </CHANGE> */}
        </Card>

        {/* Withdraw Form */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            {t("member.withdraw.applyWithdraw")}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">{t("member.withdraw.amount")} (ASHVA)</label>
              <Input
                type="number"
                placeholder={t("member.withdraw.amountPlaceholder")}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="text-lg"
              />
              {withdrawAmount && (
                <div className="mt-2 space-y-1 text-sm">
                  <div className="text-muted-foreground">≈ ${usdValue.toFixed(2)} USD</div>
                  {burnRate > 0 && (
                    <>
                      <div className="flex items-center justify-between text-orange-400">
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          {t("member.withdraw.burnRate")}:
                        </span>
                        <span>{(burnRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-orange-400">
                        <span>{t("member.withdraw.burnAmount")}:</span>
                        <span>{burnAmount.toFixed(2)} ASHVA</span>
                      </div>
                      <div className="flex items-center justify-between font-medium text-green-500 pt-1 border-t">
                        <span>{t("member.withdraw.actualReceived")}:</span>
                        <span>{actualReceived.toFixed(2)} ASHVA</span>
                      </div>
                    </>
                  )}
                  {/* </CHANGE> */}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleQuickSelect(25)}>
                25%
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickSelect(50)}>
                50%
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickSelect(75)}>
                75%
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickSelect(100)}>
                {t("common.all")}
              </Button>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              {t("member.withdraw.minAmount")}：$10 USD{" "}
              {ashvaPrice > 0 && `(≈ ${(MIN_WITHDRAW_USD / ashvaPrice).toFixed(2)} ASHVA)`}
            </div>

            {error && <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}

            {success && <div className="p-3 bg-green-500/10 text-green-500 rounded-lg text-sm">{success}</div>}

            <Button
              className="w-full"
              onClick={handleWithdraw}
              disabled={submitting || !withdrawAmount || usdValue < MIN_WITHDRAW_USD}
            >
              {submitting ? t("member.withdraw.submitting") : t("member.withdraw.submit")}
            </Button>
          </div>
        </Card>

        {/* Withdraw Records */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">{t("member.withdraw.records")}</h3>

          {records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t("member.withdraw.noRecords")}</div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(record.status)}
                    <div>
                      <div className="font-medium">{Number.parseFloat(record.amount).toFixed(2)} ASHVA</div>
                      <div className="text-xs text-muted-foreground">
                        ${Number.parseFloat(record.amount_usd).toFixed(2)} USD
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{getStatusText(record.status)}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(record.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </main>
  )
}
