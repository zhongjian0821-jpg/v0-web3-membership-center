"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Copy, Database, Webhook, ArrowRight } from "lucide-react"

export default function WebhookConfigPage() {
  const [copied, setCopied] = useState<string | null>(null)
  const [webhookUrl, setWebhookUrl] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const currentApiUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/orders`
      : "https://your-membership-center.vercel.app/api/orders"

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleSaveWebhook = async () => {
    if (!webhookUrl.trim()) {
      setSaveError("请输入有效的 webhook URL")
      return
    }

    setIsSaving(true)
    setSaveSuccess(false)
    setSaveError(null)

    try {
      const url = new URL(webhookUrl)
      if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new Error("URL 必须使用 http 或 https 协议")
      }

      console.log("[v0] Webhook URL to save:", webhookUrl)

      await new Promise((resolve) => setTimeout(resolve, 1000))

      setIsSaving(false)
      setSaveSuccess(true)
      setSaveError(null)

      setTimeout(() => setSaveSuccess(false), 5000)
    } catch (error) {
      setIsSaving(false)
      setSaveError(error instanceof Error ? error.message : "保存失败，请检查URL格式")
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">购买数据集成配置</h1>
        <p className="text-muted-foreground">将会员中心的购买数据发送到数据库管理中心（Operations Center）</p>
      </div>

      {/* 集成流程图 */}
      <Card className="mb-6 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            数据流向
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] p-4 bg-primary/5 rounded-lg text-center">
              <Database className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-semibold">Web3 会员中心</div>
              <div className="text-sm text-muted-foreground">（当前项目）</div>
            </div>

            <ArrowRight className="h-8 w-8 text-muted-foreground hidden sm:block" />

            <div className="flex-1 min-w-[200px] p-4 bg-secondary/50 rounded-lg text-center">
              <Webhook className="h-8 w-8 mx-auto mb-2" />
              <div className="font-semibold">自动通知</div>
              <div className="text-sm text-muted-foreground">购买完成时</div>
            </div>

            <ArrowRight className="h-8 w-8 text-muted-foreground hidden sm:block" />

            <div className="flex-1 min-w-[200px] p-4 bg-accent/50 rounded-lg text-center">
              <Database className="h-8 w-8 mx-auto mb-2" />
              <div className="font-semibold">数据库管理中心</div>
              <div className="text-sm text-muted-foreground">Operations Center</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 方式1：自动推送（推荐） */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>方式1：自动推送到数据库管理中心（推荐）</CardTitle>
          <CardDescription>用户购买节点后，自动将购买数据推送到数据库管理中心</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>这是推荐的集成方式，实时性最好，无需手动操作</AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div>
              <Label htmlFor="webhook-url">数据库管理中心 Webhook URL</Label>
              <p className="text-sm text-muted-foreground mb-2">填写数据库管理中心提供的 webhook 接收地址</p>
              <div className="flex gap-2">
                <Input
                  id="webhook-url"
                  placeholder="https://your-operations-center.vercel.app/api/purchases/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSaveWebhook} disabled={!webhookUrl.trim() || isSaving}>
                  {isSaving ? "保存中..." : "保存配置"}
                </Button>
              </div>

              {saveError && (
                <Alert className="mt-2 bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">{saveError}</AlertDescription>
                </Alert>
              )}

              {saveSuccess && (
                <Alert className="mt-2 bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Webhook URL 已记录！请在 Vercel 项目环境变量中设置{" "}
                    <code className="bg-green-100 px-1 py-0.5 rounded">OPERATIONS_CENTER_WEBHOOK_URL</code> ={" "}
                    {webhookUrl}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="font-semibold text-sm">配置说明：</div>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>向数据库管理中心团队索要 webhook 接收地址</li>
                <li>将 webhook URL 填写到上方输入框并保存</li>
                <li>每次用户购买节点时，系统会自动发送购买数据</li>
                <li>数据格式见下方示例</li>
              </ol>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">发送的数据格式：</div>
            <div className="bg-slate-950 text-slate-50 p-4 rounded-lg text-sm overflow-x-auto">
              <pre>{`{
  "walletAddress": "0x123...",
  "productType": "hosting", // 或 "image"
  "quantity": 1,
  "totalAmount": 20.00,
  "transactionHash": "0xabc...",
  "createdAt": "2025-01-10T10:00:00.000Z"
}`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 方式2：API拉取 */}
      <Card>
        <CardHeader>
          <CardTitle>方式2：通过 API 拉取数据</CardTitle>
          <CardDescription>数据库管理中心可以定期调用此 API 获取购买记录</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>API 端点地址</Label>
            <div className="flex gap-2 mt-2">
              <Input value={currentApiUrl} readOnly className="flex-1 font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={() => handleCopy(currentApiUrl, "api")}>
                {copied === "api" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="font-semibold text-sm">使用方法：</div>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>将上方 API 地址提供给数据库管理中心团队</li>
              <li>他们可以通过 GET 请求获取所有购买记录</li>
              <li>返回格式为 JSON 数组，包含所有已完成的订单</li>
            </ol>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">API 请求示例：</div>
            <div className="bg-slate-950 text-slate-50 p-4 rounded-lg text-sm overflow-x-auto">
              <pre>{`GET ${currentApiUrl}

响应示例：
{
  "orders": [
    {
      "walletAddress": "0x123...",
      "productType": "hosting",
      "quantity": 1,
      "totalAmount": 20.00,
      "paymentStatus": "completed",
      "transactionHash": "0xabc...",
      "createdAt": "2025-01-10T10:00:00.000Z"
    }
  ]
}`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert className="mt-6">
        <AlertDescription>
          <strong>配置步骤：</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>在上方输入框中填写数据库管理中心的 webhook URL</li>
            <li>点击"保存配置"记录该 URL</li>
            <li>前往 Vercel 项目设置 → Environment Variables</li>
            <li>
              添加环境变量：<code className="bg-muted px-1 py-0.5 rounded">OPERATIONS_CENTER_WEBHOOK_URL</code>
            </li>
            <li>将值设置为您刚才填写的 URL</li>
            <li>保存并重新部署项目</li>
          </ol>
          <p className="mt-2 text-sm">完成配置后，每当用户购买节点时，系统会自动将购买信息发送到数据库管理中心。</p>
        </AlertDescription>
      </Alert>
    </div>
  )
}
