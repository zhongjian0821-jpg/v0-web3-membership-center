"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Cloud, Cpu, HardDrive, Network, AlertCircle, Loader2, Check, RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useWallet } from "@/lib/wallet-provider"
import { useTranslation } from "@/lib/i18n/context"
import { parseUnits, formatUnits } from "viem"
import { useToast } from "@/hooks/use-toast"

const ASHVA_CONTRACT = "0xea75cb12bbe6232eb082b365f450d3fe06d02fb3"
const RECIPIENT_WALLET = "0x1f307E4004eB5dfE7B00C39F9d697996c11f4704"

const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const

interface CloudNodePurchaseProps {
  balance: string
  onPurchaseSuccess: (nodeId: string) => void
}

export function CloudNodePurchase({ balance: initialBalance, onPurchaseSuccess }: CloudNodePurchaseProps) {
  const [ashvaPrice, setAshvaPrice] = useState(0)
  const [cloudNodePriceASHVA, setCloudNodePriceASHVA] = useState(0)
  const [isLoadingPrice, setIsLoadingPrice] = useState(true)

  const [isPurchasing, setIsPurchasing] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [txHash, setTxHash] = useState("")
  const [nodeId, setNodeId] = useState("")

  const [isReady, setIsReady] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<string>("检查中...")

  const [balance, setBalance] = useState(initialBalance)
  const [decimals, setDecimals] = useState(18)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [isMounted, setIsMounted] = useState(false)

  const { toast } = useToast()
  const { address, isConnected, signer, provider } = useWallet()
  const { t } = useTranslation()

  const monthlyRevenue = 0.05
  const annualROI = cloudNodePriceASHVA > 0 ? ((monthlyRevenue * 12) / cloudNodePriceASHVA) * 100 : 0

  const hasInsufficientBalance = useMemo(() => {
    if (!balance || cloudNodePriceASHVA === 0) return false
    const numBalance = Number.parseFloat(balance)
    return numBalance < cloudNodePriceASHVA
  }, [balance, cloudNodePriceASHVA])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const timer = setTimeout(() => {
      setIsReady(true)
      console.log("[v0] Component ready, wallet status:", { isConnected, address, status })
    }, 500)
    return () => clearTimeout(timer)
  }, [isMounted, isConnected, address])

  useEffect(() => {
    if (!isMounted || !isReady || !address || !isConnected || !provider) {
      return
    }

    let isActive = true
    setIsLoadingBalance(true)

    const loadBalance = async () => {
      try {
        const balanceResult = await provider.getBalance(address)
        const decimalsResult = 18 // Assuming decimals for ASHVA token is 18
        if (isActive) {
          const dec = Number(decimalsResult)
          const bal = formatUnits(balanceResult as bigint, dec)
          setDecimals(dec)
          setBalance(bal)
          console.log("[v0] Balance loaded:", { balance: bal, decimals: dec })
        }
      } catch (error) {
        console.error("[v0] Error loading balance:", error)
        if (isActive) {
          setBalance("0")
        }
      } finally {
        if (isActive) {
          setIsLoadingBalance(false)
        }
      }
    }

    loadBalance()

    return () => {
      isActive = false
    }
  }, [isMounted, isReady, address, isConnected, provider])

  useEffect(() => {
    if (!isMounted) return

    if (status === "connecting") {
      setConnectionStatus("正在连接钱包...")
    } else if (status === "connected" && address) {
      setConnectionStatus(`已连接: ${address.slice(0, 6)}...${address.slice(-4)}`)
    } else if (status === "disconnected") {
      setConnectionStatus("钱包未连接")
    } else {
      setConnectionStatus(`状态: ${status}`)
    }

    console.log("[v0] Connection status changed:", { status, isConnected, address })
  }, [isMounted, status, isConnected, address])

  useEffect(() => {
    fetchASHVAPrice()
  }, [])

  const fetchASHVAPrice = async () => {
    try {
      setIsLoadingPrice(true)
      const response = await fetch("/api/ashva-price")
      const data = await response.json()
      if (data.price) {
        setAshvaPrice(data.price)
        const required = 20 / data.price
        setCloudNodePriceASHVA(required)
        console.log("[v0] ASHVA price loaded:", { priceUSD: data.price, requiredASHVA: required })
      }
    } catch (error) {
      console.error("[v0] Failed to fetch ASHVA price:", error)
      setAshvaPrice(0.00015)
      setCloudNodePriceASHVA(20 / 0.00015)
    } finally {
      setIsLoadingPrice(false)
    }
  }

  if (!isMounted) {
    return (
      <div className="space-y-6">
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>{t("common.loading")}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const handlePurchaseClick = () => {
    if (!isConnected || !address || status !== "connected") {
      console.log("[v0] Cannot purchase, wallet not properly connected:", { isConnected, address, status })
      toast({
        variant: "destructive",
        title: t("purchase.cloudNode.walletNotConnected"),
        description: t("purchase.cloudNode.returnToLogin"),
      })
      return
    }

    if (isLoadingPrice || cloudNodePriceASHVA === 0) {
      toast({
        variant: "default",
        title: t("common.loading"),
        description: t("common.pleaseWait"),
      })
      return
    }

    if (isLoadingBalance) {
      toast({
        variant: "default",
        title: t("common.loading"),
        description: t("common.pleaseWait"),
      })
      return
    }

    if (hasInsufficientBalance) {
      toast({
        variant: "destructive",
        title: t("purchase.cloudNode.insufficientBalanceTitle"),
        description: t("purchase.cloudNode.insufficientBalance")
          .replace("{required}", cloudNodePriceASHVA.toFixed(2))
          .replace("{balance}", balance),
      })
      return
    }

    setShowConfirmDialog(true)
  }

  const handleConfirmPurchase = async () => {
    setShowConfirmDialog(false)
    setIsPurchasing(true)

    try {
      if (!signer || !address) {
        throw new Error("钱包未连接")
      }

      const transferAmount = parseUnits(cloudNodePriceASHVA.toFixed(decimals), decimals)

      console.log("[v0] Initiating transfer:", {
        from: address,
        to: RECIPIENT_WALLET,
        amount: transferAmount.toString(),
      })

      toast({
        title: t("purchase.cloudNode.transactionSent"),
        description: t("purchase.cloudNode.confirmInWallet"),
      })

      const tx = await signer.sendTransaction({
        to: RECIPIENT_WALLET,
        value: transferAmount,
      })

      const hash = tx.hash

      console.log("[v0] Transaction sent:", hash)

      toast({
        title: t("purchase.cloudNode.waitingConfirm"),
        description: t("purchase.cloudNode.waitingConfirm"),
      })

      await provider.waitForTransaction(hash)
      console.log("[v0] Transaction confirmed")

      handleTransactionSuccess(hash)
    } catch (error: any) {
      console.error("Purchase error:", error)

      const errorMessage = error.message || String(error)
      const isUserRejection =
        error.code === "ACTION_REJECTED" ||
        error.code === 4001 ||
        errorMessage.includes("rejected") ||
        errorMessage.includes("denied") ||
        errorMessage.includes("User rejected") ||
        errorMessage.includes("User denied") ||
        errorMessage.includes("User cancelled") ||
        errorMessage.includes("Reject") ||
        errorMessage.includes("Cancel")

      if (isUserRejection) {
        toast({
          variant: "default",
          title: t("purchase.cloudNode.transactionCancelled"),
          description: t("purchase.cloudNode.transactionCancelledDesc"),
        })
      } else {
        toast({
          variant: "destructive",
          title: t("purchase.cloudNode.transactionFailed"),
          description: errorMessage.length > 100 ? t("purchase.cloudNode.transactionFailedDesc") : errorMessage,
        })
      }
      setIsPurchasing(false)
    }
  }

  const handleTransactionSuccess = async (txHash: string) => {
    setTxHash(txHash)

    try {
      const response = await fetch("/api/purchase/cloud-node", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          amountASHVA: cloudNodePriceASHVA,
          txHash: txHash,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setPurchaseSuccess(true)
        setNodeId(data.nodeId)
        onPurchaseSuccess(data.nodeId)

        toast({
          title: t("purchase.cloudNode.purchaseSuccess"),
          description: t("purchase.cloudNode.redirecting"),
        })

        setTimeout(() => {
          window.location.href = "/nodes"
        }, 3000)
      } else {
        toast({
          variant: "destructive",
          title: t("purchase.cloudNode.createFailed"),
          description: `${data.error}。${t("purchase.cloudNode.transferComplete").replace("{txHash}", txHash.slice(0, 10))}，${t("purchase.cloudNode.contactSupport")}`,
        })
      }
    } catch (error: any) {
      console.error("API error:", error)
      toast({
        variant: "destructive",
        title: t("purchase.cloudNode.createFailed"),
        description: `${t("purchase.cloudNode.transferComplete").replace("{txHash}", txHash.slice(0, 10))}，${t("purchase.cloudNode.contactSupport")}`,
      })
    } finally {
      setIsPurchasing(false)
    }
  }

  const refreshBalance = async () => {
    if (!address || !isConnected || !provider) {
      toast({
        title: t("purchase.cloudNode.cannotRefresh"),
        description: t("purchase.cloudNode.returnToLogin"),
        variant: "destructive",
      })
      return
    }

    setIsRefreshing(true)
    try {
      const balanceResult = await provider.getBalance(address)
      const decimalsResult = 18 // Assuming decimals for ASHVA token is 18

      const dec = Number(decimalsResult)
      const bal = formatUnits(balanceResult as bigint, dec)
      setDecimals(dec)
      setBalance(bal)

      toast({
        title: t("purchase.cloudNode.balanceUpdated"),
        description: t("purchase.cloudNode.currentBalance").replace(
          "{balance}",
          Number(bal).toLocaleString(undefined, { maximumFractionDigits: 2 }),
        ),
      })

      console.log("[v0] Balance refreshed:", { balance: bal, decimals: dec })
    } catch (error) {
      console.error("[v0] Error refreshing balance:", error)
      toast({
        title: t("purchase.cloudNode.refreshFailed"),
        description: t("purchase.cloudNode.cannotGetBalance"),
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      {purchaseSuccess && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-500">
            <div className="space-y-2">
              <div className="font-semibold">
                {t("purchase.cloudNode.purchaseSuccess")} {t("purchase.cloudNode.redirecting")}
              </div>
              <div className="text-xs space-y-1 opacity-90">
                {nodeId && (
                  <div>
                    {t("purchase.cloudNode.nodeId")}: {nodeId}
                  </div>
                )}
                {txHash && (
                  <a
                    href={`https://etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm"
                  >
                    {t("purchase.cloudNode.viewOnEtherscan")}
                  </a>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!isReady && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>{t("common.loading")}</AlertDescription>
        </Alert>
      )}

      {isReady && !isConnected && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <p className="font-semibold">{t("purchase.cloudNode.walletNotConnected")}</p>
            <p className="text-xs">状态: {connectionStatus}</p>
            <p className="text-xs">{t("purchase.cloudNode.returnToLogin")}</p>
          </AlertDescription>
        </Alert>
      )}

      {isConnected && address && !isLoadingBalance && !isLoadingPrice && hasInsufficientBalance && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t("purchase.cloudNode.insufficientBalance")
              .replace("{required}", cloudNodePriceASHVA.toFixed(2))
              .replace("{balance}", balance)}{" "}
            ASHVA
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">{t("purchase.cloudNode.title")}</h2>
            <p className="text-sm text-muted-foreground text-pretty">{t("purchase.cloudNode.subtitle")}</p>
          </div>
          <Badge className="bg-gradient-to-r from-primary to-accent text-white">推荐</Badge>
        </div>

        <div className="my-6">
          {isLoadingPrice ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-lg text-muted-foreground">{t("common.loading")}</span>
            </div>
          ) : (
            <>
              <div className="text-3xl font-bold text-primary mb-1">{cloudNodePriceASHVA.toFixed(2)} ASHVA</div>
              <p className="text-sm text-muted-foreground">
                ≈ $20 USDT
                <span className="text-xs font-mono ml-2">(${ashvaPrice.toFixed(8)}/ASHVA)</span>
              </p>
            </>
          )}
          <p className="text-sm text-muted-foreground mt-1">{t("purchase.cloudNode.oneTimePurchase")}</p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-sm">
            <Cpu className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">{t("purchase.cloudNode.cpu")}：</span>
            <span className="font-semibold">8 核心</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <HardDrive className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">{t("purchase.cloudNode.storage")}：</span>
            <span className="font-semibold">500 GB SSD</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Network className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">{t("purchase.cloudNode.memory")}：</span>
            <span className="font-semibold">16 GB RAM</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Cloud className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">{t("purchase.cloudNode.bandwidth")}：</span>
            <span className="font-semibold">{t("purchase.cloudNode.unlimitedTraffic")}</span>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span>{t("purchase.cloudNode.support")}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span>{t("purchase.cloudNode.autoUpdate")}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span>{t("purchase.cloudNode.uptime")}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span>{t("purchase.cloudNode.instantDeployment")}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span>{t("purchase.cloudNode.transferable")}</span>
          </div>
        </div>
      </Card>

      <Card className="p-4 border-green-500/20 bg-green-500/5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Cloud className="w-4 h-4 text-green-500" />
          {t("purchase.cloudNode.estimatedRewards")}
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("purchase.cloudNode.monthlyRewards")}：</span>
            <span className="font-bold text-green-500">{monthlyRevenue} ASHVA</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("purchase.cloudNode.yearlyRewards")}：</span>
            <span className="font-bold text-green-500">{(monthlyRevenue * 12).toFixed(2)} ASHVA</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("purchase.cloudNode.rewardsROI")}：</span>
            <span className="font-bold text-green-500">{annualROI.toFixed(1)}%</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">* {t("purchase.cloudNode.rewardsNote")}</p>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm leading-relaxed space-y-2">
          <p className="font-semibold">
            {t("purchase.cloudNode.paymentInfo").replace(
              "{amount}",
              isLoadingPrice ? "..." : cloudNodePriceASHVA.toFixed(2),
            )}
          </p>
          <p className="text-xs opacity-80">{t("purchase.cloudNode.ensureWallet")}</p>
          {!isReady && <p className="text-xs opacity-70">{t("common.loading")}</p>}
          {isReady && !isConnected && <p className="text-xs text-destructive font-semibold">{connectionStatus}</p>}
          {isReady && isConnected && address && (
            <>
              <p className="text-xs text-green-600 font-medium">
                ✓ {t("purchase.cloudNode.walletConnected")}: {address.slice(0, 6)}...{address.slice(-4)}
              </p>
              {balance && (
                <p className="text-xs text-green-600 font-medium">
                  ✓ {t("purchase.cloudNode.currentBalance")}: {balance} ASHVA
                </p>
              )}
            </>
          )}
        </AlertDescription>
      </Alert>

      <Button
        onClick={handlePurchaseClick}
        disabled={
          isPurchasing ||
          purchaseSuccess ||
          !isConnected ||
          !address ||
          status !== "connected" ||
          isLoadingPrice ||
          cloudNodePriceASHVA === 0 ||
          hasInsufficientBalance // Add balance check to disabled condition
        }
        className="w-full h-12 text-lg"
        size="lg"
      >
        {isPurchasing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            {t("common.loading")}
          </>
        ) : purchaseSuccess ? (
          <>
            <Check className="w-5 h-5 mr-2" />
            {t("purchase.cloudNode.purchaseSuccess")}
          </>
        ) : hasInsufficientBalance ? (
          <>
            <AlertCircle className="w-5 h-5 mr-2" />
            {t("purchase.cloudNode.insufficientBalanceTitle")}
          </>
        ) : (
          <>
            <Cloud className="w-5 h-5 mr-2" />
            {t("purchase.cloudNode.buyButton").replace("{amount}", cloudNodePriceASHVA.toFixed(2))}
          </>
        )}
      </Button>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("purchase.cloudNode.confirmPurchaseTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t("purchase.cloudNode.product")}：</span>
                <span className="font-semibold">{t("purchase.cloudNode.title")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("purchase.cloudNode.price")}：</span>
                <span className="font-semibold text-primary">{cloudNodePriceASHVA.toFixed(2)} ASHVA (≈ $20 USDT)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("purchase.cloudNode.yourWallet")}：</span>
                <span className="font-mono text-xs">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : t("purchase.cloudNode.unconnected")}
                </span>
              </div>
              {balance && (
                <div className="flex justify-between text-sm">
                  <span>{t("purchase.cloudNode.currentBalance")}：</span>
                  <span className="font-semibold">{balance} ASHVA</span>
                </div>
              )}
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <div className="text-sm">
                <p className="mb-2">{t("purchase.cloudNode.confirmActions")}</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                  <li>{t("purchase.cloudNode.action1").replace("{amount}", cloudNodePriceASHVA.toFixed(2))}</li>
                  <li>{t("purchase.cloudNode.action2")}</li>
                </ul>
                <p className="text-destructive mt-2 text-xs">{t("purchase.cloudNode.warning")}</p>
              </div>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleConfirmPurchase}>{t("confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isConnected && address ? (
        <Card className="p-6 bg-black/40 border-white/10">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full bg-green-500 animate-pulse`} />
                <p className="text-sm text-gray-400">
                  ✓ {t("purchase.cloudNode.walletConnected")}:{" "}
                  <span className="text-white">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshBalance}
                disabled={isRefreshing || isLoadingBalance}
                className="h-8 text-gray-400 hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="ml-2">{t("purchase.cloudNode.refreshBalance")}</span>
              </Button>
            </div>

            {isLoadingBalance ? (
              <p className="text-sm text-gray-400">
                <Loader2 className="h-4 w-4 inline animate-spin mr-2" />
                {t("common.loading")}
              </p>
            ) : (
              <p className="text-sm text-green-400">
                ✓ {t("purchase.cloudNode.currentBalance")}:{" "}
                {Number(balance).toLocaleString(undefined, { maximumFractionDigits: 2 })} ASHVA
              </p>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>{t("common.loading")}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}
