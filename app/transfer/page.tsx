"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MarketplaceListings } from "@/components/marketplace-listings"
import { MyListings } from "@/components/my-listings"
import { CreateListing } from "@/components/create-listing"
import { ArrowLeft, ShoppingCart, TrendingUp } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

export default function TransferPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nodeId = searchParams.get("nodeId")
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [showCreateListing, setShowCreateListing] = useState(false)
  const [showTab, setShowTab] = useState("marketplace")
  const { t } = useTranslation()

  useEffect(() => {
    const address = localStorage.getItem("walletAddress")
    if (!address) {
      router.push("/")
      return
    }
    setWalletAddress(address)

    // If nodeId is provided, show create listing modal
    if (nodeId) {
      setShowCreateListing(true)
    }
  }, [router, nodeId])

  if (!walletAddress) return null

  return (
    <main className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-r from-primary to-accent p-3 sm:p-6 text-white">
        <div className="flex items-center gap-2 sm:gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/member")}
            className="text-white hover:bg-white/20 shrink-0 h-8 w-8 sm:h-9 sm:w-9 p-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-bold truncate">{t("transferMarket.title")}</h1>
            <p className="text-xs sm:text-sm opacity-90 truncate">{t("transferMarket.subtitle")}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={showTab === "marketplace" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setShowTab("marketplace")}
            className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm h-9 sm:h-10 bg-white/10 hover:bg-white/20 text-white border-0"
          >
            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">{t("transferMarket.marketplace")}</span>
          </Button>
          <Button
            variant={showTab === "myListings" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setShowTab("myListings")}
            className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm h-9 sm:h-10 bg-white/10 hover:bg-white/20 text-white border-0"
          >
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">{t("transferMarket.myListings")}</span>
          </Button>
        </div>
      </div>

      <div className="px-4 py-4">
        {showTab === "marketplace" && <MarketplaceListings walletAddress={walletAddress} />}
        {showTab === "myListings" && <MyListings walletAddress={walletAddress} />}
      </div>

      {/* Create Listing Modal */}
      {showCreateListing && (
        <CreateListing
          walletAddress={walletAddress}
          nodeId={nodeId || ""}
          onClose={() => {
            setShowCreateListing(false)
            router.push("/transfer")
          }}
          onSuccess={() => {
            setShowCreateListing(false)
            router.push("/transfer")
          }}
        />
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="grid grid-cols-4 gap-0.5 py-2.5 px-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-col h-auto gap-0.5 px-1 py-1.5 min-w-0"
            onClick={() => router.push("/member")}
          >
            <span className="text-[11px] leading-tight text-center truncate w-full">{t("nav.member")}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-col h-auto gap-0.5 px-1 py-1.5 min-w-0"
            onClick={() => router.push("/purchase")}
          >
            <span className="text-[11px] leading-tight text-center truncate w-full">{t("nav.purchase")}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-col h-auto gap-0.5 px-1 py-1.5 min-w-0"
            onClick={() => router.push("/nodes")}
          >
            <span className="text-[11px] leading-tight text-center truncate w-full">{t("nav.nodes")}</span>
          </Button>
          <Button variant="default" size="sm" className="flex-col h-auto gap-0.5 px-1 py-1.5 min-w-0">
            <span className="text-[11px] leading-tight text-center truncate w-full">{t("nav.transfer")}</span>
          </Button>
        </div>
      </nav>
    </main>
  )
}
