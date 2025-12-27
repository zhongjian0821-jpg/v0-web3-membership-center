"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { RefreshCw, Download } from "lucide-react"

interface CloudNode {
  id: number
  node_id: string
  wallet_address: string
  node_type: string
  status: string
  purchase_price: string
  cpu_cores: number
  memory_gb: number
  storage_gb: number
  uptime_percentage: string
  total_earnings: string
  created_at: string
}

export default function CloudNodesAdminPage() {
  const [nodes, setNodes] = useState<CloudNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCloudNodes = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/cloud-nodes")
      if (!response.ok) throw new Error("Failed to fetch cloud nodes")
      const data = await response.json()
      setNodes(data.nodes || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCloudNodes()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN")
  }

  const formatPrice = (price: string) => {
    return Number.parseFloat(price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const exportToCSV = () => {
    const headers = ["节点ID", "钱包地址", "状态", "CPU", "内存", "存储", "购买价格", "总收益", "创建时间"]
    const csvContent = [
      headers.join(","),
      ...nodes.map((node) =>
        [
          node.node_id,
          node.wallet_address,
          node.status,
          `${node.cpu_cores}核`,
          `${node.memory_gb}GB`,
          `${node.storage_gb}GB`,
          `${formatPrice(node.purchase_price)} ASHVA`,
          `${formatPrice(node.total_earnings)} ASHVA`,
          formatDate(node.created_at),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `cloud-nodes-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">云节点托管购买记录</h1>
          <p className="text-muted-foreground mt-2">查看所有用户购买的云节点托管服务</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchCloudNodes} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button onClick={exportToCSV} variant="outline" disabled={nodes.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            导出CSV
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>总节点数</CardDescription>
            <CardTitle className="text-3xl">{nodes.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>运行中</CardDescription>
            <CardTitle className="text-3xl text-green-500">
              {nodes.filter((n) => n.status === "active").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>总购买金额</CardDescription>
            <CardTitle className="text-2xl">
              {formatPrice(nodes.reduce((sum, n) => sum + Number.parseFloat(n.purchase_price || "0"), 0).toString())}{" "}
              ASHVA
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>总产生收益</CardDescription>
            <CardTitle className="text-2xl text-green-500">
              {formatPrice(nodes.reduce((sum, n) => sum + Number.parseFloat(n.total_earnings || "0"), 0).toString())}{" "}
              ASHVA
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 购买记录表格 */}
      <Card>
        <CardHeader>
          <CardTitle>购买记录详情</CardTitle>
          <CardDescription>所有云节点托管的购买记录和配置信息</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : nodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无云节点购买记录</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>节点ID</TableHead>
                    <TableHead>钱包地址</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>配置</TableHead>
                    <TableHead>购买价格</TableHead>
                    <TableHead>总收益</TableHead>
                    <TableHead>在线率</TableHead>
                    <TableHead>购买时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nodes.map((node) => (
                    <TableRow key={node.id}>
                      <TableCell className="font-mono text-sm">{node.node_id}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {node.wallet_address.slice(0, 6)}...{node.wallet_address.slice(-4)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            node.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {node.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {node.cpu_cores}核/{node.memory_gb}GB/{node.storage_gb}GB
                      </TableCell>
                      <TableCell className="font-semibold">{formatPrice(node.purchase_price)} ASHVA</TableCell>
                      <TableCell className="text-green-600 font-semibold">
                        {formatPrice(node.total_earnings)} ASHVA
                      </TableCell>
                      <TableCell>{node.uptime_percentage}%</TableCell>
                      <TableCell>{formatDate(node.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
