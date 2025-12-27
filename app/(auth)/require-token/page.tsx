"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ExternalLink, Copy, Check, ArrowLeft } from "lucide-react"
import { useState } from "react"
import { useWallet } from "@/lib/wallet-provider"
import { useTranslation } from "@/lib/i18n/context"

const ASHVA_CONTRACT = "0xea75cb12bbe6232eb082b365f450d3fe06d02fb3"

export default function RequireTokenPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const walletAddress = searchParams.get("wallet")
  const [copied, setCopied] = useState(false)
  const { disconnect } = useWallet()
  const { t } = useTranslation()

  const copyContractAddress = async () => {
    try {
      await navigator.clipboard.writeText(ASHVA_CONTRACT)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleBackToLogin = () => {
    disconnect()
    localStorage.setItem("justLoggedOut", "true")
    localStorage.removeItem("walletAddress")
    router.push("/")
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 border-destructive/20">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-balance text-center">{t("requireToken.title")}</h1>
          <p className="text-muted-foreground text-sm mt-2 text-center">{t("requireToken.subtitle")}</p>
        </div>

        <div className="mb-6 p-6 bg-muted/50 border border-border rounded-lg">
          <h2 className="text-lg font-semibold mb-4">{t("requireToken.connectedWallet")}</h2>
          <div className="bg-background p-3 rounded border border-border">
            <code className="text-sm font-mono break-all">{walletAddress || t("common.unknownAddress")}</code>
          </div>
          <p className="text-sm text-destructive mt-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{t("requireToken.noTokens")}</span>
          </p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-blue-600">{t("requireToken.howToGet")}</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-sm font-bold shrink-0">
                1
              </span>
              <div>
                <p className="text-sm font-medium">{t("requireToken.step1")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("requireToken.step1Desc")}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-sm font-bold shrink-0">
                2
              </span>
              <div>
                <p className="text-sm font-medium">{t("requireToken.step2")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("requireToken.step2Desc")}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-sm font-bold shrink-0">
                3
              </span>
              <div>
                <p className="text-sm font-medium">{t("requireToken.step3")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("requireToken.step3Desc")}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-sm font-bold shrink-0">
                4
              </span>
              <div>
                <p className="text-sm font-medium">{t("requireToken.step4")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("requireToken.step4Desc")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-6 mb-6 border border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">{t("requireToken.contractAddress")}</h3>
            <button
              onClick={copyContractAddress}
              className="flex items-center gap-2 px-3 py-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" />
                  {t("requireToken.copied")}
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  {t("requireToken.copyAddress")}
                </>
              )}
            </button>
          </div>
          <div className="bg-background p-3 rounded border border-border">
            <code className="text-xs font-mono break-all">{ASHVA_CONTRACT}</code>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{t("requireToken.networkNote")}</p>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 mb-6">
          <h3 className="text-sm font-semibold mb-3 text-green-600">{t("requireToken.memberLevels")}</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 shrink-0"></div>
              <div>
                <p className="text-sm font-medium">{t("requireToken.normalMember")}</p>
                <p className="text-xs text-muted-foreground">{t("requireToken.normalDesc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 shrink-0"></div>
              <div>
                <p className="text-sm font-medium">{t("requireToken.globalPartner")}</p>
                <p className="text-xs text-muted-foreground">{t("requireToken.globalDesc")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleBackToLogin}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("requireToken.backToLogin")}
          </Button>

          <Button
            variant="outline"
            className="w-full bg-transparent"
            onClick={() => window.open("https://www.ashvacoin.dev", "_blank")}
          >
            {t("requireToken.visitWebsite")}
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-6">
          {t("requireToken.txNote")}
          <br />
          {t("requireToken.txNote2")}
        </p>
      </Card>
    </main>
  )
}
