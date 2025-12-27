"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UserPlus, Check, X } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

interface ReferralInputCardProps {
  currentAddress: string
  onSubmit: () => void
}

export function ReferralInputCard({ currentAddress, onSubmit }: ReferralInputCardProps) {
  const { t } = useTranslation()
  const [referralAddress, setReferralAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

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
        onSubmit()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("member.referral.updateFailed"))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="p-4 mb-4 border-green-500/50 bg-green-500/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20">
            <Check className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-500">{t("member.referral.success")}</h3>
            <p className="text-sm text-muted-foreground">{t("member.referral.successMessage")}</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 mb-4 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
          <UserPlus className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{t("member.referral.title")}</h3>
          <p className="text-xs text-muted-foreground mb-3">{t("member.referral.description")}</p>

          <div className="space-y-2">
            <Input
              type="text"
              placeholder={t("member.referral.placeholder")}
              value={referralAddress}
              onChange={(e) => {
                setReferralAddress(e.target.value)
                setError("")
              }}
              className="text-sm"
              disabled={loading}
            />

            {error && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <X className="w-3 h-3" />
                <span>{error}</span>
              </div>
            )}

            <Button onClick={handleSubmit} disabled={loading || !referralAddress.trim()} className="w-full" size="sm">
              {loading ? t("common.submitting") : t("member.referral.submit")}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
