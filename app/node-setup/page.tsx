"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Download, Server, Terminal, CheckCircle2, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "@/lib/i18n/context"

export default function NodeSetupPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nodeId = searchParams.get("nodeId")
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const downloadCommand = `curl -O https://ashva-network.com/downloads/image-node-v1.0.tar.gz`
  const installCommands = [
    `tar -xzf image-node-v1.0.tar.gz`,
    `cd image-node`,
    `chmod +x install.sh`,
    `sudo ./install.sh`,
  ]
  const configExample = `# ${t("nodeSetup.configFileTitle")}
node_id: "${nodeId || "YOUR_NODE_ID"}"
wallet_address: "YOUR_WALLET_ADDRESS"
rpc_endpoint: "https://rpc.ashva-network.com"
network_port: 8545
data_dir: "/var/lib/ashva-node"
log_level: "info"`

  const startCommand = `sudo systemctl start ashva-node`
  const statusCommand = `sudo systemctl status ashva-node`

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push("/nodes")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("nodeSetup.backToNodes")}
          </Button>
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Server className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{t("nodeSetup.title")}</h1>
              <p className="text-muted-foreground">{t("nodeSetup.subtitle")}</p>
              {nodeId && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{t("nodeSetup.nodeId")}:</span>
                  <code className="px-2 py-1 bg-muted rounded text-primary font-mono">{nodeId}</code>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Success Alert */}
        <Alert className="mb-6 border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-500">{t("nodeSetup.successAlert")}</AlertDescription>
        </Alert>

        {/* Setup Tabs */}
        <Tabs defaultValue="download" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="download">{t("nodeSetup.stepDownload")}</TabsTrigger>
            <TabsTrigger value="install">{t("nodeSetup.stepInstall")}</TabsTrigger>
            <TabsTrigger value="config">{t("nodeSetup.stepConfig")}</TabsTrigger>
            <TabsTrigger value="start">{t("nodeSetup.stepStart")}</TabsTrigger>
          </TabsList>

          {/* Download Tab */}
          <TabsContent value="download" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <Download className="h-6 w-6 text-primary mt-1" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{t("nodeSetup.downloadPackage")}</h3>
                  <p className="text-muted-foreground mb-4">{t("nodeSetup.downloadDesc")}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">{t("nodeSetup.sysRequirements")}</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>{t("nodeSetup.reqOs")}</li>
                    <li>{t("nodeSetup.reqCpu")}</li>
                    <li>{t("nodeSetup.reqMemory")}</li>
                    <li>{t("nodeSetup.reqStorage")}</li>
                    <li>{t("nodeSetup.reqNetwork")}</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">{t("nodeSetup.downloadCommand")}</h4>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm flex items-center justify-between">
                    <code>{downloadCommand}</code>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(downloadCommand, "download")}>
                      {copied === "download" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    {t("nodeSetup.directDownload")}
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t("nodeSetup.otherVersions")}
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Install Tab */}
          <TabsContent value="install" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <Terminal className="h-6 w-6 text-primary mt-1" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{t("nodeSetup.installNode")}</h3>
                  <p className="text-muted-foreground mb-4">{t("nodeSetup.installDesc")}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">{t("nodeSetup.installSteps")}</h4>
                  <div className="space-y-3">
                    {installCommands.map((cmd, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 text-primary w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="bg-muted p-3 rounded-lg font-mono text-sm flex items-center justify-between">
                            <code>{cmd}</code>
                            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(cmd, `install-${index}`)}>
                              {copied === `install-${index}` ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Alert>
                  <AlertDescription>{t("nodeSetup.installAlert")}</AlertDescription>
                </Alert>
              </div>
            </Card>
          </TabsContent>

          {/* Config Tab */}
          <TabsContent value="config" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <Server className="h-6 w-6 text-primary mt-1" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{t("nodeSetup.configureNode")}</h3>
                  <p className="text-muted-foreground mb-4">{t("nodeSetup.configDesc")}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">{t("nodeSetup.configLocation")}</h4>
                  <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                    <code>{t("nodeSetup.configPath")}</code>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">{t("nodeSetup.configExample")}</h4>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm relative">
                    <pre className="overflow-x-auto">{configExample}</pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(configExample, "config")}
                    >
                      {copied === "config" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Alert>
                  <AlertDescription>{t("nodeSetup.configAlert")}</AlertDescription>
                </Alert>

                <div>
                  <h4 className="text-sm font-medium mb-2">{t("nodeSetup.importantParams")}</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>
                      <strong className="text-foreground">{t("nodeSetup.nodeIdLabel")}</strong>:{" "}
                      {t("nodeSetup.nodeIdDesc")}
                    </li>
                    <li>
                      <strong className="text-foreground">{t("nodeSetup.walletAddressLabel")}</strong>:{" "}
                      {t("nodeSetup.walletAddressDesc")}
                    </li>
                    <li>
                      <strong className="text-foreground">{t("nodeSetup.networkPortLabel")}</strong>:{" "}
                      {t("nodeSetup.networkPortDesc")}
                    </li>
                    <li>
                      <strong className="text-foreground">{t("nodeSetup.dataDirLabel")}</strong>:{" "}
                      {t("nodeSetup.dataDirDesc")}
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Start Tab */}
          <TabsContent value="start" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <CheckCircle2 className="h-6 w-6 text-primary mt-1" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{t("nodeSetup.startNode")}</h3>
                  <p className="text-muted-foreground mb-4">{t("nodeSetup.startDesc")}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">{t("nodeSetup.startService")}</h4>
                  <div className="bg-muted p-3 rounded-lg font-mono text-sm flex items-center justify-between">
                    <code>{startCommand}</code>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(startCommand, "start")}>
                      {copied === "start" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">{t("nodeSetup.checkStatus")}</h4>
                  <div className="bg-muted p-3 rounded-lg font-mono text-sm flex items-center justify-between">
                    <code>{statusCommand}</code>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(statusCommand, "status")}>
                      {copied === "status" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-500">{t("nodeSetup.startSuccess")}</AlertDescription>
                </Alert>

                <div>
                  <h4 className="text-sm font-medium mb-2">{t("nodeSetup.otherCommands")}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between bg-muted p-2 rounded">
                      <code className="text-xs">sudo systemctl stop ashva-node</code>
                      <span className="text-muted-foreground text-xs">{t("nodeSetup.stopNode")}</span>
                    </div>
                    <div className="flex items-center justify-between bg-muted p-2 rounded">
                      <code className="text-xs">sudo systemctl restart ashva-node</code>
                      <span className="text-muted-foreground text-xs">{t("nodeSetup.restartNode")}</span>
                    </div>
                    <div className="flex items-center justify-between bg-muted p-2 rounded">
                      <code className="text-xs">sudo journalctl -u ashva-node -f</code>
                      <span className="text-muted-foreground text-xs">{t("nodeSetup.viewLogs")}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">{t("nodeSetup.nextSteps")}</h4>
                  <p className="text-sm text-muted-foreground mb-4">{t("nodeSetup.nextStepsDesc")}</p>
                  <Button className="w-full" onClick={() => router.push("/nodes")}>
                    {t("nodeSetup.goToMyNodes")}
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Help Section */}
        <Card className="mt-6 p-6 bg-muted/50">
          <h3 className="text-lg font-semibold mb-2">{t("nodeSetup.needHelp")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t("nodeSetup.helpDesc")}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              {t("nodeSetup.techDocs")}
            </Button>
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              {t("nodeSetup.commonIssues")}
            </Button>
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              {t("nodeSetup.communityHelp")}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
