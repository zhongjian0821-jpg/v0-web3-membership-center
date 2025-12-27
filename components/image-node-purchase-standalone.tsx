"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle, Server, Check } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"
import type { Address } from "viem"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ImageNodePurchaseProps {
  walletAddress: string
}

const FIXED_PRICE_USD = 100 // 固定价格 100 USDT
const MACHINE_RIGHTS = 10 // 10 个机器配置权

export default function ImageNodePurchaseStandalone({ walletAddress }: ImageNodePurchaseProps) {
  const { t } = useTranslation()

  const [ashvaPrice, setAshvaPrice] = useState(0)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/ashva-price")
      .then((res) => res.json())
      .then((data) => {
        console.log("[v0] ASHVA price loaded:", data.price)
        setAshvaPrice(data.price)
      })
      .catch((err) => {
        console.error("[v0] Failed to load ASHVA price:", err)
        setError(t("purchase.priceLoadFailed"))
      })
  }, [t])

  const requiredASHVA = ashvaPrice > 0 ? Math.ceil(FIXED_PRICE_USD / ashvaPrice) : 0

  const handlePurchase = async () => {
    console.log("[v0] Opening purchase dialog for 10 machine rights")
    setShowDialog(true)
  }

  const confirmPurchase = async () => {
    console.log("[v0] Confirm purchase - 10 machine configuration rights")
    setIsPurchasing(true)
    setError("")

    try {
      if (ashvaPrice === 0) {
        throw new Error(t("purchase.priceLoadFailed") || "ASHVA price not loaded yet")
      }

      if (!walletAddress) {
        throw new Error(t("purchase.walletNotFound") || "Wallet not connected")
      }

      const currentRequiredASHVA = Math.ceil(FIXED_PRICE_USD / ashvaPrice)

      if (currentRequiredASHVA === 0) {
        throw new Error("Invalid ASHVA amount calculated")
      }

      const contractAddress = process.env.NEXT_PUBLIC_ASHVA_CONTRACT_ADDRESS as Address
      const recipientAddress = "0x1f307e4004eb5dfe7b00c39f9d697996c11f4704" as Address
      const amount = BigInt(Math.floor(currentRequiredASHVA * 1e18))

      console.log("[v0] ===== 镜像节点收款地址信息 =====")
      console.log("[v0] 硬编码收款地址 recipientAddress:", recipientAddress)
      console.log("[v0] ASHVA合约地址:", contractAddress)
      console.log("[v0] ================================")

      console.log("[v0] Payment details:", {
        priceUSD: FIXED_PRICE_USD,
        ashvaPrice,
        requiredASHVA: currentRequiredASHVA,
        amountWei: amount.toString(),
        machineRights: MACHINE_RIGHTS,
      })

      let txHash: string
      try {
        const wagmiConfig = (window as any).__wagmiConfig

        if (wagmiConfig) {
          console.log("[v0] Using wagmi sendTransaction")
          const { sendTransaction } = await import("@wagmi/core")

          const result = await sendTransaction(wagmiConfig, {
            to: contractAddress,
            data: `0xa9059cbb${recipientAddress.slice(2).padStart(64, "0")}${amount.toString(16).padStart(64, "0")}` as `0x${string}`,
            value: BigInt(0),
          })

          txHash = result
        } else if (typeof window !== "undefined" && (window as any).ethereum) {
          console.log("[v0] Using window.ethereum")
          const ethereum = (window as any).ethereum

          const txHashResult = await ethereum.request({
            method: "eth_sendTransaction",
            params: [
              {
                from: walletAddress,
                to: contractAddress,
                data: `0xa9059cbb${recipientAddress.slice(2).padStart(64, "0")}${amount.toString(16).padStart(64, "0")}`,
                value: "0x0",
                gas: "0x186a0",
              },
            ],
          })
          txHash = txHashResult
        } else {
          throw new Error(t("purchase.walletNotFound") || "No wallet detected")
        }
      } catch (ethError: any) {
        console.error("[v0] Transaction error:", ethError)
        const errorMessage = ethError.message?.toLowerCase() || ""
        const errorCode = ethError.code

        if (
          errorMessage.includes("reject") ||
          errorMessage.includes("rejected") ||
          errorMessage.includes("denied") ||
          errorMessage.includes("cancel") ||
          errorMessage.includes("cancelled") ||
          errorMessage.includes("user declined") ||
          errorCode === 4001 ||
          errorCode === "ACTION_REJECTED"
        ) {
          console.log("[v0] User cancelled transaction")
          setIsPurchasing(false)
          setShowDialog(false)
          return // 静默返回，不显示错误
        }
        throw new Error(ethError.message || "Failed to send transaction")
      }

      console.log("[v0] Transaction sent:", txHash)

      const response = await fetch("/api/nodes/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          nodeType: "image",
          machineRights: MACHINE_RIGHTS,
          txHash,
          amount: currentRequiredASHVA,
          priceUSD: FIXED_PRICE_USD,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to record purchase")
      }

      setPurchaseSuccess(true)
      console.log("[v0] Purchase successful - 10 machine configuration rights granted!")
    } catch (err: any) {
      console.error("[v0] Purchase failed:", err)
      setError(err.message || t("purchase.failed"))
    } finally {
      setIsPurchasing(false)
      setShowDialog(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {purchaseSuccess && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-500">{t("purchase.success")}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-500/50 bg-red-500/10">
          <XCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-500">{error}</AlertDescription>
        </Alert>
      )}

      {/* Image Node Introduction Card */}
      <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-center gap-3 mb-4">
          <Server className="w-7 h-7 text-primary" />
          <div>
            <h2 className="text-xl font-bold">{t("purchase.imageNode.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("purchase.imageNode.intro")}</p>
          </div>
        </div>

        <p className="text-muted-foreground leading-relaxed mb-4">{t("purchase.imageNode.description")}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-background/50 p-4 rounded-lg">
            <div className="text-3xl font-bold text-primary mb-2">{MACHINE_RIGHTS}</div>
            <div className="text-sm font-medium mb-1">{t("purchase.imageNode.scalability")}</div>
            <div className="text-xs text-muted-foreground">{t("purchase.imageNode.scalabilityDesc")}</div>
          </div>
          <div className="bg-background/50 p-4 rounded-lg">
            <div className="text-3xl font-bold text-primary mb-2">∞</div>
            <div className="text-sm font-medium mb-1">{t("purchase.imageNode.lifetime")}</div>
            <div className="text-xs text-muted-foreground">{t("purchase.imageNode.lifetimeDesc")}</div>
          </div>
          <div className="bg-background/50 p-4 rounded-lg">
            <div className="text-3xl font-bold text-primary mb-2">24/7</div>
            <div className="text-sm font-medium mb-1">{t("purchase.imageNode.support")}</div>
            <div className="text-xs text-muted-foreground">{t("purchase.imageNode.supportDesc")}</div>
          </div>
        </div>
      </Card>

      {/* Package Info Card */}
      <Card className="p-6 border-primary/20">
        <div className="flex items-center gap-3 mb-6">
          <Server className="w-6 h-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">{t("purchase.imageNode.packageTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("purchase.imageNode.packageSubtitle")}</p>
          </div>
        </div>

        {/* Enhanced Benefit Description */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">{t("purchase.imageNode.benefit1")}</p>
              <p className="text-sm text-muted-foreground">{t("purchase.imageNode.benefit1Desc")}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">{t("purchase.imageNode.benefit2")}</p>
              <p className="text-sm text-muted-foreground">{t("purchase.imageNode.benefit2Desc")}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">{t("purchase.imageNode.benefit3")}</p>
              <p className="text-sm text-muted-foreground">{t("purchase.imageNode.benefit3Desc")}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">{t("purchase.imageNode.benefit4")}</p>
              <p className="text-sm text-muted-foreground">{t("purchase.imageNode.benefit4Desc")}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">{t("purchase.imageNode.benefit5")}</p>
              <p className="text-sm text-muted-foreground">{t("purchase.imageNode.benefit5Desc")}</p>
            </div>
          </div>
        </div>

        {/* Technical Requirements */}
        <div className="border-t pt-4 mb-4">
          <h4 className="font-semibold mb-3 text-sm">{t("purchase.imageNode.requirements")}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>{t("purchase.imageNode.req1")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>{t("purchase.imageNode.req2")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>{t("purchase.imageNode.req3")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>{t("purchase.imageNode.req4")}</span>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-semibold">{t("purchase.totalPrice")}:</span>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">${FIXED_PRICE_USD}</div>
              <div className="text-sm text-muted-foreground">≈ {requiredASHVA.toLocaleString()} ASHVA</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">{t("purchase.imageNode.oneTimePurchase")}</p>
        </div>
      </Card>

      {/* Purchase Button */}
      <Button
        onClick={handlePurchase}
        disabled={isPurchasing || purchaseSuccess || ashvaPrice === 0}
        className="w-full"
        size="lg"
      >
        {isPurchasing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t("purchase.processing")}
          </>
        ) : purchaseSuccess ? (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {t("purchase.purchased")}
          </>
        ) : (
          t("purchase.confirmPurchase")
        )}
      </Button>

      {/* Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("purchase.confirmTitle")}</DialogTitle>
            <DialogDescription>{t("purchase.imageNode.confirmDesc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-4">
            <div className="bg-primary/5 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{t("purchase.imageNode.machineRights")}:</span>
                <span className="font-bold text-primary">
                  {MACHINE_RIGHTS} {t("purchase.imageNode.machines")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">{t("purchase.totalPrice")}:</span>
                <span className="font-semibold">${FIXED_PRICE_USD}</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between">
                <span className="font-semibold">{t("purchase.paymentAmount")}:</span>
                <span className="font-bold text-primary">{requiredASHVA.toLocaleString()} ASHVA</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isPurchasing}>
              {t("common.cancel")}
            </Button>
            <Button onClick={confirmPurchase} disabled={isPurchasing}>
              {isPurchasing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("purchase.processing")}
                </>
              ) : (
                t("purchase.confirm")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
