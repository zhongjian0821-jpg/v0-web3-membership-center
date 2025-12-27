"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Cloud, Server, Cpu, HardDrive, Network, TrendingUp, Clock, ChevronDown, ChevronUp } from "lucide-react"
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
  machineId?: string
  type: "cloud" | "image"
  status: "active" | "inactive" | "maintenance" | "deploying"
  specs: {
    cpu: number
    memory: number
    storage: number
    bandwidth?: string
  }
  performance: {
    uptime: number | string
    dataTransferred: number | string
    earnings: string
    earningsCny?: number
    earningsAshva?: number
    earningsDisplay?: string
    cpuUsage?: number | string
    memoryUsage?: number | string
    storageUsage?: number | string
  }
  purchaseDate: string
  isTransferable: boolean
  dailyRecords?: DailyRecord[]
}

interface NodeCardProps {
  node: Node
  onRefresh: () => void
}

export function NodeCard({ node, onRefresh }: NodeCardProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>("")

  useEffect(() => {
    if (node.status !== "deploying") return

    const calculateTimeRemaining = () => {
      const purchaseTime = new Date(node.purchaseDate).getTime()
      const deploymentDuration = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
      const completionTime = purchaseTime + deploymentDuration
      const now = Date.now()
      const remaining = completionTime - now

      if (remaining <= 0) {
        setTimeRemaining(t("nodes.deploymentComplete"))
        setTimeout(() => onRefresh(), 1000)
        return
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60))
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000)

      setTimeRemaining(`${hours}${t("nodes.hours")} ${minutes}${t("nodes.minutes")} ${seconds}${t("nodes.seconds")}`)
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [node.status, node.purchaseDate, onRefresh, t])

  const statusColor = {
    active: "bg-green-500",
    inactive: "bg-gray-500",
    maintenance: "bg-yellow-500",
    deploying: "bg-blue-500",
  }[node.status]

  const statusText = {
    active: t("nodes.active"),
    inactive: t("nodes.inactive"),
    maintenance: t("actions.maintenance"),
    deploying: t("nodes.deploying"),
  }[node.status]

  const storageUsed = node.performance.storageUsage ? Number.parseFloat(node.performance.storageUsage.toString()) : 0
  const cpuUsage = node.performance.cpuUsage ? Number.parseFloat(node.performance.cpuUsage.toString()) : 0
  const memoryUsage = node.performance.memoryUsage ? Number.parseFloat(node.performance.memoryUsage.toString()) : 0

  return (
    <Card className="p-3 sm:p-4 border-primary/20">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
            {node.type === "cloud" ? (
              <Cloud className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            ) : (
              <Server className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm sm:text-base truncate">{node.id}</p>
            <p className="text-xs text-muted-foreground">
              {node.type === "cloud" ? t("nodes.cloudNode") : t("nodes.imageNode")}
            </p>
          </div>
        </div>
        <Badge className={`${statusColor} shrink-0 text-xs`}>{statusText}</Badge>
      </div>

      {node.status === "deploying" && (
        <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-blue-500 animate-pulse shrink-0" />
            <p className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400">
              {t("nodes.deployingNode")}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mb-1">{t("nodes.estimatedTime")}</p>
          <p className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">{timeRemaining}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4 text-xs sm:text-sm">
        <div className="flex flex-col items-center gap-1 p-2 bg-muted/30 rounded-lg min-w-0">
          <Cpu className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-primary" />
          <span className="truncate font-medium">
            {node.specs.cpu} {t("nodes.cores")}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 p-2 bg-muted/30 rounded-lg min-w-0">
          <Network className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-primary" />
          <span className="truncate font-medium">{node.specs.memory} GB</span>
        </div>
        <div className="flex flex-col items-center gap-1 p-2 bg-muted/30 rounded-lg min-w-0">
          <HardDrive className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-primary" />
          <span className="truncate font-medium">{node.specs.storage} GB</span>
        </div>
      </div>

      {node.status !== "deploying" && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4 p-3 sm:p-4 bg-muted/30 rounded-lg">
          <div className="min-w-0 flex flex-col items-center text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 truncate w-full">{t("nodeStats.uptime")}</p>
            <p className="font-bold text-sm sm:text-base truncate w-full">
              {typeof node.performance.uptime === "string" ? node.performance.uptime : `${node.performance.uptime}%`}
            </p>
          </div>
          <div className="min-w-0 flex flex-col items-center text-center border-x border-border/50 px-1">
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 truncate w-full">
              {t("actions.dataTraffic")}
            </p>
            <p className="font-bold text-sm sm:text-base truncate w-full">
              {typeof node.performance.dataTransferred === "string"
                ? node.performance.dataTransferred
                : `${Number(node.performance.dataTransferred || 0).toFixed(2)} GB`}
            </p>
          </div>
          <div className="min-w-0 flex flex-col items-center text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 truncate w-full">
              {t("member.totalEarnings")}
            </p>
            <div className="w-full space-y-0.5">
              {node.performance.earningsAshva !== undefined && node.performance.earningsAshva > 0 ? (
                <p className="font-bold text-green-500 text-sm sm:text-base truncate w-full">
                  {node.performance.earningsAshva.toLocaleString("zh-CN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  ASHVA
                </p>
              ) : (
                <p className="font-bold text-primary text-sm sm:text-base truncate w-full">
                  {node.performance.earnings}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Expandable Details */}
      {expanded && node.status !== "deploying" && (
        <div className="space-y-3 mb-3 sm:mb-4 pt-3 sm:pt-4 border-t border-border">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">{t("actions.storageUsage")}</span>
              <span className="font-semibold">{storageUsed}%</span>
            </div>
            <Progress value={storageUsed} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">{t("actions.cpuUsage")}</span>
              <span className="font-semibold">{cpuUsage}%</span>
            </div>
            <Progress value={cpuUsage} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">{t("actions.memoryUsage")}</span>
              <span className="font-semibold">{memoryUsage}%</span>
            </div>
            <Progress value={memoryUsage} className="h-2" />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <Clock className="w-3 h-3" />
            <span>
              {t("actions.purchaseDate")}: {node.purchaseDate}
            </span>
          </div>

          {node.dailyRecords && node.dailyRecords.length > 0 && (
            <div className="pt-3 border-t border-border">
              <h3 className="text-sm font-semibold mb-3">{t("nodeStats.dailyRecords")}</h3>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs py-2">{t("nodeStats.date")}</TableHead>
                      <TableHead className="text-xs py-2 text-center">{t("nodeStats.usageRate")}</TableHead>
                      <TableHead className="text-xs py-2 text-right">{t("nodeStats.earnings")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {node.dailyRecords.map((record, index) => (
                      <TableRow key={index} className="text-xs">
                        <TableCell className="py-2">{record.date}</TableCell>
                        <TableCell className="py-2 text-center">{record.uptime.toFixed(1)}%</TableCell>
                        <TableCell className="py-2 text-right">
                          <div className="font-semibold text-green-500">
                            {record.earnings_ashva.toLocaleString("zh-CN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            ASHVA
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        {node.status !== "deploying" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                {t("actions.collapse")}
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                {t("member.viewDetails")}
              </>
            )}
          </Button>
        )}

        {node.type === "cloud" && node.isTransferable && node.status === "active" && (
          <Button
            size="sm"
            className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
            onClick={() => {
              window.location.href = `/transfer?nodeId=${node.id}`
            }}
          >
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            {t("actions.transfer")}
          </Button>
        )}
      </div>
    </Card>
  )
}
