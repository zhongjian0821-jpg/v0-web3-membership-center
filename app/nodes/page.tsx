"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Plus, Activity, RefreshCw } from "lucide-react"
import { NodeCard } from "@/components/node-card"
import { useTranslation } from "@/lib/i18n/context"

interface DailyRecord {
  date: string
  uptime: number
  earnings_cny: number
  earnings_ashva: number
  data_transferred: number
}

interface Node {
  id: string
  machineId: string
  type: "cloud" | "image"
  status: "active" | "inactive" | "maintenance" | "deploying"
  specs: {
    cpu: number
    memory: number
    storage: number
    bandwidth?: string
  }
  performance: {
    uptime: string
    dataTransferred: string
    earnings: string
    earningsCny?: number
    earningsAshva?: number
    earningsDisplay?: string
    cpuUsage?: string
    memoryUsage?: string
    storageUsage?: string
  }
  purchaseDate: string
  isTransferable: boolean
  dailyRecords?: DailyRecord[]
}

export default function NodesPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string>("")

  useEffect(() => {
    const address = localStorage.getItem("walletAddress")
    if (!address) {
      router.push("/")
      return
    }
    setWalletAddress(address)
    fetchNodes(address)
  }, [router])

  const fetchNodes = async (address: string) => {
    try {
      console.log("[v0] Fetching nodes for address:", address)

      const normalizedAddress = address.toLowerCase()

      const localNodesResponse = await fetch(`/api/nodes?address=${normalizedAddress}`)
      const localNodesData = await localNodesResponse.json()

      console.log("[v0] Local nodes from database:", localNodesData.nodes?.length || 0)

      const summaryUrl = `/api/proxy/assigned-records/summary?wallet=${normalizedAddress}`
      console.log("[v0] Calling EXTERNAL API:", summaryUrl)

      const summaryResponse = await fetch(summaryUrl)
      const summaryData = await summaryResponse.json()

      console.log("[v0] Summary response:", summaryData)

      let externalNodes: Node[] = []

      if (summaryData.success && summaryData.data) {
        const recordsUrl = `/api/proxy/assigned-records?wallet=${normalizedAddress}&limit=100`
        console.log("[v0] Calling EXTERNAL API:", recordsUrl)

        const recordsResponse = await fetch(recordsUrl)
        const recordsData = await recordsResponse.json()

        console.log("[v0] Records response:", recordsData)

        if (recordsData.success && recordsData.data && recordsData.data.length > 0) {
          const deviceMap = new Map<string, any[]>()

          recordsData.data.forEach((record: any) => {
            const deviceId = record.device_id
            if (!deviceMap.has(deviceId)) {
              deviceMap.set(deviceId, [])
            }
            deviceMap.get(deviceId)?.push(record)
          })

          externalNodes = Array.from(deviceMap.entries()).map(([deviceId, records]) => {
            const latestRecord = records.sort(
              (a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime(),
            )[0]

            const totalIncomeCny = records.reduce((sum, r) => sum + Number.parseFloat(r.daily_income_cny || "0"), 0)
            const totalIncomeAshva = records.reduce((sum, r) => sum + Number.parseFloat(r.daily_income_ashva || "0"), 0)

            const dailyRecords: DailyRecord[] = records
              .sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime())
              .map((record) => ({
                date: new Date(record.record_date).toLocaleDateString("zh-CN"),
                uptime: 99.9,
                earnings_cny: Number.parseFloat(record.daily_income_cny || "0"),
                earnings_ashva: Number.parseFloat(record.daily_income_ashva || "0"),
                data_transferred: Number.parseFloat(record.daily_flow_gb || "0"),
              }))

            console.log("[v0] Processing device:", {
              deviceId,
              totalIncomeCny,
              totalIncomeAshva,
              recordCount: records.length,
              dailyRecords: dailyRecords.length,
            })

            return {
              id: deviceId,
              machineId: deviceId,
              type: "cloud" as const,
              status: latestRecord.assigned_at ? ("active" as const) : ("deploying" as const),
              specs: {
                cpu: 8,
                memory: 16,
                storage: 500,
              },
              performance: {
                uptime: "99.90",
                dataTransferred: Number.parseFloat(latestRecord.daily_flow_gb || "0").toFixed(2),
                earnings: `¥${totalIncomeCny.toFixed(2)}`,
                earningsCny: totalIncomeCny,
                earningsAshva: totalIncomeAshva,
                earningsDisplay: `${totalIncomeAshva.toFixed(2)} ASHVA`,
                cpuUsage: "45",
                memoryUsage: "60",
                storageUsage: "35",
              },
              purchaseDate: new Date(latestRecord.assigned_at || Date.now()).toLocaleDateString(),
              isTransferable: true,
              dailyRecords,
            }
          })
        }
      }

      const localNodes = localNodesData.nodes || []
      const allNodes = [...localNodes, ...externalNodes]

      console.log("[v0] Total nodes (local + external):", allNodes.length)
      console.log("[v0] Local deploying nodes:", localNodes.filter((n: Node) => n.status === "deploying").length)
      console.log("[v0] External active nodes:", externalNodes.length)

      setNodes(allNodes)
    } catch (error) {
      console.error("[v0] Error fetching nodes:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const totalNodes = nodes.length
  const activeNodes = nodes.filter((n) => n.status === "active").length
  const deployingNodes = nodes.filter((n) => n.status === "deploying").length
  const totalEarningsAshva = nodes.reduce((sum, node) => {
    return sum + (node.performance.earningsAshva || 0)
  }, 0)

  const handleRefresh = () => {
    if (walletAddress && !refreshing) {
      setRefreshing(true)
      fetchNodes(walletAddress)
    }
  }

  if (!walletAddress) return null

  return (
    <main className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent p-4 md:p-6 text-white">
        <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/member")}
            className="text-white hover:bg-white/20 h-8 w-8 md:h-10 md:w-10 p-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold">{t("nodes.title")}</h1>
            <p className="text-xs md:text-sm opacity-90">{t("actions.manageNodes")}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-white hover:bg-white/20 h-8 w-8 md:h-10 md:w-10 p-0"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="px-4 -mt-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-2 md:gap-3 mb-6">
          <Card className="p-3 md:p-4 border-primary/20">
            <div className="flex flex-col items-center text-center">
              <Activity className="w-4 h-4 md:w-5 md:h-5 text-primary mb-1 md:mb-2" />
              <div className="text-xl md:text-2xl font-bold">{totalNodes}</div>
              <div className="text-[10px] md:text-xs text-muted-foreground leading-tight">
                {t("actions.totalNodes")}
              </div>
            </div>
          </Card>

          <Card className="p-3 md:p-4 border-primary/20">
            <div className="flex flex-col items-center text-center">
              <Activity className="w-4 h-4 md:w-5 md:h-5 text-green-500 mb-1 md:mb-2" />
              <div className="text-xl md:text-2xl font-bold text-green-500">{activeNodes}</div>
              <div className="text-[10px] md:text-xs text-muted-foreground leading-tight">{t("nodes.active")}</div>
            </div>
          </Card>

          <Card className="p-3 md:p-4 border-primary/20">
            <div className="flex flex-col items-center text-center">
              <Activity className="w-4 h-4 md:w-5 md:h-5 text-primary mb-1 md:mb-2" />
              <div className="text-base md:text-lg font-bold text-green-500 truncate max-w-full px-1">
                {totalEarningsAshva.toLocaleString("zh-CN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                ASHVA
              </div>
              <div className="text-[10px] md:text-xs text-muted-foreground leading-tight">
                {t("member.totalEarnings")}
              </div>
            </div>
          </Card>
        </div>

        {deployingNodes > 0 && (
          <Card className="mb-4 p-3 border-yellow-500/50 bg-yellow-500/5">
            <div className="flex items-start gap-2">
              <Activity className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-500">
                  {deployingNodes} 个节点正在部署中
                </p>
                <p className="text-xs text-muted-foreground mt-1">预计24小时内完成部署并开始产生收益</p>
              </div>
            </div>
          </Card>
        )}

        {/* Nodes List */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base md:text-lg font-semibold">{t("actions.nodeList")}</h2>
            <Button size="sm" onClick={() => router.push("/purchase")} className="gap-1 md:gap-2 text-xs md:text-sm">
              <Plus className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">{t("actions.purchaseNode")}</span>
              <span className="sm:hidden">{t("actions.purchase")}</span>
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : nodes.length === 0 ? (
            <Card className="p-8 text-center">
              <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">{t("actions.noNodes")}</p>
              <Button onClick={() => router.push("/purchase")}>{t("actions.purchaseNow")}</Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {nodes.map((node) => (
                <NodeCard key={node.id} node={node} onRefresh={() => fetchNodes(walletAddress)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="grid grid-cols-4 gap-1 py-2.5 px-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-col h-auto gap-0.5 px-1 min-w-0"
            onClick={() => router.push("/member")}
          >
            <span className="text-[11px] leading-tight text-center truncate w-full">{t("nav.member")}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-col h-auto gap-0.5 px-1 min-w-0"
            onClick={() => router.push("/purchase")}
          >
            <span className="text-[11px] leading-tight text-center truncate w-full">{t("nav.purchase")}</span>
          </Button>
          <Button variant="default" size="sm" className="flex-col h-auto gap-0.5 px-1 min-w-0">
            <span className="text-[11px] leading-tight text-center truncate w-full">{t("nav.nodes")}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-col h-auto gap-0.5 px-1 min-w-0"
            onClick={() => router.push("/transfer")}
          >
            <span className="text-[11px] leading-tight text-center truncate w-full">{t("nav.transfer")}</span>
          </Button>
        </div>
      </nav>
    </main>
  )
}
