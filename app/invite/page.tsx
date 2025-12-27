"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useTranslation } from "@/lib/i18n/context"
import { CheckCircle2, XCircle, AlertCircle, ArrowLeft, UserPlus, Info } from "lucide-react"

const SYSTEM_DEFAULT_SUFFIX = "00000000001" // 11个字符的尾号

export default function InvitePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [currentAddress, setCurrentAddress] = useState<string>("")
  const [referrerAddress, setReferrerAddress] = useState<string>("")
  const [existingReferrer, setExistingReferrer] = useState<string | null>(null)
  const [isSystemDefault, setIsSystemDefault] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [checking, setChecking] = useState<boolean>(true)

  useEffect(() => {
    console.log("[v0] Invite page: Checking localStorage for wallet address")
    const address = localStorage.getItem("walletAddress")
    console.log("[v0] Invite page: Found address:", address)

    if (address) {
      setCurrentAddress(address)
      checkExistingReferrer(address)
    } else {
      console.log("[v0] Invite page: No wallet found, redirecting to home")
      setTimeout(() => {
        router.push("/")
      }, 100)
    }
  }, [router])

  // 检查是否已有邀请人
  const checkExistingReferrer = async (address: string) => {
    console.log("[v0] Invite page: Checking existing referrer for:", address)
    try {
      const response = await fetch(`/api/wallet/referral-status?address=${address}`)
      const data = await response.json()
      console.log("[v0] Invite page: Referral status:", data)

      if (data.hasParent && data.parentWallet) {
        setExistingReferrer(data.parentWallet)

        const parentLower = data.parentWallet.toLowerCase()
        const isDefault = parentLower.endsWith(SYSTEM_DEFAULT_SUFFIX.toLowerCase())

        console.log("[v0] Parent wallet (lowercase):", parentLower)
        console.log("[v0] Checking if ends with:", SYSTEM_DEFAULT_SUFFIX.toLowerCase())
        console.log("[v0] Is system default referrer:", isDefault)

        setIsSystemDefault(isDefault)
      } else {
        console.log("[v0] No parent wallet found")
        setIsSystemDefault(false)
      }
    } catch (err) {
      console.error("[v0] Invite page: Error checking referrer:", err)
      setIsSystemDefault(false)
    } finally {
      setChecking(false)
    }
  }

  // 验证地址格式
  const isValidAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  // 提交邀请人地址
  const handleSubmit = async () => {
    console.log("[v0] Invite page: Submitting referrer:", referrerAddress)
    setError("")
    setSuccess(false)

    // 验证地址格式
    if (!isValidAddress(referrerAddress)) {
      setError(t("member.referral.invalidAddress"))
      return
    }

    // 验证不能是自己
    if (referrerAddress.toLowerCase() === currentAddress.toLowerCase()) {
      setError(t("member.referral.cannotReferSelf"))
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/wallet/update-referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: currentAddress,
          referrerAddress: referrerAddress,
        }),
      })

      const data = await response.json()
      console.log("[v0] Invite page: Update response:", data)

      if (response.ok && data.success) {
        setSuccess(true)
        setExistingReferrer(referrerAddress)
        setIsSystemDefault(false)
        setTimeout(() => {
          router.push("/member")
        }, 2000)
      } else {
        if (data.error === "Referral already set") {
          setError(t("member.referral.alreadySet"))
        } else {
          setError(data.message || t("member.referral.updateFailed"))
        }
      }
    } catch (err) {
      console.error("[v0] Invite page: Error updating referrer:", err)
      setError(t("member.referral.updateFailed"))
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t("common.loading")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/member")}
            className="gap-2 text-xs md:text-sm px-2 md:px-4"
          >
            <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">{t("common.back")}</span>
          </Button>
          <h1 className="text-base md:text-xl font-semibold truncate px-2">{t("member.referral.title")}</h1>
          <div className="w-12 md:w-20"></div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-2xl">
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">{t("member.referral.yourAddress")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-xs md:text-sm bg-muted p-2 md:p-3 rounded-lg break-all">
              {currentAddress}
            </div>
          </CardContent>
        </Card>

        {existingReferrer && isSystemDefault && (
          <Card className="mb-6 border-yellow-500/50 bg-yellow-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg flex items-center gap-2 text-yellow-600">
                <AlertCircle className="h-4 w-4 md:h-5 md:w-5" />
                系统默认邀请人
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-xs md:text-sm text-muted-foreground">
                  当前邀请人是系统默认地址，建议修改为真实的邀请人地址以获得更好的团队收益。
                </p>
                <div className="font-mono text-xs md:text-sm bg-background p-2 md:p-3 rounded-lg break-all border border-yellow-500/20">
                  {existingReferrer}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {existingReferrer && !isSystemDefault && (
          <Card className="mb-6 border-green-500/50 bg-green-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />
                {t("member.referral.alreadyHasReferrer")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-xs md:text-sm text-muted-foreground">{t("member.referral.existingReferrer")}:</p>
                <div className="font-mono text-xs md:text-sm bg-background p-2 md:p-3 rounded-lg break-all border border-green-500/20">
                  {existingReferrer}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(!existingReferrer || isSystemDefault) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <UserPlus className="h-4 w-4 md:h-5 md:w-5" />
                {isSystemDefault ? "修改邀请人地址" : t("member.referral.enterReferrer")}
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                {isSystemDefault ? "请输入真实的邀请人钱包地址替换系统默认地址" : t("member.referral.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-medium">{t("member.referral.referrerAddress")}</label>
                <Input
                  type="text"
                  placeholder={t("member.referral.placeholder")}
                  value={referrerAddress}
                  onChange={(e) => setReferrerAddress(e.target.value)}
                  className="font-mono text-xs md:text-sm"
                  disabled={loading}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs md:text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-500 bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-xs md:text-sm text-green-600">
                    {t("member.referral.successMessage")}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleSubmit}
                disabled={loading || !referrerAddress}
                className="w-full text-sm md:text-base"
                size="lg"
              >
                {loading ? t("common.submitting") : isSystemDefault ? "确认修改" : t("member.referral.submit")}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Info className="h-4 w-4 md:h-5 md:w-5" />
              {t("member.referral.whyNeedReferrer")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            <ul className="space-y-2 md:space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs md:text-sm">{t("member.referral.benefit1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs md:text-sm">{t("member.referral.benefit2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs md:text-sm">{t("member.referral.benefit3")}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mt-6 border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-4 w-4 md:h-5 md:w-5" />
              {t("member.referral.tips")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 font-bold">•</span>
                <span>{t("member.referral.tip1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 font-bold">•</span>
                <span>{t("member.referral.tip2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 font-bold">•</span>
                <span>{t("member.referral.tip3")}</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
