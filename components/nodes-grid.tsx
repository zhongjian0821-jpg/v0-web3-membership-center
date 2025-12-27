"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Server, Circle, MoreVertical } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

const nodes = [
  { id: "Node-001", status: "active", uptime: "99.9%", rewards: "124.5 ASHVA", location: "US-East" },
  { id: "Node-002", status: "active", uptime: "99.7%", rewards: "118.2 ASHVA", location: "EU-West" },
  { id: "Node-003", status: "active", uptime: "100%", rewards: "132.1 ASHVA", location: "Asia-Pacific" },
  { id: "Node-004", status: "syncing", uptime: "98.5%", rewards: "95.8 ASHVA", location: "US-West" },
  { id: "Node-005", status: "active", uptime: "99.8%", rewards: "128.9 ASHVA", location: "EU-Central" },
  { id: "Node-006", status: "active", uptime: "99.6%", rewards: "115.3 ASHVA", location: "South America" },
]

export function NodesGrid() {
  const { t } = useTranslation()

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground">{t("nodes.title")}</CardTitle>
          <Button size="sm" variant="outline">
            {t("actions.addNode")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodes.map((node) => (
            <Card key={node.id} className="bg-secondary/50 border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Server className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{node.id}</p>
                      <p className="text-xs text-muted-foreground">{node.location}</p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("nodes.status")}</span>
                    <Badge
                      variant={node.status === "active" ? "default" : "secondary"}
                      className={node.status === "active" ? "bg-accent/20 text-accent hover:bg-accent/30" : ""}
                    >
                      <Circle className="h-2 w-2 mr-1 fill-current" />
                      {node.status === "active" ? t("nodes.active") : t("actions.syncing")}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("nodeStats.uptime")}</span>
                    <span className="text-sm font-medium text-foreground">{node.uptime}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("nodes.earnings")}</span>
                    <span className="text-sm font-semibold text-primary">{node.rewards}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
