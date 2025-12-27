"use client"

import { useEffect, useState } from "react"
import { useWallet } from "@/lib/wallet-provider"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, Percent, Save } from "lucide-react"

export default function CommissionManagePage() {
  const router = useRouter()
  const { address, isConnected } = useWallet()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [memberLevel, setMemberLevel] = useState<string>("normal")
  const [memberLevelName, setMemberLevelName] = useState<string>("")
  const [extraRewardRight, setExtraRewardRight] = useState(10)

  const [selfRate, setSelfRate] = useState(0)
  const [extraMarketPartner, setExtraMarketPartner] = useState(0)
  const [extraLevel1, setExtraLevel1] = useState(0)
  const [extraLevel2, setExtraLevel2] = useState(0)

  const BASE_MARKET_PARTNER = 10 // 市场合伙人保底
  const BASE_LEVEL1 = 3 // 直推保底
  const BASE_LEVEL2 = 2 // 间推保底

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    if (!isConnected || !address) {
      router.push("/")
      return
    }

    const fetchData = async () => {
      try {
        const memberRes = await fetch(`/api/member?address=${address}`)
        if (!memberRes.ok) {
          throw new Error("Failed to fetch member data")
        }

        const memberData = await memberRes.json()
        const level = memberData.memberType || "normal"

        setMemberLevel(level)

        if (level === "global_partner") {
          setMemberLevelName("全球合伙人")
          setExtraRewardRight(5)
        } else if (level === "market_partner") {
          setMemberLevelName("市场合伙人")
          setExtraRewardRight(10)
        } else {
          router.push("/member")
          return
        }

        const configRes = await fetch(`/api/commission-config?address=${address}`)
        if (configRes.ok) {
          const configData = await configRes.json()

          if (configData.selfRate !== undefined) {
            setSelfRate(configData.selfRate)
          }

          if (configData.marketPartnerRate !== undefined && level === "global_partner") {
            const extraMP = Math.max(0, configData.marketPartnerRate - BASE_MARKET_PARTNER)
            setExtraMarketPartner(extraMP)
          }

          if (configData.level1 !== undefined) {
            const extraL1 = Math.max(0, configData.level1 - BASE_LEVEL1)
            setExtraLevel1(extraL1)
          }

          if (configData.level2 !== undefined) {
            const extraL2 = Math.max(0, configData.level2 - BASE_LEVEL2)
            setExtraLevel2(extraL2)
          }
        }

        setLoading(false)
      } catch (error) {
        console.error("[v0] Error:", error)
        setLoading(false)
      }
    }

    fetchData()
  }, [mounted, isConnected, address, router])

  const totalExtraAllocated =
    memberLevel === "global_partner"
      ? selfRate + extraMarketPartner + extraLevel1 + extraLevel2
      : selfRate + extraLevel1 + extraLevel2

  const remaining = extraRewardRight - totalExtraAllocated
  const isOverAllocated = totalExtraAllocated > extraRewardRight

  const finalLevel1 = BASE_LEVEL1 + extraLevel1
  const finalLevel2 = BASE_LEVEL2 + extraLevel2
  const finalMarketPartner = BASE_MARKET_PARTNER + extraMarketPartner

  const maxSelfRate = Math.max(0, extraRewardRight - (extraMarketPartner + extraLevel1 + extraLevel2))
  const maxExtraMarketPartner =
    memberLevel === "global_partner" ? Math.max(0, extraRewardRight - (selfRate + extraLevel1 + extraLevel2)) : 0
  const maxExtraLevel1 =
    memberLevel === "global_partner"
      ? Math.max(0, extraRewardRight - (selfRate + extraMarketPartner + extraLevel2))
      : Math.max(0, extraRewardRight - (selfRate + extraLevel2))
  const maxExtraLevel2 =
    memberLevel === "global_partner"
      ? Math.max(0, extraRewardRight - (selfRate + extraMarketPartner + extraLevel1))
      : Math.max(0, extraRewardRight - (selfRate + extraLevel1))

  const handleSave = async () => {
    if (isOverAllocated) {
      alert(`额外分配总额 ${totalExtraAllocated.toFixed(1)}% 超过了您的额外收益权 ${extraRewardRight}%`)
      return
    }

    setSaving(true)
    try {
      const payload: any = {
        address: address,
        selfRate,
        level1: finalLevel1,
        level2: finalLevel2,
      }

      if (memberLevel === "global_partner") {
        payload.marketPartnerRate = finalMarketPartner
      }

      const response = await fetch("/api/commission-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "保存失败")
      }

      alert("佣金分配已保存！")
    } catch (error) {
      console.error("[v0] Save error:", error)
      alert(`保存失败：${error instanceof Error ? error.message : "请重试"}`)
    } finally {
      setSaving(false)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-amber-500 hover:text-amber-400"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">佣金分配管理</h1>
            <p className="text-zinc-400 text-sm">{memberLevelName}</p>
          </div>
        </div>

        <Card className="bg-zinc-900 border-amber-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Percent className="h-5 w-5 text-amber-500" />
              收益权概览
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-zinc-400">额外收益权</p>
                <p className="text-2xl font-bold text-amber-500">{extraRewardRight}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-zinc-400">已分配</p>
                <p className={`text-2xl font-bold ${isOverAllocated ? "text-red-500" : "text-blue-500"}`}>
                  {totalExtraAllocated.toFixed(1)}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-zinc-400">剩余可分配</p>
                <p className={`text-2xl font-bold ${remaining < 0 ? "text-red-500" : "text-green-500"}`}>
                  {remaining.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 space-y-1">
              <p className="text-blue-400 text-sm font-semibold">💡 佣金体系说明：</p>
              {memberLevel === "global_partner" && (
                <>
                  <p className="text-blue-300 text-xs">
                    • 下级保底佣金（固定）：市场合伙人 {BASE_MARKET_PARTNER}% + 直推 {BASE_LEVEL1}% + 间推 {BASE_LEVEL2}
                    % = {BASE_MARKET_PARTNER + BASE_LEVEL1 + BASE_LEVEL2}%
                  </p>
                  <p className="text-blue-300 text-xs">• 您的额外收益权：{extraRewardRight}%（可自由分配）</p>
                  <p className="text-blue-300 text-xs">
                    • 系统总收益权：{BASE_MARKET_PARTNER + BASE_LEVEL1 + BASE_LEVEL2 + extraRewardRight}%（保底 +
                    您的额外收益权）
                  </p>
                </>
              )}
              {memberLevel === "market_partner" && (
                <>
                  <p className="text-blue-300 text-xs">
                    • 基础佣金（固定）：直推 {BASE_LEVEL1}% + 间推 {BASE_LEVEL2}% = {BASE_LEVEL1 + BASE_LEVEL2}%
                  </p>
                  <p className="text-blue-300 text-xs">• 您的额外收益权：{extraRewardRight}%（可自由分配）</p>
                  <p className="text-blue-300 text-xs">
                    • 系统总收益权：{BASE_LEVEL1 + BASE_LEVEL2 + extraRewardRight}%（保底 + 您的额外收益权）
                  </p>
                </>
              )}
            </div>

            {isOverAllocated ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-500 text-sm">
                  ⚠️ 额外分配总额超过了您的收益权 {Math.abs(remaining).toFixed(1)}%，请调整分配比例
                </p>
              </div>
            ) : remaining > 0 ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <p className="text-green-500 text-sm">✓ 您还剩 {remaining.toFixed(1)}% 可额外分配</p>
              </div>
            ) : (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <p className="text-green-500 text-sm">✓ 已完美分配您的 {extraRewardRight}% 额外收益权</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-white">佣金分配设置</CardTitle>
            <CardDescription className="text-zinc-400">
              使用滑块调整您的 {extraRewardRight}% 额外收益权分配。
              {memberLevel === "global_partner"
                ? "市场合伙人、直推和间推在保底佣金之上可获得额外奖励"
                : "直推和间推在基础佣金之上可获得额外奖励"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-white text-lg">自己保留</Label>
                <div className="text-2xl font-bold text-amber-500">{selfRate.toFixed(1)}%</div>
              </div>
              <Slider
                value={[selfRate]}
                onValueChange={(value) => setSelfRate(Math.min(value[0], maxSelfRate))}
                min={0}
                max={Math.max(0, maxSelfRate)}
                step={0.5}
                className="w-full"
              />
              <p className="text-xs text-zinc-400">
                您可以保留 0% 到 {Math.max(0, maxSelfRate).toFixed(1)}% 之间的任意比例。剩余部分可分配给直推和间推
              </p>
            </div>

            <div className="border-t border-zinc-800 pt-6 space-y-6">
              {memberLevel === "global_partner" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white text-lg">市场合伙人奖励</Label>
                      <p className="text-xs text-zinc-400 mt-1">
                        保底 {BASE_MARKET_PARTNER}%，可增加到{" "}
                        {(BASE_MARKET_PARTNER + Math.max(0, maxExtraMarketPartner)).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-cyan-500">{finalMarketPartner.toFixed(1)}%</div>
                      {extraMarketPartner > 0 && (
                        <div className="text-xs text-green-500">
                          {BASE_MARKET_PARTNER}% + {extraMarketPartner.toFixed(1)}% 额外
                        </div>
                      )}
                    </div>
                  </div>
                  <Slider
                    value={[extraMarketPartner]}
                    onValueChange={(value) => setExtraMarketPartner(Math.min(value[0], maxExtraMarketPartner))}
                    min={0}
                    max={Math.max(0, maxExtraMarketPartner)}
                    step={0.5}
                    className="w-full"
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white text-lg">直推奖励</Label>
                    <p className="text-xs text-zinc-400 mt-1">
                      保底 {BASE_LEVEL1}%，可增加到 {(BASE_LEVEL1 + Math.max(0, maxExtraLevel1)).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-500">{finalLevel1.toFixed(1)}%</div>
                    {extraLevel1 > 0 && (
                      <div className="text-xs text-green-500">
                        {BASE_LEVEL1}% + {extraLevel1.toFixed(1)}% 额外
                      </div>
                    )}
                  </div>
                </div>
                <Slider
                  value={[extraLevel1]}
                  onValueChange={(value) => setExtraLevel1(Math.min(value[0], maxExtraLevel1))}
                  min={0}
                  max={Math.max(0, maxExtraLevel1)}
                  step={0.5}
                  className="w-full"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white text-lg">间推奖励</Label>
                    <p className="text-xs text-zinc-400 mt-1">
                      保底 {BASE_LEVEL2}%，可增加到 {(BASE_LEVEL2 + Math.max(0, maxExtraLevel2)).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-500">{finalLevel2.toFixed(1)}%</div>
                    {extraLevel2 > 0 && (
                      <div className="text-xs text-green-500">
                        {BASE_LEVEL2}% + {extraLevel2.toFixed(1)}% 额外
                      </div>
                    )}
                  </div>
                </div>
                <Slider
                  value={[extraLevel2]}
                  onValueChange={(value) => setExtraLevel2(Math.min(value[0], maxExtraLevel2))}
                  min={0}
                  max={Math.max(0, maxExtraLevel2)}
                  step={0.5}
                  className="w-full"
                />
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-white">分配说明：</p>
              <div className="space-y-1 text-xs text-zinc-400">
                <p>• 您的团队成员购买节点时，将按以下比例获得奖励：</p>
                <p className="ml-4">- 您自己：{selfRate.toFixed(1)}%</p>
                {memberLevel === "global_partner" && (
                  <p className="ml-4">
                    - 市场合伙人：{finalMarketPartner.toFixed(1)}%{" "}
                    <span className="text-zinc-500">
                      ({BASE_MARKET_PARTNER}% 保底
                      {extraMarketPartner > 0 && (
                        <span className="text-green-500"> + {extraMarketPartner.toFixed(1)}% 您的额外奖励</span>
                      )}
                      )
                    </span>
                  </p>
                )}
                <p className="ml-4">
                  - 直推成员：{finalLevel1.toFixed(1)}%{" "}
                  <span className="text-zinc-500">
                    ({BASE_LEVEL1}% 保底
                    {extraLevel1 > 0 && (
                      <span className="text-green-500"> + {extraLevel1.toFixed(1)}% 您的额外奖励</span>
                    )}
                    )
                  </span>
                </p>
                <p className="ml-4">
                  - 间推成员：{finalLevel2.toFixed(1)}%{" "}
                  <span className="text-zinc-500">
                    ({BASE_LEVEL2}% 保底
                    {extraLevel2 > 0 && (
                      <span className="text-green-500"> + {extraLevel2.toFixed(1)}% 您的额外奖励</span>
                    )}
                    )
                  </span>
                </p>
                <p className="mt-2 font-semibold text-white">
                  • 您的 {extraRewardRight}% 额外收益权已分配：{totalExtraAllocated.toFixed(1)}% / {extraRewardRight}%
                  {remaining !== 0 && (
                    <span className={remaining > 0 ? "text-green-500" : "text-red-500"}>
                      {" "}
                      ({remaining > 0 ? "剩余" : "超出"} {Math.abs(remaining).toFixed(1)}%)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-zinc-700 text-white hover:bg-zinc-800"
          >
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || isOverAllocated}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "保存中..." : "保存分配"}
          </Button>
        </div>
      </div>
    </div>
  )
}
