"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Copy, CheckCircle2, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function ApiSyncDocsPage() {
  const router = useRouter()
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const apiUrl = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"

  return (
    <main className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent p-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/database-docs")}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">节点数据同步 API 文档</h1>
            <p className="text-sm opacity-90">后台系统数据同步接口说明</p>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 -mt-6">
        {/* Overview */}
        <Card className="p-6 mb-6 border-primary/20">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            概述
          </h2>
          <p className="text-muted-foreground mb-4">
            本API用于后台系统同步节点的真实数据（机器号、收益、性能指标等）到前端数据库。
            后台系统可以通过以下两种方式使用此API：
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              <strong>推送模式 (POST)</strong>：后台系统主动推送节点数据更新
            </li>
            <li>
              <strong>查询模式 (GET)</strong>：后台系统查询当前数据库中的节点信息
            </li>
          </ul>
        </Card>

        {/* POST API - Sync Data */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">推送节点数据 (POST)</h2>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium">POST</span>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">API 端点</h3>
              <div className="relative">
                <code className="block bg-muted p-3 rounded-md text-sm font-mono break-all">
                  POST {apiUrl}/api/sync/node-data
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(`${apiUrl}/api/sync/node-data`, "post-url")}
                >
                  {copied === "post-url" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">请求头</h3>
              <code className="block bg-muted p-3 rounded-md text-sm font-mono">Content-Type: application/json</code>
            </div>

            <div>
              <h3 className="font-semibold mb-2">请求体格式</h3>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-md text-xs font-mono overflow-x-auto">
                  {`{
  "walletAddress": "0x8fc07A7F4886BA53acd58d77666A88e1392C716D",
  "nodes": [
    {
      "orderId": 21,  // 可选，数据库中的节点ID
      "deviceId": "CN-1765356605859-8jynl6pys",  // 必填，真实机器号
      "earnings": 150.50,  // 必填，累计收益（ASHVA）
      "status": "active",  // 可选，节点状态
      "performance": {  // 可选，性能数据
        "uptime": 99.90,  // 在线率（百分比）
        "cpuUsage": 45.00,  // CPU使用率
        "memoryUsage": 60.00,  // 内存使用率
        "storageUsage": 35.00,  // 存储使用率
        "dataTransferred": 125.50  // 数据流量（GB）
      }
    }
  ]
}`}
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() =>
                    copyToClipboard(
                      JSON.stringify(
                        {
                          walletAddress: "0x8fc07A7F4886BA53acd58d77666A88e1392C716D",
                          nodes: [
                            {
                              orderId: 21,
                              deviceId: "CN-1765356605859-8jynl6pys",
                              earnings: 150.5,
                              status: "active",
                              performance: {
                                uptime: 99.9,
                                cpuUsage: 45.0,
                                memoryUsage: 60.0,
                                storageUsage: 35.0,
                                dataTransferred: 125.5,
                              },
                            },
                          ],
                        },
                        null,
                        2,
                      ),
                      "post-body",
                    )
                  }
                >
                  {copied === "post-body" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">字段说明</h3>
              <div className="space-y-2 text-sm">
                <div className="p-3 bg-muted rounded-md">
                  <code className="font-semibold">walletAddress</code> - 用户钱包地址（必填）
                </div>
                <div className="p-3 bg-muted rounded-md">
                  <code className="font-semibold">nodes[].orderId</code> - 数据库中的节点ID（可选，如果提供则用ID查找）
                </div>
                <div className="p-3 bg-muted rounded-md">
                  <code className="font-semibold">nodes[].deviceId</code> -
                  真实机器编号（必填，后台系统分配的唯一设备号）
                </div>
                <div className="p-3 bg-muted rounded-md">
                  <code className="font-semibold">nodes[].earnings</code> - 累计收益（必填，单位：ASHVA）
                </div>
                <div className="p-3 bg-muted rounded-md">
                  <code className="font-semibold">nodes[].status</code> - 节点状态（可选：active, inactive, maintenance,
                  deploying）
                </div>
                <div className="p-3 bg-muted rounded-md">
                  <code className="font-semibold">nodes[].performance</code> -
                  性能指标（可选，包含在线率、资源使用率等）
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">响应示例</h3>
              <pre className="bg-muted p-4 rounded-md text-xs font-mono overflow-x-auto">
                {`{
  "success": true,
  "updated": 1,
  "updatedNodes": [
    {
      "id": 21,
      "node_id": "CN-1765356605859-8jynl6pys",
      "total_earnings": "150.50000000",
      "status": "active"
    }
  ]
}`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Node.js 调用示例</h3>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-md text-xs font-mono overflow-x-auto">
                  {`const axios = require('axios');

async function syncNodeData(walletAddress, nodes) {
  try {
    const response = await axios.post(
      '${apiUrl}/api/sync/node-data',
      {
        walletAddress,
        nodes
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Sync successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Sync failed:', error.message);
    throw error;
  }
}

// 使用示例
syncNodeData('0x8fc07A7F4886BA53acd58d77666A88e1392C716D', [
  {
    orderId: 21,
    deviceId: 'CN-1765356605859-8jynl6pys',
    earnings: 150.50,
    status: 'active',
    performance: {
      uptime: 99.90,
      cpuUsage: 45.00,
      memoryUsage: 60.00,
      storageUsage: 35.00,
      dataTransferred: 125.50
    }
  }
]);`}
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() =>
                    copyToClipboard(
                      `const axios = require('axios');\n\nasync function syncNodeData(walletAddress, nodes) {\n  const response = await axios.post(\n    '${apiUrl}/api/sync/node-data',\n    { walletAddress, nodes },\n    { headers: { 'Content-Type': 'application/json' } }\n  );\n  return response.data;\n}`,
                      "nodejs-example",
                    )
                  }
                >
                  {copied === "nodejs-example" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* GET API - Query Data */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">查询节点数据 (GET)</h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium">GET</span>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">API 端点</h3>
              <div className="relative">
                <code className="block bg-muted p-3 rounded-md text-sm font-mono break-all">
                  GET {apiUrl}/api/sync/node-data?walletAddress=0x...
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() =>
                    copyToClipboard(
                      `${apiUrl}/api/sync/node-data?walletAddress=0x8fc07A7F4886BA53acd58d77666A88e1392C716D`,
                      "get-url",
                    )
                  }
                >
                  {copied === "get-url" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">响应示例</h3>
              <pre className="bg-muted p-4 rounded-md text-xs font-mono overflow-x-auto">
                {`{
  "success": true,
  "walletAddress": "0x8fc07A7F4886BA53acd58d77666A88e1392C716D",
  "nodes": [
    {
      "id": 21,
      "deviceId": "CN-1765356605859-8jynl6pys",
      "nodeType": "cloud",
      "earnings": "150.50000000",
      "status": "active",
      "cpuCores": 8,
      "memoryGb": 16,
      "storageGb": 500,
      "uptimePercentage": "99.90",
      "cpuUsage": "45.00",
      "memoryUsage": "60.00",
      "storageUsage": "35.00",
      "dataTransferred": "125.50",
      "purchasePrice": "351128.00000000",
      "createdAt": "2025-12-10T00:50:06.283Z",
      "updatedAt": "2025-12-10T02:30:15.123Z"
    }
  ]
}`}
              </pre>
            </div>
          </div>
        </Card>

        {/* Best Practices */}
        <Card className="p-6 mb-6 border-yellow-200 bg-yellow-50">
          <h2 className="text-xl font-bold mb-4">最佳实践建议</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2">
              <span className="text-yellow-600">•</span>
              <span>
                <strong>定期同步：</strong>建议每5-15分钟同步一次节点数据，确保用户看到最新的收益和性能数据
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-yellow-600">•</span>
              <span>
                <strong>批量更新：</strong>一次API调用可以更新多个节点，减少网络请求次数
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-yellow-600">•</span>
              <span>
                <strong>错误处理：</strong>建议实现重试机制，如果同步失败则在下次定时任务时重试
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-yellow-600">•</span>
              <span>
                <strong>数据验证：</strong>确保 deviceId 和 earnings 数据准确，避免覆盖错误数据
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-yellow-600">•</span>
              <span>
                <strong>安全性：</strong>生产环境建议添加API密钥验证，防止未授权访问
              </span>
            </li>
          </ul>
        </Card>

        {/* Support */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">技术支持</h2>
          <p className="text-muted-foreground mb-4">如需技术支持或有任何问题，请联系开发团队。</p>
          <div className="space-y-2 text-sm">
            <p>
              <strong>数据库连接文档：</strong>{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/database-docs")}>
                查看数据库文档
              </Button>
            </p>
            <p>
              <strong>订单查询API：</strong>{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/api-docs")}>
                查看API文档
              </Button>
            </p>
          </div>
        </Card>
      </div>
    </main>
  )
}
