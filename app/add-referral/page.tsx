"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserPlus, Check, X, ArrowLeft, Info, AlertCircle } from "lucide-react"

export default function AddReferralPage() {
  const router = useRouter()
  const [currentAddress, setCurrentAddress] = useState("")
  const [referralAddress, setReferralAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [hasReferrer, setHasReferrer] = useState(false)
  const [existingReferrer, setExistingReferrer] = useState("")

  useEffect(() => {
    const walletAddress = localStorage.getItem("walletAddress")
    if (!walletAddress) {
      router.push("/")
      return
    }
    setCurrentAddress(walletAddress)
    checkReferralStatus(walletAddress)
  }, [router])

  const checkReferralStatus = async (address: string) => {
    try {
      const response = await fetch(`/api/wallet/referral-status?address=${address}`)
      if (response.ok) {
        const data = await response.json()
        setHasReferrer(data.hasParent)
        setExistingReferrer(data.parentWallet || "")
      }
    } catch (error) {
      console.error("Error checking referral status:", error)
    } finally {
      setCheckingStatus(false)
    }
  }

  const validateAddress = (address: string) => {
    if (!address.trim()) {
      return "请输入邀请人地址"
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return "无效的钱包地址格式"
    }
    if (address.toLowerCase() === currentAddress.toLowerCase()) {
      return "不能填写自己的地址"
    }
    return null
  }

  const handleSubmit = async () => {
    const validationError = validateAddress(referralAddress)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/wallet/update-referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: currentAddress,
          referralAddress: referralAddress.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "更新邀请人失败")
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/member")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新邀请人失败")
    } finally {
      setLoading(false)
    }
  }

  if (checkingStatus) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="hover:bg-gray-800">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">填写邀请人</h1>
            <p className="text-xs text-gray-400">
              {currentAddress.slice(0, 6)}...{currentAddress.slice(-4)}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Status Card */}
        {hasReferrer ? (
          <Card className="p-4 border-green-500/50 bg-green-500/10">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20">
                <Check className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-500 mb-1">已有邀请人</h3>
                <p className="text-sm text-gray-400 mb-2">您的当前邀请人:</p>
                <div className="font-mono text-xs bg-gray-800 px-3 py-2 rounded">
                  {existingReferrer.slice(0, 10)}...{existingReferrer.slice(-8)}
                </div>
              </div>
            </div>
          </Card>
        ) : success ? (
          <Card className="p-6 border-green-500/50 bg-green-500/10 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-500 mb-1">提交成功！</h3>
                <p className="text-sm text-gray-400">正在跳转到会员中心...</p>
              </div>
            </div>
          </Card>
        ) : (
          <>
            {/* Info Alert */}
            <Alert className="border-blue-500/20 bg-blue-500/5">
              <Info className="w-4 h-4 text-blue-500" />
              <AlertDescription className="text-sm text-gray-300">
                <div className="font-semibold mb-2">为什么需要填写邀请人？</div>
                <ul className="space-y-1 text-xs">
                  <li>• 建立推荐关系，获得佣金返利</li>
                  <li>• 一级推荐享受 5-15% 佣金</li>
                  <li>• 二级推荐享受 2-8% 佣金</li>
                  <li>• 优先获得奖励和升级资格</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Input Card */}
            <Card className="p-6 bg-gray-900 border-gray-800">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10">
                  <UserPlus className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">输入邀请人地址</h3>
                  <p className="text-xs text-gray-400">请填写邀请您加入的用户钱包地址</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">邀请人钱包地址</label>
                  <Input
                    type="text"
                    placeholder="0x..."
                    value={referralAddress}
                    onChange={(e) => {
                      setReferralAddress(e.target.value)
                      setError("")
                    }}
                    disabled={loading}
                    className="font-mono bg-gray-800 border-gray-700"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <X className="w-4 h-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={loading || !referralAddress.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {loading ? "提交中..." : "确定提交"}
                </Button>
              </div>
            </Card>

            {/* Tips Card */}
            <Card className="p-4 bg-gray-900/50 border-gray-800">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                温馨提示
              </h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">1.</span>
                  <span>请确保填写正确的邀请人钱包地址</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">2.</span>
                  <span>邀请人关系一旦建立不可更改</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">3.</span>
                  <span>如无邀请人可联系客服获取默认邀请码</span>
                </li>
              </ul>
            </Card>
          </>
        )}
      </div>
    </main>
  )
}
