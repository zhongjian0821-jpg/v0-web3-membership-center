"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import {
  Cpu,
  Network,
  HardDrive,
  Info,
  TrendingUp,
  CheckCircle2,
  Download,
  Terminal,
  Settings,
  Play,
  Copy,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { StakingAgreement } from "@/components/staking-agreement"
import { ethers } from "ethers"
import { useTranslation } from "@/lib/i18n/context"

interface ImageNodePurchaseProps {
  walletAddress: string
}

export default function ImageNodePurchase({ walletAddress }: ImageNodePurchaseProps) {
  const { toast } = useToast()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const dialogOpenedRef = useRef(false)
  const [specs, setSpecs] = useState({ cpu: "", memory: "", storage: "" })
  const [estimatedRevenue, setEstimatedRevenue] = useState(0)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [agreementAccepted, setAgreementAccepted] = useState(false)
  const [ashvaPrice, setAshvaPrice] = useState(0)
  const [userBalance, setUserBalance] = useState(0)
  const [isLoadingPrice, setIsLoadingPrice] = useState(true)
  const [copiedStep, setCopiedStep] = useState<string | null>(null)
  const { t } = useTranslation("common")

  const purchaseAmountUSD = 1
  const lockPeriodDays = 180

  const unlockDate = new Date()
  unlockDate.setDate(unlockDate.getDate() + lockPeriodDays)

  useEffect(() => {
    fetchASHVAPrice()
  }, [])

  const fetchASHVAPrice = async () => {
    try {
      const response = await fetch("/api/ashva-price")
      const data = await response.json()
      if (data.price) {
        setAshvaPrice(data.price)
        const required = Math.ceil(purchaseAmountUSD / data.price)
        setRequiredASHVA(required)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch ASHVA price:", error)
    } finally {
      setIsLoadingPrice(false)
    }
  }

  const calculateRevenue = () => {
    const cpuCores = Number.parseInt(specs.cpu) || 0
    const memory = Number.parseInt(specs.memory) || 0
    const storage = Number.parseInt(specs.storage) || 0

    const monthly = cpuCores * 5 + memory * 2 + storage * 0.5
    setEstimatedRevenue(monthly)
  }

  const handlePurchase = () => {
    console.log("[v0] Purchase button clicked")
    console.log("[v0] Current specs:", specs)
    console.log("[v0] Button enabled state:", {
      isPurchasing,
      purchaseSuccess,
      hasCpu: specs.cpu !== "",
      hasMemory: specs.memory !== "",
      hasStorage: specs.storage !== "",
    })

    if (!specs.cpu || !specs.memory || !specs.storage) {
      toast({
        title: t("complete_server_config"),
        description: t("fill_cpu_memory_storage"),
        variant: "destructive",
      })
      return
    }

    console.log("[v0] Opening confirmation dialog, current state:", showConfirmDialog)
    dialogOpenedRef.current = true
    setShowConfirmDialog(true)
    console.log("[v0] Dialog state set to true")
  }

  useEffect(() => {
    console.log("[v0] Dialog state changed:", showConfirmDialog)
    if (dialogOpenedRef.current && !showConfirmDialog && !isPurchasing && !purchaseSuccess) {
      console.log("[v0] Dialog was closed unexpectedly, reopening...")
      setShowConfirmDialog(true)
    }
  }, [showConfirmDialog, isPurchasing, purchaseSuccess])

  const executePaymentTransfer = async (): Promise<string> => {
    console.log("[v0] Starting payment transfer...")

    const provider = window.ethereum

    if (!provider) {
      console.log("[v0] No wallet provider found")
      throw new Error(t("install_metamask_okx_wallet"))
    }

    try {
      const accounts = await provider.request({ method: "eth_accounts" })
      if (!accounts || accounts.length === 0) {
        console.log("[v0] No connected accounts found")
        throw new Error(t("wallet_not_connected"))
      }

      const currentAccount = accounts[0].toLowerCase()
      if (currentAccount !== walletAddress.toLowerCase()) {
        throw new Error(t("wallet_address_changed"))
      }
    } catch (error) {
      console.error("[v0] Failed to check wallet connection:", error)
      throw new Error(t("cannot_connect_wallet"))
    }

    try {
      const balance = await getASHVABalance(provider, walletAddress)
      console.log("[v0] Current ASHVA balance:", balance)
      console.log("[v0] Required ASHVA for payment:", requiredASHVA)

      if (balance < requiredASHVA) {
        throw new Error(
          `${t("insufficient_balance")} ${requiredASHVA.toLocaleString()} ASHVA, ${t("current_balance")} ${balance.toLocaleString()} ASHVA`,
        )
      }

      const contractAddress = process.env.NEXT_PUBLIC_ASHVA_CONTRACT_ADDRESS
      const recipientAddress = "0x1f307E4004eB5dfE7B00C39F9d697996c11f4704"

      if (!contractAddress) {
        throw new Error(t("ashva_contract_address_not_configured"))
      }

      if (!recipientAddress) {
        throw new Error(t("recipient_address_not_configured"))
      }

      const amountInWei = (BigInt(Math.floor(requiredASHVA)) * BigInt(10 ** 18)).toString(16)
      const recipientAddressFormatted = recipientAddress.toLowerCase().replace("0x", "").padStart(64, "0")
      const amountFormatted = amountInWei.padStart(64, "0")
      const data = `0xa9059cbb${recipientAddressFormatted}${amountFormatted}`

      console.log("[v0] Executing payment transfer to:", recipientAddress)
      console.log("[v0] Payment amount:", Math.floor(requiredASHVA), "ASHVA")

      const txHash = await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: walletAddress,
            to: contractAddress,
            data,
            gas: "0x8afc",
          },
        ],
      })

      console.log("[v0] Payment transaction sent, hash:", txHash)
      return txHash
    } catch (error: any) {
      const errorString = JSON.stringify(error)
      const errorMessage = error?.message || ""

      const isUserCancelled =
        error?.code === 117 ||
        error?.code === 4001 ||
        errorString.includes('"code":117') ||
        errorString.includes('"code":4001') ||
        errorMessage.includes("User rejected") ||
        errorMessage.includes("User denied") ||
        errorMessage.includes("用户拒绝") ||
        errorMessage.includes("OKX Wallet Reject")

      if (isUserCancelled) {
        console.log("[v0] User cancelled transaction")
        throw new Error("USER_CANCELLED")
      }

      const isExpired =
        errorMessage.includes("expired") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("timed out") ||
        errorString.includes("expired")

      if (isExpired) {
        console.log("[v0] Request expired, wallet connection may be stale")
        throw new Error(t("request_timeout_refresh_wallet"))
      }

      console.error("[v0] Payment transfer error:", errorMessage || error)
      throw error
    }
  }

  const handleConfirmPurchase = async () => {
    if (!agreementAccepted) {
      toast({
        title: t("accept_agreement"),
        description: t("agree_purchase_agreement_to_continue"),
        variant: "destructive",
      })
      return
    }

    setIsPurchasing(true)
    dialogOpenedRef.current = false
    setShowConfirmDialog(false)

    try {
      const paymentTxHash = await executePaymentTransfer()
      console.log("[v0] Payment completed, txHash:", paymentTxHash)

      const response = await fetch("/api/purchase/image-node", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: walletAddress.toLowerCase(),
          specs,
          paymentAmount: purchaseAmountUSD,
          paymentAmountASHVA: requiredASHVA,
          paymentTxHash,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setPurchaseSuccess(true)
        toast({
          title: t("purchase_success"),
          description: `${t("image_node_created")}！${t("node_id")}: ${data.nodeId}`,
        })
        setTimeout(() => {
          window.location.href = `/node-docs?nodeId=${data.nodeId}`
        }, 2000)
      } else {
        toast({
          title: t("purchase_failed"),
          description: data.error || t("try_again"),
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.log("[v0] Purchase cancelled or failed")
      if (error.message === "USER_CANCELLED") {
        toast({
          title: t("transaction_cancelled"),
          description: t("you_cancelled_payment_transaction"),
        })
      } else {
        toast({
          title: t("purchase_failed"),
          description: error.message || t("transaction_failed_try_again"),
          variant: "destructive",
        })
      }
    } finally {
      setIsPurchasing(false)
    }
  }

  const [requiredASHVA, setRequiredASHVA] = useState(0)

  useEffect(() => {
    calculateRevenue()
  }, [specs])

  const getASHVABalance = async (provider: any, walletAddress: string): Promise<number> => {
    const ethersProvider = new ethers.BrowserProvider(provider)
    const signer = await ethersProvider.getSigner()
    const ashvaContractAddress = process.env.NEXT_PUBLIC_ASHVA_CONTRACT_ADDRESS
    if (!ashvaContractAddress) {
      throw new Error(t("ashva_contract_address_not_configured"))
    }
    const ashvaContract = new ethers.Contract(
      ashvaContractAddress,
      ["function balanceOf(address) view returns (uint256)"],
      signer,
    )
    const balance = await ashvaContract.balanceOf(walletAddress)
    return Number.parseFloat(ethers.formatUnits(balance, 18))
  }

  const copyToClipboard = (text: string, step: string) => {
    navigator.clipboard.writeText(text)
    setCopiedStep(step)
    toast({
      title: t("copied"),
      description: t("command_copied_clipboard"),
    })
    setTimeout(() => setCopiedStep(null), 2000)
  }

  return (
    <>
      <Card className="p-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold mb-1">{t("purchase.imageNode.title")}</h2>
          <p className="text-sm text-muted-foreground text-pretty">{t("purchase.imageNode.subtitle")}</p>
        </div>

        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm leading-relaxed">
            <p className="font-semibold mb-1">{t("purchase.imageNode.requirements")}</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>{t("purchase.imageNode.req1")}</li>
              <li>{t("purchase.imageNode.req2")}</li>
              <li>{t("purchase.imageNode.req3")}</li>
              <li>{t("purchase.imageNode.req4")}</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="guide" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="guide">{t("purchase.imageNode.installationGuide")}</TabsTrigger>
            <TabsTrigger value="config">{t("purchase.imageNode.serverConfiguration")}</TabsTrigger>
          </TabsList>

          <TabsContent value="guide" className="space-y-4 mt-4">
            <div className="space-y-6">
              {/* 步骤 1: 下载节点包 */}
              <Card className="p-4 border-l-4 border-l-blue-500">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Download className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold text-base mb-1">{t("purchase.imageNode.step1")}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{t("purchase.imageNode.step1Desc")}</p>
                    </div>

                    <div className="bg-muted/50 rounded-md p-3 relative">
                      <code className="text-sm text-foreground block overflow-x-auto">
                        wget https://releases.ashva.network/node-latest.tar.gz
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 h-7 w-7 p-0"
                        onClick={() =>
                          copyToClipboard("wget https://releases.ashva.network/node-latest.tar.gz", "step1")
                        }
                      >
                        {copiedStep === "step1" ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>{t("ensure_server_online")}</p>
                      <p>{t("download_size_500mb")}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 步骤 2: 解压安装 */}
              <Card className="p-4 border-l-4 border-l-green-500">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Terminal className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold text-base mb-1">{t("purchase.imageNode.step2")}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{t("purchase.imageNode.step2Desc")}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="bg-muted/50 rounded-md p-3 relative">
                        <code className="text-sm text-foreground block overflow-x-auto">
                          tar -xzf node-latest.tar.gz
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 h-7 w-7 p-0"
                          onClick={() => copyToClipboard("tar -xzf node-latest.tar.gz", "step2a")}
                        >
                          {copiedStep === "step2a" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>

                      <div className="bg-muted/50 rounded-md p-3 relative">
                        <code className="text-sm text-foreground block overflow-x-auto">
                          cd ashva-node && chmod +x install.sh
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 h-7 w-7 p-0"
                          onClick={() => copyToClipboard("cd ashva-node && chmod +x install.sh", "step2b")}
                        >
                          {copiedStep === "step2b" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>

                      <div className="bg-muted/50 rounded-md p-3 relative">
                        <code className="text-sm text-foreground block overflow-x-auto">sudo ./install.sh</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 h-7 w-7 p-0"
                          onClick={() => copyToClipboard("sudo ./install.sh", "step2c")}
                        >
                          {copiedStep === "step2c" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>{t("installation_needs_root")}</p>
                      <p>{t("installation_time_5_10_minutes")}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 步骤 3: 配置节点 */}
              <Card className="p-4 border-l-4 border-l-amber-500">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Settings className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold text-base mb-1">{t("purchase.imageNode.step3")}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{t("purchase.imageNode.step3Desc")}</p>
                    </div>

                    <div className="bg-muted/50 rounded-md p-3 relative">
                      <code className="text-sm text-foreground block overflow-x-auto">
                        sudo nano /etc/ashva-node/config.yml
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 h-7 w-7 p-0"
                        onClick={() => copyToClipboard("sudo nano /etc/ashva-node/config.yml", "step3")}
                      >
                        {copiedStep === "step3" ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>

                    <div className="bg-muted/50 rounded-md p-3 space-y-1">
                      <p className="text-xs font-semibold text-foreground mb-2">{t("config_file_example")}</p>
                      <pre className="text-xs text-foreground overflow-x-auto">
                        {`# 节点基本配置
node:
  wallet_address: "您的钱包地址"
  node_id: "购买后获得的节点ID"
  
# 服务器资源配置
resources:
  cpu_cores: ${specs.cpu || "4"}
  memory_gb: ${specs.memory || "8"}
  storage_gb: ${specs.storage || "100"}

# 网络配置
network:
  port: 30303
  rpc_port: 8545`}
                      </pre>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>{t("purchase_node_package")}</p>
                      <p>{t("fill_correct_wallet_address")}</p>
                      <p>{t("save_config")}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 步骤 4: 启动节点 */}
              <Card className="p-4 border-l-4 border-l-purple-500">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Play className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold text-base mb-1">{t("purchase.imageNode.step4")}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{t("purchase.imageNode.step4Desc")}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="bg-muted/50 rounded-md p-3 relative">
                        <code className="text-sm text-foreground block overflow-x-auto">
                          sudo systemctl start ashva-node
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 h-7 w-7 p-0"
                          onClick={() => copyToClipboard("sudo systemctl start ashva-node", "step4a")}
                        >
                          {copiedStep === "step4a" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>

                      <div className="bg-muted/50 rounded-md p-3 relative">
                        <code className="text-sm text-foreground block overflow-x-auto">
                          sudo systemctl enable ashva-node
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 h-7 w-7 p-0"
                          onClick={() => copyToClipboard("sudo systemctl enable ashva-node", "step4b")}
                        >
                          {copiedStep === "step4b" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>

                      <div className="bg-muted/50 rounded-md p-3 relative">
                        <code className="text-sm text-foreground block overflow-x-auto">
                          sudo systemctl status ashva-node
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 h-7 w-7 p-0"
                          onClick={() => copyToClipboard("sudo systemctl status ashva-node", "step4c")}
                        >
                          {copiedStep === "step4c" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>{t("view_logs")}</p>
                      <p>{t("restart_node")}</p>
                      <p>{t("stop_node")}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 额外说明 */}
              <Alert className="border-blue-500/50 bg-blue-500/5">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-sm space-y-2">
                  <p className="font-semibold text-foreground">{t("important_notes")}</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>{t("open_firewall_ports")}</li>
                    <li>{t("suggest_ubuntu_version")}</li>
                    <li>{t("regularly_check_node_status")}</li>
                    <li>{t("keep_system_updated")}</li>
                  </ul>
                  <div className="pt-2">
                    <Button variant="link" className="h-auto p-0 text-blue-500" asChild>
                      <Link href="/node-docs" className="flex items-center gap-1">
                        {t("view_full_documentation")}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-4 mt-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">{t("your_server_configuration")}</h3>

              <div className="space-y-2">
                <Label htmlFor="cpu" className="text-sm">
                  {t("cpu_cores")}
                </Label>
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="cpu"
                    type="number"
                    placeholder={t("example_4")}
                    value={specs.cpu}
                    onChange={(e) => {
                      console.log("[v0] CPU changed to:", e.target.value)
                      setSpecs({ ...specs, cpu: e.target.value })
                    }}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">{t("cores")}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="memory" className="text-sm">
                  {t("memory_size")}
                </Label>
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="memory"
                    type="number"
                    placeholder={t("example_8")}
                    value={specs.memory}
                    onChange={(e) => {
                      console.log("[v0] Memory changed to:", e.target.value)
                      setSpecs({ ...specs, memory: e.target.value })
                    }}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">{t("gb")}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storage" className="text-sm">
                  {t("hard_drive_size")}
                </Label>
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="storage"
                    type="number"
                    placeholder={t("example_100")}
                    value={specs.storage}
                    onChange={(e) => {
                      console.log("[v0] Storage changed to:", e.target.value)
                      setSpecs({ ...specs, storage: e.target.value })
                    }}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">{t("gb")}</span>
                </div>
              </div>
            </div>

            <Card className="p-4 bg-muted/30">
              <p className="text-sm font-semibold mb-2">{t("recommended_configuration")}</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>{t("minimum_configuration")}</p>
                <p>{t("recommended_configuration")}</p>
                <p>{t("advanced_configuration")}</p>
              </div>
            </Card>

            {estimatedRevenue > 0 && (
              <Card className="p-4 border-green-500/20 bg-green-500/5">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  {t("estimated_monthly_revenue")}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("estimated_monthly_revenue")}</span>
                    <span className="font-bold text-green-500">${estimatedRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("estimated_annual_revenue")}</span>
                    <span className="font-bold text-green-500">${(estimatedRevenue * 12).toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">{t("actual_revenue_factors")}</p>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm leading-relaxed">
            {t("purchase_image_node_package")} {purchaseAmountUSD} {t("ashva_tokens")}. {t("payment_transferred")}{" "}
            {t("recipient_address_used")}.
          </AlertDescription>
        </Alert>

        <Button
          size="lg"
          className="w-full"
          onClick={handlePurchase}
          disabled={isLoadingPrice || !specs.cpu || !specs.memory || !specs.storage}
        >
          {isLoadingPrice
            ? t("loading_price")
            : `${t("purchase_image_node_package")} (${t("pay")} ${requiredASHVA.toLocaleString()} ASHVA)`}
        </Button>

        {(!specs.cpu || !specs.memory || !specs.storage) && (
          <p className="text-sm text-amber-500 text-center">⚠ {t("fill_complete_server_config")}</p>
        )}
      </Card>

      <Dialog
        open={showConfirmDialog}
        onOpenChange={(open) => {
          console.log("[v0] Dialog onOpenChange called, new value:", open)
          if (!open) {
            dialogOpenedRef.current = false
          }
          setShowConfirmDialog(open)
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="sr-only">Dialog is open: {showConfirmDialog ? "yes" : "no"}</div>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              {t("purchase_agreement_confirmation")}
            </DialogTitle>
            <DialogDescription>{t("read_purchase_agreement_terms")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="border-amber-500/30 bg-amber-500/5">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-sm">
                <p className="font-semibold mb-1">{t("purchase_image_node_package")}</p>
                <p className="text-xs text-muted-foreground">{t("payment_transferred_recipient_address")}</p>
              </AlertDescription>
            </Alert>

            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("payment_amount")}</span>
                <span className="font-bold text-amber-500">{requiredASHVA.toLocaleString()} ASHVA</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("equivalent_usd")}</span>
                <span className="font-semibold">${purchaseAmountUSD}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("current_price")}</span>
                <span className="text-xs font-mono">${ashvaPrice.toFixed(8)}/ASHVA</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("your_wallet")}</span>
                <span className="text-xs font-mono">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("recipient_address")}</span>
                <span className="text-xs font-mono">0x1f307E4004eB5dfE7B00C39F9d697996c11f4704</span>
              </div>
            </div>

            <StakingAgreement onAcceptChange={setAgreementAccepted} stakeAmount={purchaseAmountUSD} />

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <Clock className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-blue-500">{t("staking_period")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("payment_tokens_locked")}{" "}
                    <span className="font-bold">
                      {lockPeriodDays} {t("days")}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("expected_unlock_date")}: {unlockDate.toLocaleDateString("zh-CN")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-green-500">{t("payment_rewards")}</p>
                  <p className="text-xs text-muted-foreground">{t("earn_node_rewards_during_payment")}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-500">{t("release_payment")}</p>
                  <p className="text-xs text-muted-foreground">{t("unlock_period_end")}</p>
                  <p className="text-xs text-muted-foreground">{t("payment_tokens_returned")}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <h4 className="font-semibold text-sm mb-2 text-destructive">{t("important_notes")}</h4>
              <ul className="space-y-1 text-xs text-muted-foreground list-disc list-inside">
                <li>{t("payment_tokens_transferred")}</li>
                <li>{t("payment_tokens_penalty")}</li>
                <li>{t("node_stops_after_release")}</li>
                <li>{t("ensure_enough_eth")}</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isPurchasing}>
              {t("cancel")}
            </Button>
            <Button onClick={handleConfirmPurchase} disabled={!agreementAccepted || isPurchasing}>
              {isPurchasing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  {t("processing")}
                </>
              ) : (
                t("confirm_purchase")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
