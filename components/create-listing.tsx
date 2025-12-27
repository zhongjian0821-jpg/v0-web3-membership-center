"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, DollarSign, AlertCircle } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

interface CreateListingProps {
  walletAddress: string
  nodeId: string
  onClose: () => void
  onSuccess: () => void
}

export function CreateListing({ walletAddress, nodeId, onClose, onSuccess }: CreateListingProps) {
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const { t } = useTranslation()

  const handleSubmit = async () => {
    if (!price || Number.parseFloat(price) <= 0) {
      setError(t("market.createListing.errorInvalidPrice"))
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/transfer/create-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          nodeId,
          price: Number.parseFloat(price),
          description,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess()
      } else {
        setError(data.error || t("market.createListing.errorCreateFailed"))
      }
    } catch (err) {
      console.error("[v0] Create listing error:", err)
      setError(t("market.createListing.errorCreateFailed"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 relative">
        <Button variant="ghost" size="sm" onClick={onClose} className="absolute top-4 right-4">
          <X className="w-4 h-4" />
        </Button>

        <h2 className="text-xl font-bold mb-4">{t("market.createListing.title")}</h2>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="nodeId" className="text-sm">
              {t("market.createListing.nodeId")}
            </Label>
            <Input id="nodeId" value={nodeId} disabled className="bg-muted" />
          </div>

          <div>
            <Label htmlFor="price" className="text-sm">
              {t("market.createListing.price")}
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <Input
                id="price"
                type="number"
                placeholder={t("market.createListing.pricePlaceholder")}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                step="0.01"
                min="0"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("market.createListing.priceNote")}</p>
          </div>

          <div>
            <Label htmlFor="description" className="text-sm">
              {t("market.createListing.description")}
            </Label>
            <Textarea
              id="description"
              placeholder={t("market.createListing.descPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none mt-1"
            />
          </div>

          <Alert className="bg-blue-500/5 border-blue-500/20">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-sm leading-relaxed">{t("market.createListing.alert")}</AlertDescription>
          </Alert>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent" disabled={isSubmitting}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  {t("market.createListing.submitting")}
                </>
              ) : (
                t("market.createListing.submit")
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
