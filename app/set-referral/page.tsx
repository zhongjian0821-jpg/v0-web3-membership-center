"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowLeft, UserPlus, Check, X, AlertCircle } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

export default function SetReferralPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [currentAddress, setCurrentAddress] = useState("")
  const [referralAddress, setReferralAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [hasReferrer, setHasReferrer] = useState(false)
  const [existingReferrer, setExistingReferrer] = useState("")

  useEffect(() => {
    const walletAddress = localStorage.getItem("walletAddress")
    if (!walletAddress) {
      router.push("/")
      return
    }

    setCurrentAddress(walletAddress)
    checkReferralStatus(walletAddress)
  }, [router])

  const checkReferralStatus = async (address: string) => {
    try {
      const response = await fetch(`/api/wallet/referral-status?address=${address}`)
      if (response.ok) {
        const data = await response.json()
        setHasReferrer(!!data.hasParent)
        setExistingReferrer(data.parent || "")
      }
    } catch (error) {
      console.error("[v0] Error checking referral status:", error)
    } finally {
      setCheckingStatus(false)
    }
  }

  const validateAddress = (address: string) => {
    if (!address.trim()) {
      return t("member.referral.enterAddress")
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return t("member.referral.invalidAddress")
    }
    if (address.toLowerCase() === currentAddress.toLowerCase()) {
      return t("member.referral.cannotReferSelf")
    }
    return null
  }

  const handleSubmit = async () => {
    const validationError = validateAddress(referralAddress)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/wallet/update-referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: currentAddress,
          referralAddress: referralAddress.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t("member.referral.updateFailed"))
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/member")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("member.referral.updateFailed"))
    } finally {
      setLoading(false)
    }
  }

  if (checkingStatus) {
    return (
      <main className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/member")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-bold">{t("member.referral.title")}</h1>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto mt-8">
        {/* Current Wallet Info */}
        <Card className="p-4 mb-6 bg-muted/50">
          <div className="text-sm text-muted-foreground mb-1">{t("member.yourAddress")}</div>
          <div className="font-mono text-sm break-all">{currentAddress}</div>
        </Card>

        {/* Success State */}
        {success && (
          <Card className="p-6 mb-6 border-green-500/50 bg-green-500/10 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-green-500 mb-1">{t("member.referral.success")}</h3>
                <p className="text-sm text-muted-foreground">{t("member.referral.successMessage")}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Already Has Referrer */}
        {hasReferrer && !success && (
          <Card className="p-6 mb-6 border-blue-500/50 bg-blue-500/10">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20 flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-500 mb-2">{t("member.referral.alreadyHasReferrer")}</h3>
                <p className="text-sm text-muted-foreground mb-2">{t("member.referral.existingReferrer")}:</p>
                <div className="font-mono text-xs bg-background/50 p-2 rounded break-all">{existingReferrer}</div>
              </div>
            </div>
          </Card>
        )}

        {/* Input Form */}
        {!hasReferrer && !success && (
          <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 flex-shrink-0">
                <UserPlus className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-lg mb-2">{t("member.referral.enterReferrer")}</h2>
                <p className="text-sm text-muted-foreground">{t("member.referral.description")}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t("member.referral.referrerAddress")}</label>
                <Input
                  type="text"
                  placeholder={t("member.referral.placeholder")}
                  value={referralAddress}
                  onChange={(e) => {
                    setReferralAddress(e.target.value)
                    setError("")
                  }}
                  disabled={loading}
                  className="font-mono"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded">
                  <X className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button onClick={handleSubmit} disabled={loading || !referralAddress.trim()} className="w-full" size="lg">
                {loading ? t("common.submitting") : t("member.referral.submit")}
              </Button>

              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
                <p className="font-semibold mb-1">💡 {t("member.referral.tips")}:</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>{t("member.referral.tip1")}</li>
                  <li>{t("member.referral.tip2")}</li>
                  <li>{t("member.referral.tip3")}</li>
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Info Card */}
        <Card className="p-4 mt-6 bg-muted/30">
          <h3 className="font-semibold text-sm mb-3">{t("member.referral.whyNeedReferrer")}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>{t("member.referral.benefit1")}</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>{t("member.referral.benefit2")}</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>{t("member.referral.benefit3")}</span>
            </li>
          </ul>
        </Card>
      </div>
    </main>
  )
}
