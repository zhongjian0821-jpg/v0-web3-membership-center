"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Cloud, Server, Info, Loader2, Users } from "lucide-react"
import CloudNodePurchaseStandalone from "@/components/cloud-node-purchase-standalone"
import ImageNodePurchaseStandalone from "@/components/image-node-purchase-standalone"
import { useTranslation } from "@/lib/i18n/context"

export default function PurchasePage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedAddress = localStorage.getItem("walletAddress")
    console.log("[v0] Purchase page loaded, wallet address:", storedAddress)

    if (storedAddress) {
      setWalletAddress(storedAddress)
    }
    setIsLoading(false)
  }, [])

  const handleBackToLogin = () => {
    localStorage.setItem("justLoggedOut", "true")
    localStorage.removeItem("walletAddress")
    router.push("/")
  }

  const handleLogout = () => {
    localStorage.setItem("justLoggedOut", "true")
    localStorage.removeItem("walletAddress")
    localStorage.removeItem("ashvaBalance")
    // Clear wagmi cache
    if (typeof window !== "undefined") {
      const wagmiKeys = Object.keys(localStorage).filter(
        (key) => key.startsWith("wagmi.") || key.startsWith("wc@2") || key.startsWith("@w3m"),
      )
      wagmiKeys.forEach((key) => localStorage.removeItem(key))
    }
    router.push("/")
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </div>
      </main>
    )
  }

  if (!walletAddress) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-bold mb-4">{t("purchase.notConnected")}</h2>
          <p className="text-muted-foreground mb-6">{t("purchase.pleaseConnect")}</p>
          <Button onClick={handleBackToLogin} className="w-full">
            {t("purchase.backToLogin")}
          </Button>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/member")}
              className="text-white hover:bg-white/20 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-2xl font-bold truncate">{t("purchase.title")}</h1>
              <p className="text-xs md:text-sm opacity-90 truncate">{t("purchase.selectType")}</p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/invite")}
              className="gap-1 text-xs md:text-sm h-8 md:h-9 px-2 md:px-4"
            >
              <Users className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">{t("member.referral.title")}</span>
              <span className="sm:hidden">{t("member.referral.invite")}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-1 text-xs md:text-sm h-8 md:h-9 px-2 md:px-4 bg-transparent"
            >
              <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">{t("common.logout")}</span>
              <span className="sm:hidden">{t("common.exit")}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="px-3 md:px-4 mt-4 md:mt-6">
        {/* Info Card */}
        <Card className="p-3 md:p-4 mb-4 md:mb-6 border-blue-500/20 bg-blue-500/5">
          <div className="flex gap-2 md:gap-3">
            <Info className="w-4 h-4 md:w-5 md:h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs md:text-sm text-pretty leading-relaxed">
              <p className="font-semibold mb-1">{t("purchase.cloudNode.title")}</p>
              <p className="text-muted-foreground">{t("purchase.cloudNode.subtitle")}</p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="image" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="cloud" className="gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-2.5">
              <Cloud className="w-3 h-3 md:w-4 md:h-4" />
              <span className="truncate">{t("purchase.cloudNode.title")}</span>
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-2.5">
              <Server className="w-3 h-3 md:w-4 md:h-4" />
              <span className="truncate">{t("purchase.imageNode.title")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cloud" className="mt-4 md:mt-6">
            <CloudNodePurchaseStandalone walletAddress={walletAddress} />
          </TabsContent>

          <TabsContent value="image" className="mt-4 md:mt-6">
            <ImageNodePurchaseStandalone walletAddress={walletAddress} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="grid grid-cols-4 gap-1 py-2.5 px-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-col h-auto gap-1 px-1"
            onClick={() => router.push("/member")}
          >
            <span className="text-[11px] leading-tight text-center">{t("nav.member")}</span>
          </Button>
          <Button variant="default" size="sm" className="flex-col h-auto gap-1 px-1">
            <span className="text-[11px] leading-tight text-center">{t("nav.purchase")}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-col h-auto gap-1 px-1"
            onClick={() => router.push("/nodes")}
          >
            <span className="text-[11px] leading-tight text-center">{t("nav.nodes")}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-col h-auto gap-1 px-1"
            onClick={() => router.push("/transfer")}
          >
            <span className="text-[11px] leading-tight text-center">{t("nav.transfer")}</span>
          </Button>
        </div>
      </nav>
    </main>
  )
}
