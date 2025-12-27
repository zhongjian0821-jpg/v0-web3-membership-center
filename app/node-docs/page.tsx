"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Server,
  Download,
  Settings,
  Play,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useTranslation } from "@/lib/i18n/context"

export default function NodeDocsPage() {
  const { t } = useTranslation()
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)

  const copyToClipboard = (text: string, commandId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCommand(commandId)
    setTimeout(() => setCopiedCommand(null), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/purchase">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                {t("nodeDocs.backToPurchase")}
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">{t("nodeDocs.title")}</h1>
              <p className="text-sm text-gray-400">{t("nodeDocs.subtitle")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Quick Navigation */}
        <Card className="mb-8 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Server className="w-5 h-5" />
              {t("nodeDocs.quickNav")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a href="#requirements" className="text-blue-400 hover:text-blue-300 transition-colors">
                → {t("nodeDocs.systemRequirements")}
              </a>
              <a href="#download" className="text-blue-400 hover:text-blue-300 transition-colors">
                → {t("nodeDocs.download")}
              </a>
              <a href="#configuration" className="text-blue-400 hover:text-blue-300 transition-colors">
                → {t("nodeDocs.configuration")}
              </a>
              <a href="#troubleshooting" className="text-blue-400 hover:text-blue-300 transition-colors">
                → {t("nodeDocs.troubleshooting")}
              </a>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800/50">
            <TabsTrigger value="overview">{t("nodeDocs.overview")}</TabsTrigger>
            <TabsTrigger value="installation">{t("nodeDocs.installation")}</TabsTrigger>
            <TabsTrigger value="configuration">{t("nodeDocs.configuration")}</TabsTrigger>
            <TabsTrigger value="maintenance">{t("nodeDocs.maintenance")}</TabsTrigger>
            <TabsTrigger value="faq">{t("nodeDocs.troubleshooting")}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">{t("nodeDocs.whatIsImageNode")}</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-4">
                <p>{t("nodeDocs.imageNodeDesc")}</p>

                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {t("nodeDocs.advantages")}
                    </h4>
                    <ul className="space-y-1 text-sm">
                      <li>• {t("nodeDocs.adv1")}</li>
                      <li>• {t("nodeDocs.adv2")}</li>
                      <li>• {t("nodeDocs.adv3")}</li>
                      <li>• {t("nodeDocs.adv4")}</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                    <h4 className="font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {t("nodeDocs.notes")}
                    </h4>
                    <ul className="space-y-1 text-sm">
                      <li>• {t("nodeDocs.note1")}</li>
                      <li>• {t("nodeDocs.note2")}</li>
                      <li>• {t("nodeDocs.note3")}</li>
                      <li>• {t("nodeDocs.note4")}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card id="requirements" className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">{t("nodeDocs.systemRequirements")}</CardTitle>
                <CardDescription>{t("nodeDocs.minRecConfig")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-300 mb-3">{t("nodeDocs.minConfig")}</h4>
                    <ul className="space-y-2 text-gray-400">
                      <li>
                        • <span className="text-white">{t("nodeDocs.cpu")}</span>: {t("nodeDocs.minCpu")}
                      </li>
                      <li>
                        • <span className="text-white">{t("nodeDocs.memory")}</span>: {t("nodeDocs.minMemory")}
                      </li>
                      <li>
                        • <span className="text-white">{t("nodeDocs.storage")}</span>: {t("nodeDocs.minStorage")}
                      </li>
                      <li>
                        • <span className="text-white">{t("nodeDocs.bandwidth")}</span>: {t("nodeDocs.minBandwidth")}
                      </li>
                      <li>
                        • <span className="text-white">{t("nodeDocs.os")}</span>: {t("nodeDocs.minOs")}
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-300 mb-3">{t("nodeDocs.recConfig")}</h4>
                    <ul className="space-y-2 text-gray-400">
                      <li>
                        • <span className="text-white">{t("nodeDocs.cpu")}</span>: {t("nodeDocs.recCpu")}
                      </li>
                      <li>
                        • <span className="text-white">{t("nodeDocs.memory")}</span>: {t("nodeDocs.recMemory")}
                      </li>
                      <li>
                        • <span className="text-white">{t("nodeDocs.storage")}</span>: {t("nodeDocs.recStorage")}
                      </li>
                      <li>
                        • <span className="text-white">{t("nodeDocs.bandwidth")}</span>: {t("nodeDocs.recBandwidth")}
                      </li>
                      <li>
                        • <span className="text-white">{t("nodeDocs.os")}</span>: {t("nodeDocs.recOs")}
                      </li>
                    </ul>
                  </div>
                </div>

                <Alert className="mt-6 bg-blue-900/20 border-blue-500/30">
                  <AlertDescription className="text-blue-300">
                    <strong>{t("nodeDocs.networkRequirements")}</strong>: {t("nodeDocs.firewallPorts")}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Installation Tab */}
          <TabsContent value="installation" className="space-y-6">
            <Card id="download" className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  {t("nodeDocs.download")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">{t("nodeDocs.downloadNodeSoftware")}</p>

                <div className="bg-gray-950 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">{t("nodeDocs.downloadCommand")}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          "wget https://releases.ashva.network/node/latest/ashva-node-linux-amd64.tar.gz",
                          "download-cmd",
                        )
                      }
                      className="h-7"
                    >
                      {copiedCommand === "download-cmd" ? t("nodeDocs.copied") : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                  <code className="text-green-400 text-sm">
                    wget https://releases.ashva.network/node/latest/ashva-node-linux-amd64.tar.gz
                  </code>
                </div>

                <div className="bg-gray-950 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">{t("nodeDocs.extractCommand")}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard("tar -xzf ashva-node-linux-amd64.tar.gz\ncd ashva-node", "extract-cmd")
                      }
                      className="h-7"
                    >
                      {copiedCommand === "extract-cmd" ? t("nodeDocs.copied") : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                  <code className="text-green-400 text-sm block">
                    tar -xzf ashva-node-linux-amd64.tar.gz
                    <br />
                    cd ashva-node
                  </code>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  {t("nodeDocs.installDependencies")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">{t("nodeDocs.installDependenciesDesc")}</p>

                <div className="bg-gray-950 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">{t("nodeDocs.ubuntuDebian")}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          "sudo apt-get update\nsudo apt-get install -y build-essential libssl-dev",
                          "deps-ubuntu",
                        )
                      }
                      className="h-7"
                    >
                      {copiedCommand === "deps-ubuntu" ? t("nodeDocs.copied") : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                  <code className="text-green-400 text-sm block">
                    sudo apt-get update
                    <br />
                    sudo apt-get install -y build-essential libssl-dev
                  </code>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  {t("nodeDocs.firstStart")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">{t("nodeDocs.firstStartDesc")}</p>

                <div className="bg-gray-950 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">{t("nodeDocs.initNode")}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard("./ashva-node init", "init-cmd")}
                      className="h-7"
                    >
                      {copiedCommand === "init-cmd" ? t("nodeDocs.copied") : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                  <code className="text-green-400 text-sm">./ashva-node init</code>
                </div>

                <Alert className="bg-yellow-900/20 border-yellow-500/30">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <AlertDescription className="text-yellow-300">
                    <strong>{t("nodeDocs.important")}</strong>: {t("nodeDocs.backupKeystore")}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="configuration" className="space-y-6">
            <Card id="configuration" className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">{t("nodeDocs.configFileDesc")}</CardTitle>
                <CardDescription>{t("nodeDocs.configFileItems")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">
                  {t("nodeDocs.configFileLoc")}
                  <code className="text-blue-400">~/.ashva/config.json</code>
                  {t("nodeDocs.configFileMainItems")}
                </p>

                <div className="bg-gray-950 border border-gray-700 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-300">
                    {`{
  "node_id": "your-node-id-here",
  "network": {
    "port": 30303,
    "rpc_port": 8545,
    "max_peers": 50
  },
  "resources": {
    "cpu_cores": 4,
    "memory_gb": 8,
    "storage_gb": 100
  },
  "wallet": {
    "address": "your-wallet-address"
  },
  "sync": {
    "mode": "full",
    "bootstrap_nodes": [
      "node1.ashva.network:30303",
      "node2.ashva.network:30303"
    ]
  }
}`}
                  </pre>
                </div>

                <div className="space-y-3 mt-4">
                  <div className="p-3 bg-gray-800 rounded">
                    <h4 className="font-semibold text-white mb-1">{t("nodeDocs.nodeId")}</h4>
                    <p className="text-sm text-gray-400">{t("nodeDocs.nodeIdDesc")}</p>
                  </div>
                  <div className="p-3 bg-gray-800 rounded">
                    <h4 className="font-semibold text-white mb-1">{t("nodeDocs.networkPort")}</h4>
                    <p className="text-sm text-gray-400">{t("nodeDocs.networkPortDesc")}</p>
                  </div>
                  <div className="p-3 bg-gray-800 rounded">
                    <h4 className="font-semibold text-white mb-1">{t("nodeDocs.networkRpcPort")}</h4>
                    <p className="text-sm text-gray-400">{t("nodeDocs.networkRpcPortDesc")}</p>
                  </div>
                  <div className="p-3 bg-gray-800 rounded">
                    <h4 className="font-semibold text-white mb-1">{t("nodeDocs.resources")}</h4>
                    <p className="text-sm text-gray-400">{t("nodeDocs.resourcesDesc")}</p>
                  </div>
                  <div className="p-3 bg-gray-800 rounded">
                    <h4 className="font-semibold text-white mb-1">{t("nodeDocs.walletAddress")}</h4>
                    <p className="text-sm text-gray-400">{t("nodeDocs.walletAddressDesc")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">{t("nodeDocs.startNode")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">{t("nodeDocs.startNodeDesc")}</p>

                <div className="bg-gray-950 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">{t("nodeDocs.foregroundRun")}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard("./ashva-node start", "start-fg")}
                      className="h-7"
                    >
                      {copiedCommand === "start-fg" ? t("nodeDocs.copied") : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                  <code className="text-green-400 text-sm">./ashva-node start</code>
                </div>

                <div className="bg-gray-950 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">{t("nodeDocs.backgroundRun")}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard("./ashva-node start --daemon", "start-daemon")}
                      className="h-7"
                    >
                      {copiedCommand === "start-daemon" ? t("nodeDocs.copied") : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                  <code className="text-green-400 text-sm">./ashva-node start --daemon</code>
                </div>

                <div className="bg-gray-950 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">{t("nodeDocs.useSystemd")}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          "sudo systemctl start ashva-node\nsudo systemctl enable ashva-node",
                          "systemd-cmd",
                        )
                      }
                      className="h-7"
                    >
                      {copiedCommand === "systemd-cmd" ? t("nodeDocs.copied") : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                  <code className="text-green-400 text-sm block">
                    sudo systemctl start ashva-node
                    <br />
                    sudo systemctl enable ashva-node
                  </code>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">{t("nodeDocs.dailyMaintenance")}</CardTitle>
                <CardDescription>{t("nodeDocs.maintenanceDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">{t("nodeDocs.checkNodeStatus")}</h4>
                    <div className="bg-gray-950 border border-gray-700 rounded p-3 mb-2">
                      <code className="text-green-400 text-sm">./ashva-node status</code>
                    </div>
                    <p className="text-sm text-gray-400">{t("nodeDocs.checkNodeStatusDesc")}</p>
                  </div>

                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">{t("nodeDocs.viewLogs")}</h4>
                    <div className="bg-gray-950 border border-gray-700 rounded p-3 mb-2">
                      <code className="text-green-400 text-sm">tail -f ~/.ashva/logs/node.log</code>
                    </div>
                    <p className="text-sm text-gray-400">{t("nodeDocs.viewLogsDesc")}</p>
                  </div>

                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">{t("nodeDocs.updateNodeSoftware")}</h4>
                    <div className="bg-gray-950 border border-gray-700 rounded p-3 mb-2">
                      <code className="text-green-400 text-sm block">
                        ./ashva-node stop
                        <br />
                        wget https://releases.ashva.network/node/latest/ashva-node-linux-amd64.tar.gz
                        <br />
                        tar -xzf ashva-node-linux-amd64.tar.gz
                        <br />
                        ./ashva-node start --daemon
                      </code>
                    </div>
                    <p className="text-sm text-gray-400">{t("nodeDocs.updateNodeSoftwareDesc")}</p>
                  </div>

                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">{t("nodeDocs.backupKeys")}</h4>
                    <div className="bg-gray-950 border border-gray-700 rounded p-3 mb-2">
                      <code className="text-green-400 text-sm">cp ~/.ashva/keystore/* /backup/location/</code>
                    </div>
                    <p className="text-sm text-gray-400">{t("nodeDocs.backupKeysDesc")}</p>
                  </div>
                </div>

                <Alert className="bg-blue-900/20 border-blue-500/30 mt-4">
                  <AlertDescription className="text-blue-300">
                    <strong>{t("nodeDocs.suggestion")}</strong>: {t("nodeDocs.checkNodeStatusSuggestion")}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">{t("nodeDocs.performanceOptimization")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-gray-800 rounded">
                  <h4 className="font-semibold text-white mb-2">{t("nodeDocs.adjustMaxPeers")}</h4>
                  <p className="text-sm text-gray-400 mb-2">{t("nodeDocs.adjustMaxPeersDesc")}</p>
                  <code className="text-blue-400 text-sm">"max_peers": 100</code>
                </div>

                <div className="p-3 bg-gray-800 rounded">
                  <h4 className="font-semibold text-white mb-2">{t("nodeDocs.useSsdStorage")}</h4>
                  <p className="text-sm text-gray-400">{t("nodeDocs.useSsdStorageDesc")}</p>
                </div>

                <div className="p-3 bg-gray-800 rounded">
                  <h4 className="font-semibold text-white mb-2">{t("nodeDocs.increaseMemory")}</h4>
                  <p className="text-sm text-gray-400">{t("nodeDocs.increaseMemoryDesc")}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-6">
            <Card id="troubleshooting" className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">{t("nodeDocs.troubleshooting")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">{t("nodeDocs.qNodeNotStart")}</h4>
                    <p className="text-sm text-gray-400 mb-2">{t("nodeDocs.qNodeNotStartDesc")}</p>
                    <ul className="list-disc list-inside text-sm text-gray-400 space-y-1 ml-4">
                      <li>{t("nodeDocs.qNodeNotStartPoint1")}</li>
                      <li>{t("nodeDocs.qNodeNotStartPoint2")}</li>
                      <li>{t("nodeDocs.qNodeNotStartPoint3")}</li>
                      <li>{t("nodeDocs.qNodeNotStartPoint4")}</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">{t("nodeDocs.qNodeSyncSlow")}</h4>
                    <p className="text-sm text-gray-400">{t("nodeDocs.qNodeSyncSlowDesc")}</p>
                  </div>

                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">{t("nodeDocs.qNodeRewards")}</h4>
                    <p className="text-sm text-gray-400">{t("nodeDocs.qNodeRewardsDesc")}</p>
                  </div>

                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">{t("nodeDocs.qMultipleNodes")}</h4>
                    <p className="text-sm text-gray-400">{t("nodeDocs.qMultipleNodesDesc")}</p>
                  </div>

                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">{t("nodeDocs.qNodeOffline")}</h4>
                    <p className="text-sm text-gray-400">{t("nodeDocs.qNodeOfflineDesc")}</p>
                  </div>

                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">{t("nodeDocs.qUpgradeConfig")}</h4>
                    <p className="text-sm text-gray-400">{t("nodeDocs.qUpgradeConfigDesc")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">{t("nodeDocs.needHelp")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded">
                  <ExternalLink className="w-5 h-5 text-blue-400" />
                  <div>
                    <h4 className="font-semibold text-white">{t("nodeDocs.technicalDocs")}</h4>
                    <a href="https://docs.ashva.network" className="text-sm text-blue-400 hover:underline">
                      https://docs.ashva.network
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded">
                  <ExternalLink className="w-5 h-5 text-blue-400" />
                  <div>
                    <h4 className="font-semibold text-white">{t("nodeDocs.faq")}</h4>
                    <a href="https://forum.ashva.network" className="text-sm text-blue-400 hover:underline">
                      https://forum.ashva.network
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded">
                  <ExternalLink className="w-5 h-5 text-blue-400" />
                  <div>
                    <h4 className="font-semibold text-white">{t("nodeDocs.communitySupport")}</h4>
                    <p className="text-sm text-gray-400">support@ashva.network</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Help Section */}
        <Card className="mt-8 p-6 bg-muted/50">
          <h3 className="text-lg font-semibold mb-2">{t("nodeDocs.getHelp")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t("nodeDocs.helpDesc")}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              {t("nodeDocs.technicalDocs")}
            </Button>
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              {t("nodeDocs.faq")}
            </Button>
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              {t("nodeDocs.communitySupport")}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
