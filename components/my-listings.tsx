"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Cloud, Cpu, HardDrive, Network, Trash2, AlertCircle } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

interface Listing {
  id: string
  nodeId: string
  price: number
  description: string
  status: "active" | "sold" | "cancelled"
  createdAt: string
  specs: {
    cpu: number
    memory: number
    storage: number
  }
}

interface MyListingsProps {
  walletAddress: string
}

export function MyListings({ walletAddress }: MyListingsProps) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()

  useEffect(() => {
    fetchMyListings()
  }, [walletAddress])

  const fetchMyListings = async () => {
    try {
      const response = await fetch(`/api/transfer/my-listings?address=${walletAddress}`)
      const data = await response.json()
      setListings(data.listings || [])
    } catch (error) {
      console.error("[v0] Error fetching listings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelListing = async (listingId: string) => {
    if (!confirm(t("market.myListings.confirmCancel"))) return

    try {
      const response = await fetch("/api/transfer/cancel-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, walletAddress }),
      })

      if (response.ok) {
        fetchMyListings()
      } else {
        alert(t("market.myListings.cancelFailed"))
      }
    } catch (error) {
      console.error("[v0] Cancel listing error:", error)
      alert(t("market.myListings.cancelFailed"))
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
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground mb-4">{t("market.myListings.noListings")}</p>
        <Button onClick={() => (window.location.href = "/nodes")}>{t("market.myListings.goToNodes")}</Button>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {listings.map((listing) => (
        <Card key={listing.id} className="p-4 border-primary/20">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold">{listing.nodeId}</p>
                <p className="text-xs text-muted-foreground">{t("market.myListings.cloudNode")}</p>
              </div>
            </div>
            <Badge
              className={
                listing.status === "active" ? "bg-green-500" : listing.status === "sold" ? "bg-blue-500" : "bg-gray-500"
              }
            >
              {t(`market.myListings.status.${listing.status}`)}
            </Badge>
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

          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg mb-4">
            <span className="text-sm text-muted-foreground">{t("market.myListings.transferPrice")}</span>
            <span className="text-xl font-bold text-primary">{listing.price} ASHVA</span>
          </div>

          {listing.description && (
            <p className="text-sm text-muted-foreground mb-4 text-pretty">{listing.description}</p>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t("market.myListings.createdTime")}: {listing.createdAt}
            </span>
            {listing.status === "active" && (
              <Button variant="destructive" size="sm" onClick={() => handleCancelListing(listing.id)}>
                <Trash2 className="w-3 h-3 mr-1" />
                {t("market.myListings.cancelListing")}
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
