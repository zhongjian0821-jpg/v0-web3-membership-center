"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, Wallet, Users, Smartphone, Monitor, QrCode, UserPlus } from "lucide-react"
import { useWallet } from "@/lib/wallet-provider"
import { useIsMobile } from "@/hooks/use-mobile"
import type { Address } from "viem"
import { useLanguage } from "@/lib/i18n/context"
import { LanguageSelector } from "@/components/language-selector"
import { Contract } from "ethers"

const ASHVA_CONTRACT = "0xea75cb12bbe6232eb082b365f450d3fe06d02fb3" as Address

const ERC20_ABI = [
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const

export default function LoginPage() {
  const { t } = useLanguage()

  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const referralCode = searchParams.get("ref") || searchParams.get("referral")

  const [error, setError] = useState("")
  const [verifying, setVerifying] = useState(false)
  const verifyingRef = useRef(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const connectingRef = useRef(false)

  const isMobile = useIsMobile()
  const { address, isConnected, connect, disconnect, provider } = useWallet()
  const [connectStatus, setConnectStatus] = useState<"idle" | "pending" | "success" | "error">("idle")
  const [connectError, setConnectError] = useState<Error | null>(null)

  const [isReturningUser, setIsReturningUser] = useState(false)
  const [justLoggedOut, setJustLoggedOut] = useState(false)

  const [showReferralInput, setShowReferralInput] = useState(false)
  const [referralAddress, setReferralAddress] = useState("")
  const [referralError, setReferralError] = useState("")
  const [isNewUser, setIsNewUser] = useState(false)

  useEffect(() => {
    setMounted(true)
    const storedAddress = localStorage.getItem("walletAddress")
    const logoutFlag = localStorage.getItem("justLoggedOut")
    if (logoutFlag === "true") {
      setJustLoggedOut(true)
      localStorage.removeItem("justLoggedOut")
      disconnect()
      const wagmiKeys = Object.keys(localStorage).filter(
        (key) => key.startsWith("wagmi.") || key.startsWith("wc@2") || key.startsWith("@w3m"),
      )
      wagmiKeys.forEach((key) => localStorage.removeItem(key))
    }
    if (storedAddress && isConnected && address && storedAddress.toLowerCase() === address.toLowerCase()) {
      setIsReturningUser(true)
    }
  }, [])

  useEffect(() => {
    if (referralCode) {
      localStorage.setItem("referralCode", referralCode)
    }
  }, [referralCode])

  useEffect(() => {
    console.log("[v0] Connect status changed:", connectStatus)
    if (connectStatus === "success") {
      console.log("[v0] Connection successful!")
      setIsConnecting(false)
      connectingRef.current = false
    } else if (connectStatus === "error") {
      console.log("[v0] Connection error:", connectError?.message)
      setIsConnecting(false)
      connectingRef.current = false
      if (connectError?.message) {
        if (connectError.message.includes("User rejected") || connectError.message.includes("user rejected")) {
          setError(t("login.userRejected") || "用户取消了连接")
        } else {
          setError(connectError.message)
        }
      }
    } else if (connectStatus === "pending") {
      console.log("[v0] Connection pending...")
    }
  }, [connectStatus, connectError])

  useEffect(() => {
    if (isConnected && address && !verifying && !verifyingRef.current && !justLoggedOut) {
      verifyingRef.current = true
      setTimeout(() => {
        verifyAndLogin(address)
      }, 100)
    } else if (justLoggedOut && isConnected) {
      console.log("[v0] Disconnecting wallet after logout")
      disconnect()
    }
  }, [isConnected, address, justLoggedOut])

  const verifyAndLogin = async (walletAddress: string) => {
    try {
      setVerifying(true)
      setError("")

      if (typeof window === "undefined") {
        console.error("[v0] verifyAndLogin called on server, skipping")
        return
      }

      if (!provider) {
        throw new Error(t("login.cannotConnectToBlockchain"))
      }

      let balance: bigint
      let decimals = 18

      const retryWithBackoff = async <T,>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            return await fn()
          } catch (error: any) {
            if (i === maxRetries - 1) throw error

            const delay = baseDelay * Math.pow(2, i)
            console.log(`[v0] Retry ${i + 1}/${maxRetries} after ${delay}ms`)
            await new Promise((resolve) => setTimeout(resolve, delay))
          }
        }
        throw new Error(t("login.maxRetriesReached"))
      }

      try {
        console.log("[v0] Fetching balance for:", walletAddress)
        const contract = new Contract(ASHVA_CONTRACT, ERC20_ABI, provider)
        const balanceResult = await retryWithBackoff(() => contract.balanceOf(walletAddress))
        balance = BigInt(balanceResult.toString())
        console.log("[v0] Balance fetched:", balance.toString())
      } catch (balanceError: any) {
        console.error("[v0] Error fetching balance:", balanceError)
        throw new Error(t("login.networkTimeoutOrWalletNotConnected"))
      }

      try {
        const contract = new Contract(ASHVA_CONTRACT, ERC20_ABI, provider)
        const decimalsResult = await retryWithBackoff(() => contract.decimals())
        decimals = Number(decimalsResult)
        console.log("[v0] Decimals fetched:", decimals)
      } catch (decimalsError) {
        console.warn("[v0] Error fetching decimals, using default 18:", decimalsError)
        decimals = 18
      }

      const formattedBalance = Number(balance) / 10 ** decimals
      const numericBalance = formattedBalance

      console.log("[v0] Balance check:", { balance: balance.toString(), decimals, formattedBalance, numericBalance })

      if (balance === 0n || numericBalance === 0) {
        localStorage.removeItem("walletAddress")
        router.push(`/require-token?wallet=${walletAddress}`)
        setVerifying(false)
        verifyingRef.current = false
        return
      }

      const storedReferralCode = localStorage.getItem("referralCode")

      try {
        const result = await saveWalletToDatabase(walletAddress, numericBalance, storedReferralCode || undefined)

        if (result.needsReferral) {
          console.log("[v0] New user needs to enter referral address")
          setShowReferralInput(true)
          setIsNewUser(true)
          setVerifying(false)
          verifyingRef.current = false
          return
        }

        if (storedReferralCode) {
          localStorage.removeItem("referralCode")
        }

        localStorage.setItem("walletAddress", walletAddress)
        router.push("/member")
      } catch (dbError: any) {
        if (dbError.message.includes("needsReferral") || dbError.message.includes("请输入邀请人地址")) {
          console.log("[v0] New user needs to enter referral address")
          setShowReferralInput(true)
          setIsNewUser(true)
          setVerifying(false)
          verifyingRef.current = false
          return
        }
        console.error("Database save error:", dbError)
        throw dbError
      }
    } catch (err: any) {
      console.error("Verification error:", err)
      setError(err.message || t("login.verificationFailed"))
      if (err.message !== t("login.verificationFailed")) {
        disconnect()
      }
      verifyingRef.current = false
      setVerifying(false)
    }
  }

  const saveWalletToDatabase = async (address: string, balance: number, referralWallet?: string) => {
    const response = await fetch("/api/wallet/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, balance, referralWallet }),
    })

    const data = await response.json()

    if (response.status === 202 && data.needsReferral) {
      return data
    }

    if (!response.ok) {
      throw new Error(data.error || t("login.saveWalletFailed"))
    }

    return data
  }

  const handleConnectClick = async () => {
    try {
      console.log("[v0] Calling connect()...")
      await connect()
      console.log("[v0] Wallet connected successfully, address:", address)
    } catch (error: any) {
      console.error("[v0] Wallet connect error:", error)
    }
  }

  const handleReferralSubmit = async () => {
    if (!referralAddress.trim()) {
      setReferralError(t("login.referralRequired"))
      return
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(referralAddress.trim())) {
      setReferralError(t("login.invalidAddress"))
      return
    }

    if (address && referralAddress.toLowerCase() === address.toLowerCase()) {
      setReferralError(t("login.cannotReferSelf"))
      return
    }

    setReferralError("")
    setVerifying(true)

    try {
      if (!address) {
        throw new Error(t("login.walletNotConnected"))
      }

      const contract = new Contract(ASHVA_CONTRACT, ERC20_ABI, provider)
      const balance = await contract.balanceOf(address)

      const decimals = await contract.decimals()

      const numericBalance = Number(balance) / 10 ** decimals

      await saveWalletToDatabase(address, numericBalance, referralAddress.trim())

      localStorage.setItem("walletAddress", address)
      router.push("/member")
    } catch (err: any) {
      console.error("Referral submission error:", err)
      setReferralError(err.message || t("login.referralSubmitFailed"))
      setVerifying(false)
    }
  }

  const handleSkipReferral = async () => {
    setVerifying(true)
    setError("")

    try {
      if (!address) {
        throw new Error(t("login.walletNotConnected"))
      }

      console.log("[v0] Skipping referral, using default upline")

      const contract = new Contract(ASHVA_CONTRACT, ERC20_ABI, provider)
      const balance = await contract.balanceOf(address)

      const decimals = await contract.decimals()

      const numericBalance = Number(balance) / 10 ** decimals

      console.log("[v0] Saving wallet to database without referral")
      await saveWalletToDatabase(address, numericBalance, undefined)

      localStorage.setItem("walletAddress", address)
      console.log("[v0] Navigating to /member")
      router.push("/member")
    } catch (err: any) {
      console.error("[v0] Skip referral error:", err)
      setError(err.message || t("login.skipReferralFailed"))
      setVerifying(false)
    }
  }

  if (!mounted) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 border-primary/20">
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">{t("loading")}</p>
          </div>
        </Card>
      </main>
    )
  }

  if (showReferralInput && isConnected && address) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="fixed top-4 right-4 z-50">
          <LanguageSelector />
        </div>

        <Card className="w-full max-w-md p-8 border-primary/20">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <UserPlus className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-balance text-center">{t("login.enterReferral")}</h1>
            <p className="text-muted-foreground text-sm mt-2 text-center">{t("login.referralDescription")}</p>
            <div className="mt-3 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-md">
              <p className="text-xs text-blue-600">
                {t("login.connectedAs")}: {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            </div>
          </div>

          {referralError && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{referralError}</p>
            </div>
          )}

          {verifying && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin shrink-0" />
              <p className="text-sm text-blue-500">{t("login.processing")}</p>
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="referral">{t("login.referralLabel")}</Label>
              <Input
                id="referral"
                type="text"
                placeholder="0x..."
                value={referralAddress}
                onChange={(e) => setReferralAddress(e.target.value)}
                disabled={verifying}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">{t("login.referralHint")}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleReferralSubmit}
              disabled={verifying || !referralAddress.trim()}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("login.processing")}
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t("login.confirmReferral")}
                </>
              )}
            </Button>

            <Button
              onClick={handleSkipReferral}
              disabled={verifying}
              variant="outline"
              className="w-full h-12 bg-transparent"
            >
              {t("login.skipReferral")}
            </Button>
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">{t("login.referralNote")}</p>
          </div>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      <Card className="w-full max-w-md p-8 border-primary/20">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-balance text-center bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            {t("welcome")} Ashva
          </h1>
          <p className="text-muted-foreground text-sm mt-2 text-center">{t("login.subtitle")}</p>
          {referralCode && (
            <div className="mt-3 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-md">
              <p className="text-xs text-green-600 flex items-center gap-2">
                <Users className="w-3 h-3" />
                {t("login.referralJoin")}
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {verifying && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin shrink-0" />
            <p className="text-sm text-blue-500">{t("login.verifying")}</p>
          </div>
        )}

        {isConnecting && !isConnected && (
          <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin shrink-0 text-cyan-500" />
            <p className="text-sm text-cyan-500">
              {isMobile ? "请在钱包应用中确认连接..." : "请扫描二维码或在钱包应用中确认..."}
            </p>
          </div>
        )}

        <div className="space-y-3 flex justify-center">
          {!isConnected ? (
            <Button
              onClick={handleConnectClick}
              disabled={verifying || isConnecting || connectStatus === "pending"}
              className="w-full h-14 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isConnecting || connectStatus === "pending" ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isMobile ? "连接中..." : "等待扫码..."}
                </>
              ) : (
                <>
                  {isMobile ? <Wallet className="w-5 h-5 mr-2" /> : <QrCode className="w-5 h-5 mr-2" />}
                  {verifying ? t("login.connecting") : isMobile ? t("login.connectWallet") : t("login.scanLogin")}
                </>
              )}
            </Button>
          ) : (
            <div className="w-full text-center text-sm text-muted-foreground">
              {t("login.connected")}: {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          )}
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">{t("login.connectionInfo")}</span>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          {isMobile ? (
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-500" />
                {t("login.mobileConnect")}
              </p>
              <p className="text-xs text-muted-foreground ml-6">{t("login.mobileInstruction")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Monitor className="w-4 h-4 text-blue-500" />
                {t("login.desktopConnect")}
              </p>
              <p className="text-xs text-muted-foreground ml-6">{t("login.desktopInstruction")}</p>
            </div>
          )}
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">{t("login.supportedWallets")}</p>
            <div className="flex flex-wrap gap-2">
              {["MetaMask", "OKX Wallet", "Trust Wallet", "Coinbase Wallet", "Rabby Wallet", "Rainbow"].map(
                (wallet) => (
                  <span
                    key={wallet}
                    className="text-[10px] px-2 py-1 bg-primary/10 text-primary rounded-md border border-primary/20"
                  >
                    {wallet}
                  </span>
                ),
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">{t("login.moreWallets")}</p>
          </div>
        </div>
      </Card>
    </main>
  )
}
