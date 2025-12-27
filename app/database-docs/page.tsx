"use client"

import { Copy, Database, Server, Code } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DatabaseDocsPage() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Database className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">数据库连接文档</h1>
          </div>
          <p className="text-muted-foreground">用于后台系统连接数据库，查询云节点托管和镜像节点的购买记录</p>
        </div>

        {/* Database Connection Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              数据库连接信息
            </CardTitle>
            <CardDescription>使用以下环境变量连接到 Neon PostgreSQL 数据库</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">推荐：DATABASE_URL（带连接池）</h3>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard("process.env.DATABASE_URL")}>
                  <Copy className="h-4 w-4 mr-2" />
                  复制
                </Button>
              </div>
              <div className="bg-muted p-3 rounded-md font-mono text-sm">process.env.DATABASE_URL</div>
              <p className="text-sm text-muted-foreground">用于常规查询操作，自动处理连接池</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">备选：DATABASE_URL_UNPOOLED（无连接池）</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard("process.env.DATABASE_URL_UNPOOLED")}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  复制
                </Button>
              </div>
              <div className="bg-muted p-3 rounded-md font-mono text-sm">process.env.DATABASE_URL_UNPOOLED</div>
              <p className="text-sm text-muted-foreground">用于需要持久连接的操作（如迁移脚本）</p>
            </div>
          </CardContent>
        </Card>

        {/* Nodes Table Structure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              nodes 表结构
            </CardTitle>
            <CardDescription>存储所有节点购买记录（云节点托管 & 镜像节点）</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">字段名</th>
                    <th className="text-left py-2 px-4">类型</th>
                    <th className="text-left py-2 px-4">说明</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-4 font-mono">id</td>
                    <td className="py-2 px-4">integer</td>
                    <td className="py-2 px-4">主键，自增ID</td>
                  </tr>
                  <tr className="border-b bg-muted/50">
                    <td className="py-2 px-4 font-mono">node_type</td>
                    <td className="py-2 px-4">varchar</td>
                    <td className="py-2 px-4">
                      <strong>节点类型：'cloud' (云节点托管) 或 'image' (镜像节点)</strong>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4 font-mono">wallet_address</td>
                    <td className="py-2 px-4">varchar</td>
                    <td className="py-2 px-4">购买者钱包地址</td>
                  </tr>
                  <tr className="border-b bg-muted/50">
                    <td className="py-2 px-4 font-mono">purchase_price</td>
                    <td className="py-2 px-4">numeric</td>
                    <td className="py-2 px-4">
                      <strong>购买价格（USDT）：2000 为云节点，100 为镜像节点</strong>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4 font-mono">tx_hash</td>
                    <td className="py-2 px-4">varchar</td>
                    <td className="py-2 px-4">区块链交易哈希</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4 font-mono">status</td>
                    <td className="py-2 px-4">varchar</td>
                    <td className="py-2 px-4">节点状态：'active', 'inactive', 等</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4 font-mono">cpu_cores</td>
                    <td className="py-2 px-4">integer</td>
                    <td className="py-2 px-4">CPU 核心数（仅云节点）</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4 font-mono">memory_gb</td>
                    <td className="py-2 px-4">integer</td>
                    <td className="py-2 px-4">内存大小 GB（仅云节点）</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4 font-mono">storage_gb</td>
                    <td className="py-2 px-4">integer</td>
                    <td className="py-2 px-4">存储大小 GB（仅云节点）</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4 font-mono">created_at</td>
                    <td className="py-2 px-4">timestamp</td>
                    <td className="py-2 px-4">购买时间</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* SQL Query Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              SQL 查询示例
            </CardTitle>
            <CardDescription>常用的数据库查询语句</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Query 1: All Cloud Node Purchases */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">1. 查询所有云节点托管购买记录（2000 USDT）</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(`SELECT 
  id,
  wallet_address,
  purchase_price,
  tx_hash,
  cpu_cores,
  memory_gb,
  storage_gb,
  status,
  created_at
FROM nodes
WHERE node_type = 'cloud'
  AND purchase_price = 2000
  AND tx_hash IS NOT NULL
ORDER BY created_at DESC;`)
                  }
                >
                  <Copy className="h-4 w-4 mr-2" />
                  复制
                </Button>
              </div>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                <code>{`SELECT 
  id,
  wallet_address,
  purchase_price,
  tx_hash,
  cpu_cores,
  memory_gb,
  storage_gb,
  status,
  created_at
FROM nodes
WHERE node_type = 'cloud'
  AND purchase_price = 2000
  AND tx_hash IS NOT NULL
ORDER BY created_at DESC;`}</code>
              </pre>
            </div>

            {/* Query 2: All Image Node Purchases */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">2. 查询所有镜像节点购买记录（100 USDT）</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(`SELECT 
  id,
  wallet_address,
  purchase_price,
  tx_hash,
  status,
  created_at
FROM nodes
WHERE node_type = 'image'
  AND purchase_price = 100
  AND tx_hash IS NOT NULL
ORDER BY created_at DESC;`)
                  }
                >
                  <Copy className="h-4 w-4 mr-2" />
                  复制
                </Button>
              </div>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                <code>{`SELECT 
  id,
  wallet_address,
  purchase_price,
  tx_hash,
  status,
  created_at
FROM nodes
WHERE node_type = 'image'
  AND purchase_price = 100
  AND tx_hash IS NOT NULL
ORDER BY created_at DESC;`}</code>
              </pre>
            </div>

            {/* Query 3: All Purchases */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">3. 查询所有购买记录</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(`SELECT 
  id,
  node_type,
  wallet_address,
  purchase_price,
  tx_hash,
  cpu_cores,
  memory_gb,
  storage_gb,
  status,
  created_at
FROM nodes
WHERE tx_hash IS NOT NULL
ORDER BY created_at DESC;`)
                  }
                >
                  <Copy className="h-4 w-4 mr-2" />
                  复制
                </Button>
              </div>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                <code>{`SELECT 
  id,
  node_type,
  wallet_address,
  purchase_price,
  tx_hash,
  cpu_cores,
  memory_gb,
  storage_gb,
  status,
  created_at
FROM nodes
WHERE tx_hash IS NOT NULL
ORDER BY created_at DESC;`}</code>
              </pre>
            </div>

            {/* Query 4: By Wallet Address */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">4. 按钱包地址查询购买记录</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(`SELECT 
  id,
  node_type,
  purchase_price,
  tx_hash,
  status,
  created_at
FROM nodes
WHERE wallet_address = '0x...'
  AND tx_hash IS NOT NULL
ORDER BY created_at DESC;`)
                  }
                >
                  <Copy className="h-4 w-4 mr-2" />
                  复制
                </Button>
              </div>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                <code>{`SELECT 
  id,
  node_type,
  purchase_price,
  tx_hash,
  status,
  created_at
FROM nodes
WHERE wallet_address = '0x...'
  AND tx_hash IS NOT NULL
ORDER BY created_at DESC;`}</code>
              </pre>
            </div>

            {/* Query 5: Statistics */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">5. 购买统计（按类型分组）</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(`SELECT 
  node_type,
  COUNT(*) as total_purchases,
  SUM(purchase_price) as total_revenue,
  AVG(purchase_price) as avg_price
FROM nodes
WHERE tx_hash IS NOT NULL
GROUP BY node_type;`)
                  }
                >
                  <Copy className="h-4 w-4 mr-2" />
                  复制
                </Button>
              </div>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                <code>{`SELECT 
  node_type,
  COUNT(*) as total_purchases,
  SUM(purchase_price) as total_revenue,
  AVG(purchase_price) as avg_price
FROM nodes
WHERE tx_hash IS NOT NULL
GROUP BY node_type;`}</code>
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Node.js Connection Example */}
        <Card>
          <CardHeader>
            <CardTitle>Node.js 连接示例</CardTitle>
            <CardDescription>使用 @neondatabase/serverless 连接数据库</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">1. 安装依赖</h3>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                  <code>npm install @neondatabase/serverless</code>
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2. 连接并查询</h3>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                  <code>{`import { neon } from '@neondatabase/serverless';

// 使用环境变量中的 DATABASE_URL
const sql = neon(process.env.DATABASE_URL);

// 查询云节点托管购买记录
async function getCloudNodePurchases() {
  const result = await sql\`
    SELECT 
      id,
      wallet_address,
      purchase_price,
      tx_hash,
      cpu_cores,
      memory_gb,
      storage_gb,
      status,
      created_at
    FROM nodes
    WHERE node_type = 'cloud'
      AND purchase_price = 2000
      AND tx_hash IS NOT NULL
    ORDER BY created_at DESC
  \`;
  
  return result;
}

// 调用函数
const purchases = await getCloudNodePurchases();
console.log('云节点购买记录:', purchases);`}</code>
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-amber-700 dark:text-amber-500">重要提示</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>1. 环境变量安全：</strong>
              DATABASE_URL 包含敏感信息，请勿在代码中硬编码或公开分享
            </p>
            <p>
              <strong>2. 节点类型识别：</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>云节点托管：node_type = 'cloud', purchase_price = 2000</li>
              <li>镜像节点：node_type = 'image', purchase_price = 100</li>
            </ul>
            <p>
              <strong>3. 有效购买记录：</strong>
              必须包含 tx_hash（交易哈希），表示链上支付已完成
            </p>
            <p>
              <strong>4. 连接池推荐：</strong>
              生产环境建议使用 DATABASE_URL（带连接池），提高性能
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
