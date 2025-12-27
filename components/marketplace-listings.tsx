"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Cloud, Cpu, HardDrive, Network, ShoppingCart, AlertCircle } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

interface MarketplaceListing {
  id: string
  nodeId: string
  seller: string
  price: number
  description: string
  createdAt: string
  specs: {
    cpu: number
    memory: number
    storage: number
  }
  performance: {
    uptime: number
    earnings: string
  }
}

interface MarketplaceListingsProps {
  walletAddress: string
}

export function MarketplaceListings({ walletAddress }: MarketplaceListingsProps) {
  const [listings, setListings] = useState<MarketplaceListing[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    fetchMarketplaceListings()
  }, [])

  const fetchMarketplaceListings = async () => {
    try {
      const response = await fetch("/api/transfer/marketplace")
      const data = await response.json()
      setListings(data.listings || [])
    } catch (error) {
      console.error("[v0] Error fetching marketplace:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (listingId: string, price: number) => {
    if (!confirm(t("market.marketplace.confirmPurchase").replace("{price}", price.toString()))) return

    setPurchasing(listingId)

    try {
      const response = await fetch("/api/transfer/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          buyerAddress: walletAddress,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(t("market.marketplace.purchaseSuccess"))
        fetchMarketplaceListings()
      } else {
        alert(data.error || t("market.marketplace.purchaseFailed"))
      }
    } catch (error) {
      console.error("[v0] Purchase error:", error)
      alert(t("market.marketplace.purchaseFailed"))
    } finally {
      setPurchasing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <Card className="p-8 text-center">
        <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">{t("market.marketplace.noListings")}</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Alert className="border-blue-500/20 bg-blue-500/5">
        <AlertCircle className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-sm leading-relaxed">{t("market.marketplace.alert")}</AlertDescription>
      </Alert>

      {listings.map((listing) => (
        <Card key={listing.id} className="p-4 border-primary/20">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold">{listing.nodeId}</p>
                <p className="text-xs text-muted-foreground">
                  {t("market.marketplace.seller")}: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                </p>
              </div>
            </div>
            <Badge className="bg-green-500">{t("market.marketplace.forSale")}</Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Cpu className="w-3 h-3" />
              <span>
                {listing.specs.cpu} {t("common.cores")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Network className="w-3 h-3" />
              <span>{listing.specs.memory} GB</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <HardDrive className="w-3 h-3" />
              <span>{listing.specs.storage} GB</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">{t("market.marketplace.uptime")}</p>
              <p className="font-semibold">{listing.performance.uptime}%</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">{t("market.marketplace.earnings")}</p>
              <p className="font-semibold text-primary">{listing.performance.earnings}</p>
            </div>
          </div>

          {listing.description && (
            <p className="text-sm text-muted-foreground mb-4 text-pretty">{listing.description}</p>
          )}

          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{t("market.marketplace.transferPrice")}</p>
              <p className="text-2xl font-bold text-primary">{listing.price} ASHVA</p>
            </div>
            <Button
              onClick={() => handlePurchase(listing.id, listing.price)}
              disabled={purchasing === listing.id}
              size="lg"
            >
              {purchasing === listing.id ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  {t("market.marketplace.processing")}
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {t("market.marketplace.buyNow")}
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            {t("market.marketplace.listingTime")}: {listing.createdAt}
          </p>
        </Card>
      ))}
    </div>
  )
}
