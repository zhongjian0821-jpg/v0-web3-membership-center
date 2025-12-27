"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Check, X, ArrowLeft, Info } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

export default function ReferralPage() {
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
        setHasReferrer(data.hasParent)
        setExistingReferrer(data.parentWallet || "")
      }
    } catch (error) {
      console.error("Error checking referral status:", error)
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
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{t("member.referral.title")}</h1>
            <p className="text-xs text-muted-foreground">
              {currentAddress.slice(0, 6)}...{currentAddress.slice(-4)}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Status Card */}
        {hasReferrer ? (
          <Card className="p-4 border-green-500/50 bg-green-500/10">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20">
                <Check className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-500 mb-1">{t("member.referral.alreadyHasReferrer")}</h3>
                <p className="text-sm text-muted-foreground mb-2">{t("member.referral.currentReferrer")}:</p>
                <Badge variant="secondary" className="font-mono text-xs">
                  {existingReferrer.slice(0, 10)}...{existingReferrer.slice(-8)}
                </Badge>
              </div>
            </div>
          </Card>
        ) : success ? (
          <Card className="p-6 border-green-500/50 bg-green-500/10 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-500 mb-1">{t("member.referral.success")}</h3>
                <p className="text-sm text-muted-foreground">{t("member.referral.redirecting")}</p>
              </div>
            </div>
          </Card>
        ) : (
          <>
            {/* Info Card */}
            <Card className="p-4 border-blue-500/20 bg-blue-500/5">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-500 mb-2">{t("member.referral.whyNeedReferrer")}</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      <span>{t("member.referral.benefit1")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      <span>{t("member.referral.benefit2")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      <span>{t("member.referral.benefit3")}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Input Card */}
            <Card className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{t("member.referral.enterReferrer")}</h3>
                  <p className="text-xs text-muted-foreground">{t("member.referral.description")}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">{t("member.referral.referrerAddress")}</label>
                  <Input
                    type="text"
                    placeholder="0x..."
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
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    <X className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={loading || !referralAddress.trim()}
                  className="w-full"
                  size="lg"
                >
                  {loading ? t("common.submitting") : t("member.referral.submit")}
                </Button>
              </div>
            </Card>

            {/* Tips Card */}
            <Card className="p-4 bg-muted/50">
              <h4 className="font-semibold text-sm mb-3">{t("member.referral.tips")}</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">1.</span>
                  <span>{t("member.referral.tip1")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">2.</span>
                  <span>{t("member.referral.tip2")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">3.</span>
                  <span>{t("member.referral.tip3")}</span>
                </li>
              </ul>
            </Card>
          </>
        )}
      </div>
    </main>
  )
}
