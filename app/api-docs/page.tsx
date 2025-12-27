import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ApiDocsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://your-project.vercel.app"

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">API 文档</h1>
          <p className="text-muted-foreground text-lg">Web3 会员中心 - 节点购买数据接口文档</p>
        </div>

        <Alert>
          <AlertDescription>
            本文档提供了从后台系统访问节点购买数据的完整API说明。所有端点均为公开访问，无需身份验证。
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders">订单查询</TabsTrigger>
            <TabsTrigger value="webhook">Webhook 通知</TabsTrigger>
            <TabsTrigger value="database">数据库结构</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>GET /api/orders</CardTitle>
                  <Badge variant="secondary">公开</Badge>
                </div>
                <CardDescription>获取所有已完成的节点购买订单（包括云节点托管和镜像节点）</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold">请求地址</h3>
                  <code className="block rounded-lg bg-muted p-3 text-sm">GET {baseUrl}/api/orders</code>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">请求示例</h3>
                  <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                    {`curl -X GET '${baseUrl}/api/orders' \\
  -H 'Content-Type: application/json'`}
                  </pre>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">响应格式 (JSON)</h3>
                  <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                    {`{
  "orders": [
    {
      "walletAddress": "0x1234567890abcdef...",
      "productType": "hosting",  // "hosting" 或 "image"
      "quantity": 1,
      "totalAmount": 2000.00,
      "paymentStatus": "completed",
      "transactionHash": "0xabcdef1234567890...",
      "createdAt": "2025-01-10T10:00:00.000Z"
    },
    {
      "walletAddress": "0xabcdef1234567890...",
      "productType": "image",
      "quantity": 1,
      "totalAmount": 100.00,
      "paymentStatus": "completed",
      "transactionHash": "0x9876543210fedcba...",
      "createdAt": "2025-01-09T15:30:00.000Z"
    }
  ]
}`}
                  </pre>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">字段说明</h3>
                  <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-3 text-left font-semibold">字段</th>
                          <th className="p-3 text-left font-semibold">类型</th>
                          <th className="p-3 text-left font-semibold">说明</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="p-3 font-mono">walletAddress</td>
                          <td className="p-3">string</td>
                          <td className="p-3">购买用户的钱包地址</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono">productType</td>
                          <td className="p-3">string</td>
                          <td className="p-3">产品类型："hosting"（云节点托管）或 "image"（镜像节点）</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono">quantity</td>
                          <td className="p-3">number</td>
                          <td className="p-3">购买数量（当前固定为1）</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono">totalAmount</td>
                          <td className="p-3">number</td>
                          <td className="p-3">支付总金额（单位：USDT）</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono">paymentStatus</td>
                          <td className="p-3">string</td>
                          <td className="p-3">支付状态（固定为 "completed"）</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono">transactionHash</td>
                          <td className="p-3">string</td>
                          <td className="p-3">区块链交易哈希（可选）</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono">createdAt</td>
                          <td className="p-3">string</td>
                          <td className="p-3">订单创建时间（ISO 8601格式）</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">产品价格</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">云节点托管</CardTitle>
                        <CardDescription>productType: "hosting"</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">$2,000 USDT</p>
                        <p className="text-muted-foreground text-sm">一次性购买，永久使用</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">镜像节点</CardTitle>
                        <CardDescription>productType: "image"</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">$100 USDT</p>
                        <p className="text-muted-foreground text-sm">一次性购买，永久有效</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhook" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Webhook 自动通知</CardTitle>
                <CardDescription>当用户完成购买时，系统会自动发送购买数据到您配置的webhook URL</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription>
                    需要在环境变量中配置 <code className="rounded bg-muted px-1">OPERATIONS_CENTER_WEBHOOK_URL</code>{" "}
                    为您的后台系统接收地址
                  </AlertDescription>
                </Alert>

                <div>
                  <h3 className="mb-2 font-semibold">通知方式</h3>
                  <code className="block rounded-lg bg-muted p-3 text-sm">POST {"{您配置的webhook URL}"}</code>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">推送数据格式</h3>
                  <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                    {`{
  "walletAddress": "0x1234567890abcdef...",
  "productType": "hosting",  // "hosting" 或 "image"
  "quantity": 1,
  "totalAmount": 2000.00,
  "transactionHash": "0xabcdef1234567890...",
  "createdAt": "2025-01-10T10:00:00.000Z"
}`}
                  </pre>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">后台接收示例</h3>
                  <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                    {`// Node.js / Express 示例
app.post('/api/purchases/webhook', async (req, res) => {
  const { walletAddress, productType, totalAmount, transactionHash } = req.body
  
  // 保存到您的数据库
  await db.orders.create({
    wallet: walletAddress,
    type: productType,
    amount: totalAmount,
    txHash: transactionHash
  })
  
  res.json({ success: true })
})`}
                  </pre>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">触发时机</h3>
                  <ul className="list-inside list-disc space-y-2 text-sm">
                    <li>用户完成ASHVA代币支付</li>
                    <li>区块链交易确认成功（等待60秒或确认）</li>
                    <li>节点记录成功创建到数据库</li>
                    <li>系统立即向配置的webhook URL发送POST请求</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>数据库表结构</CardTitle>
                <CardDescription>nodes 表 - 存储所有购买的节点信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold">主要字段</h3>
                  <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-3 text-left font-semibold">字段名</th>
                          <th className="p-3 text-left font-semibold">类型</th>
                          <th className="p-3 text-left font-semibold">说明</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="p-3 font-mono">id</td>
                          <td className="p-3">integer</td>
                          <td className="p-3">主键，自增ID</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono">wallet_address</td>
                          <td className="p-3">varchar</td>
                          <td className="p-3">购买用户的钱包地址</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono">node_type</td>
                          <td className="p-3">varchar</td>
                          <td className="p-3">节点类型："cloud"（云节点）或 "image"（镜像节点）</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono">node_id</td>
                          <td className="p-3">varchar</td>
                          <td className="p-3">节点唯一标识符</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono">purchase_price</td>
                          <td className="p-3">numeric</td>
                          <td className="p-3">购买价格（USDT）</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono">tx_hash</td>
                          <td className="p-3">varchar</td>
                          <td className="p-3">区块链交易哈希</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono">status</td>
                          <td className="p-3">varchar</td>
                          <td className="p-3">节点状态："active"（激活）</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono">created_at</td>
                          <td className="p-3">timestamp</td>
                          <td className="p-3">创建时间</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono">cpu_cores</td>
                          <td className="p-3">integer</td>
                          <td className="p-3">CPU核心数（仅云节点）</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono">memory_gb</td>
                          <td className="p-3">integer</td>
                          <td className="p-3">内存大小GB（仅云节点）</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono">storage_gb</td>
                          <td className="p-3">integer</td>
                          <td className="p-3">存储大小GB（仅云节点）</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">数据库连接信息</h3>
                  <Alert>
                    <AlertDescription>
                      使用 Neon Postgres 数据库。连接字符串存储在环境变量{" "}
                      <code className="rounded bg-muted px-1">DATABASE_URL</code> 中。
                    </AlertDescription>
                  </Alert>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">SQL查询示例</h3>
                  <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                    {`-- 查询所有已完成的购买订单
SELECT 
  wallet_address,
  node_type,
  purchase_price,
  tx_hash,
  created_at
FROM nodes
WHERE tx_hash IS NOT NULL 
  AND status = 'active'
ORDER BY created_at DESC;

-- 统计各类型节点数量
SELECT 
  node_type,
  COUNT(*) as count,
  SUM(purchase_price) as total_revenue
FROM nodes
WHERE status = 'active'
GROUP BY node_type;`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>快速开始</CardTitle>
            <CardDescription>三种方式集成购买数据到您的后台系统</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <Badge className="mb-2 w-fit">推荐</Badge>
                  <CardTitle className="text-base">Webhook 自动推送</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-muted-foreground">配置环境变量，购买完成后自动推送数据到您的后台</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">API 定时拉取</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-muted-foreground">定期调用 /api/orders 端点获取最新购买记录</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">直连数据库</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-muted-foreground">直接连接 Neon 数据库查询 nodes 表</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
