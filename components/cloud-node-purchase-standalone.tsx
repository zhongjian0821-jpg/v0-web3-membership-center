"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, CheckCircle2, AlertCircle, TrendingUp, Shield, Zap, Award, Info, Clock } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"
import type { Address } from "viem"

interface CloudNodePurchaseStandaloneProps {
  walletAddress: string
}

export default function CloudNodePurchaseStandalone({ walletAddress }: CloudNodePurchaseStandaloneProps) {
  const { t } = useTranslation()
  const [selectedConfig, setSelectedConfig] = useState<"min" | "rec" | "adv">("rec") // 默认选择推荐配置
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const [ashvaPrice, setAshvaPrice] = useState(0)

  useEffect(() => {
    fetch("/api/ashva-price")
      .then((res) => res.json())
      .then((data) => {
        console.log("[v0] Cloud node ASHVA price loaded:", data)
        setAshvaPrice(data.price || data.priceUSD || 0)
      })
      .catch((err) => {
        console.error("[v0] Failed to load ASHVA price:", err)
        setAshvaPrice(Number.parseFloat(process.env.NEXT_PUBLIC_ASHVA_PRICE || "0.00008425"))
      })
  }, [])

  const configurations = {
    min: { cpu: "4", memory: "8", storage: "100" },
    rec: { cpu: "8", memory: "16", storage: "200" },
    adv: { cpu: "16", memory: "32", storage: "500" },
  }

  const totalPrice = 2000 // Fixed price: 2000 USDT (updated from 20)
  const monthlyRevenueMin = 240
  const monthlyRevenueMax = 340
  const annualRevenueMin = monthlyRevenueMin * 12 // 2880 USDT
  const annualRevenueMax = monthlyRevenueMax * 12 // 4080 USDT
  const requiredASHVA = ashvaPrice > 0 ? Math.ceil(totalPrice / ashvaPrice) : 0

  const handleConfigSelect = (config: "min" | "rec" | "adv") => {
    setSelectedConfig(config)
  }

  const handlePurchase = () => {
    console.log("[v0] Cloud node purchase button clicked")
    setIsDialogOpen(true)
  }

  const handleConfirmPurchase = async () => {
    console.log("[v0] Confirming cloud node purchase")
    setIsPurchasing(true)
    setPurchaseError(null)

    try {
      if (!walletAddress) {
        throw new Error(t("purchase.walletNotFound") || "Wallet not connected. Please connect your wallet first.")
      }

      if (ashvaPrice <= 0) {
        throw new Error("ASHVA price not loaded. Please wait and try again.")
      }

      const currentRequiredASHVA = Math.ceil(totalPrice / ashvaPrice)

      if (currentRequiredASHVA <= 0) {
        throw new Error("Invalid token amount calculated. Please refresh and try again.")
      }

      const recipientAddress = "0x1f307e4004eb5dfe7b00c39f9d697996c11f4704" as Address
      const ashvaContractAddress = process.env.NEXT_PUBLIC_ASHVA_CONTRACT_ADDRESS as Address

      console.log("[v0] ===== 云节点收款地址信息 =====")
      console.log("[v0] 硬编码收款地址 recipientAddress:", recipientAddress)
      console.log("[v0] ASHVA合约地址:", ashvaContractAddress)
      console.log("[v0] ================================")

      if (!recipientAddress || !ashvaContractAddress) {
        throw new Error("Missing environment variables")
      }

      const tokenAmountWei = BigInt(Math.floor(currentRequiredASHVA * 1e18))

      console.log("[v0] Cloud node payment details:", {
        totalPrice,
        ashvaPrice,
        requiredASHVA: currentRequiredASHVA,
        tokenAmountWei: tokenAmountWei.toString(),
        recipientAddress,
      })

      console.log("[v0] Sending cloud node transaction")

      let txHash: string
      try {
        const wagmiConfig = (window as any).__wagmiConfig

        if (wagmiConfig) {
          console.log("[v0] Using wagmi sendTransaction")

          const { sendTransaction } = await import("@wagmi/core")

          const transferData = `0xa9059cbb${recipientAddress.slice(2).padStart(64, "0")}${tokenAmountWei.toString(16).padStart(64, "0")}`

          const result = await sendTransaction(wagmiConfig, {
            to: ashvaContractAddress,
            data: transferData as `0x${string}`,
            value: BigInt(0),
          })

          txHash = result
        } else if (typeof window !== "undefined" && (window as any).ethereum) {
          console.log("[v0] Using window.ethereum")
          const ethereum = (window as any).ethereum
          const transferData = `0xa9059cbb${recipientAddress.slice(2).padStart(64, "0")}${tokenAmountWei.toString(16).padStart(64, "0")}`

          const txHashResult = await ethereum.request({
            method: "eth_sendTransaction",
            params: [
              {
                from: walletAddress,
                to: ashvaContractAddress,
                data: transferData,
                value: "0x0",
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
          setIsDialogOpen(false)
          return // 静默返回，不抛出错误
        }
        throw new Error(ethError.message || "Failed to send transaction")
      }

      console.log("[v0] Cloud node transaction sent:", txHash)

      console.log("[v0] Calling API to record purchase...")
      const response = await fetch("/api/purchase/cloud-node", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          amountASHVA: currentRequiredASHVA,
          txHash,
        }),
      })

      console.log("[v0] API response status:", response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error("[v0] API error response:", error)
        throw new Error(error.error || "Failed to record purchase")
      }

      const result = await response.json()
      console.log("[v0] API success response:", result)

      setPurchaseSuccess(true)

      setTimeout(() => {
        setIsDialogOpen(false)
        setPurchaseSuccess(false)
        setIsPurchasing(false)
        window.location.reload()
      }, 2000)
    } catch (error: any) {
      console.error("[v0] Cloud node purchase error:", error)
      console.error("[v0] Error stack:", error.stack)
      setPurchaseError(error.message || "Purchase failed")
      setIsPurchasing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/20">
        <div className="flex items-start gap-3 mb-4">
          <Info className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2 text-emerald-500">购买后的完整流程</h3>
            <p className="text-sm text-muted-foreground mb-4">了解您购买云节点托管后系统会自动执行的操作</p>

            <div className="space-y-4">
              {/* 第一步：支付验证 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">区块链支付验证</h4>
                  <p className="text-sm text-muted-foreground">
                    系统验证您的交易哈希、金额和收款地址，等待区块链确认（约1分钟）
                  </p>
                </div>
              </div>

              {/* 第二步：创建节点 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">自动创建云节点</h4>
                  <p className="text-sm text-muted-foreground">
                    系统自动生成节点ID（CN-xxxxx），配置8核CPU/16GB内存/500GB存储，初始状态为"部署中"
                  </p>
                </div>
              </div>

              {/* 第三步：佣金分配 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">多层级佣金自动分配</h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p className="font-medium">根据您推荐人的会员等级自动分配佣金：</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        <strong>普通会员</strong>：直推3%，间推2%
                      </li>
                      <li>
                        <strong>市场合伙人</strong>：管理10层，总收益权10%（1层3%，2层2%，3层1.5%...）
                      </li>
                      <li>
                        <strong>全球合伙人</strong>：管理100层，总收益权5%（1层1%，2层0.5%，3-10层0.3%...）
                      </li>
                    </ul>
                    <p className="text-xs mt-2">佣金会实时更新到推荐人的钱包余额和总收益中</p>
                  </div>
                </div>
              </div>

              {/* 第四步：通知运营中心 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">通知运营中心部署</h4>
                  <p className="text-sm text-muted-foreground">系统发送webhook到运营中心，触发实际云服务器部署流程</p>
                </div>
              </div>

              {/* 第五步：节点运行 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                  5
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">
                    节点部署上线 <span className="text-emerald-500">（预计24小时内完成）</span>
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    运营中心收到通知后开始部署实际云服务器，完成后节点状态自动变为"运行中"，开始产生每日收益并记录到您的账户
                  </p>
                </div>
              </div>
            </div>

            {/* 关键特点 */}
            <div className="mt-6 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-start gap-2 mb-3 pb-3 border-b border-emerald-500/10">
                <Clock className="w-4 h-4 text-emerald-500 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">部署时间：预计24小时内</p>
                  <p className="text-xs text-muted-foreground">购买成功后，运营中心将在24小时内完成云服务器部署</p>
                </div>
              </div>
              <h4 className="font-semibold mb-2 text-sm">流程特点：</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>区块链交易验证</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>自动佣金分配</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>防止重复购买</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>实时收益记录</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold mb-2">{t("purchase.cloudNode.title")}</h3>
              <p className="text-muted-foreground">{t("purchase.cloudNode.blockchainDescription")}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">{t("purchase.cloudNode.benefit1Title")}</h4>
              <p className="text-sm text-muted-foreground">{t("purchase.cloudNode.benefit1Desc")}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">{t("purchase.cloudNode.benefit2Title")}</h4>
              <p className="text-sm text-muted-foreground">{t("purchase.cloudNode.benefit2Desc")}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">{t("purchase.cloudNode.benefit3Title")}</h4>
              <p className="text-sm text-muted-foreground">{t("purchase.cloudNode.benefit3Desc")}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{t("purchase.cloudNode.recommendedConfig")}</h3>
        <div className="grid gap-3">
          <Button
            variant={selectedConfig === "min" ? "default" : "outline"}
            className="justify-start text-left h-auto p-4"
            onClick={() => handleConfigSelect("min")}
          >
            <div className="flex-1">
              <div className="font-semibold">{t("purchase.cloudNode.minimumConfig")}</div>
              <div className="text-sm opacity-80">4 {t("purchase.cloudNode.cores")}, 8GB RAM, 100GB Storage</div>
            </div>
          </Button>
          <Button
            variant={selectedConfig === "rec" ? "default" : "outline"}
            className="justify-start text-left h-auto p-4"
            onClick={() => handleConfigSelect("rec")}
          >
            <div className="flex-1">
              <div className="font-semibold">{t("purchase.cloudNode.recommendedConfig")}</div>
              <div className="text-sm opacity-80">8 {t("purchase.cloudNode.cores")}, 16GB RAM, 200GB Storage</div>
            </div>
          </Button>
          <Button
            variant={selectedConfig === "adv" ? "default" : "outline"}
            className="justify-start text-left h-auto p-4"
            onClick={() => handleConfigSelect("adv")}
          >
            <div className="flex-1">
              <div className="font-semibold">{t("purchase.cloudNode.advancedConfig")}</div>
              <div className="text-sm opacity-80">16 {t("purchase.cloudNode.cores")}, 32GB RAM, 500GB Storage</div>
            </div>
          </Button>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
        <div className="flex items-start gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-500">{t("purchase.cloudNode.estimatedRevenue")}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t("purchase.cloudNode.revenueDescription")}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">{t("purchase.cloudNode.monthlyRevenue")}</div>
            <div className="text-2xl font-bold text-green-500">
              ${monthlyRevenueMin.toLocaleString()}-${monthlyRevenueMax.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{t("purchase.cloudNode.annualRevenue")}</div>
            <div className="text-2xl font-bold text-green-500">
              ${annualRevenueMin.toLocaleString()}-${annualRevenueMax.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">{t("purchase.cloudNode.actualRevenueMayVary")}</div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-muted-foreground">{t("purchase.totalPrice")}</div>
            <div className="text-3xl font-bold">${totalPrice.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground mt-1">≈ {requiredASHVA.toLocaleString()} ASHVA</div>
            <div className="text-xs text-green-500 mt-2">{t("purchase.cloudNode.oneTimePurchase")}</div>
          </div>
        </div>
        <Button onClick={handlePurchase} className="w-full" size="lg" disabled={totalPrice <= 0 || ashvaPrice <= 0}>
          {t("purchase.purchaseNow")}
        </Button>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("purchase.confirmPurchase")}</DialogTitle>
            <DialogDescription>{t("purchase.reviewDetails")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("purchase.cloudNode.cpuCores")}</span>
              <span className="font-medium">
                {configurations[selectedConfig].cpu} {t("purchase.cloudNode.cores")}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("purchase.cloudNode.memorySize")}</span>
              <span className="font-medium">{configurations[selectedConfig].memory} GB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("purchase.cloudNode.hardDriveSize")}</span>
              <span className="font-medium">{configurations[selectedConfig].storage} GB</span>
            </div>
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between">
                <span className="font-semibold">{t("purchase.totalPrice")}</span>
                <div className="text-right">
                  <div className="font-bold">${totalPrice.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">{requiredASHVA.toLocaleString()} ASHVA</div>
                </div>
              </div>
            </div>
          </div>

          {purchaseError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-500">{purchaseError}</p>
            </div>
          )}

          {purchaseSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-500">{t("purchase.success")}</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isPurchasing}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleConfirmPurchase} disabled={isPurchasing}>
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
