"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, ExternalLink, Users } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

interface WalletInfoProps {
  address: string
  level: number
  totalRewards: string
  teamSize: number
  directReferrals: number
  joinDate: string
}

export function WalletInfo({ address, level, totalRewards, teamSize, directReferrals, joinDate }: WalletInfoProps) {
  const { t } = useTranslation()

  const copyAddress = () => {
    navigator.clipboard.writeText(address)
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-foreground">{t("wallet.myWallet")}</h3>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {t("wallet.level")} {level}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-sm text-muted-foreground font-mono">{formatAddress(address)}</code>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAddress}>
              <Copy className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
              <a href={`https://etherscan.io/address/${address}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t("wallet.totalRewards")}</p>
          <p className="text-lg font-semibold text-accent">{totalRewards} ASHVA</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t("wallet.teamSize")}</p>
          <p className="text-lg font-semibold text-foreground flex items-center gap-1">
            <Users className="h-4 w-4" />
            {teamSize}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t("wallet.directReferrals")}</p>
          <p className="text-lg font-semibold text-foreground">{directReferrals}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t("wallet.joinDate")}</p>
          <p className="text-lg font-semibold text-foreground">{joinDate}</p>
        </div>
      </div>
    </Card>
  )
}
