"use client"

import { useEffect, useState } from "react"
import { ReferralInputCard } from "@/components/referral-input-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ReferralTestPage() {
  const router = useRouter()
  const [currentAddress, setCurrentAddress] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const address = localStorage.getItem("walletAddress")
    if (!address) {
      alert("请先连接钱包")
      router.push("/")
      return
    }
    setCurrentAddress(address)
    setLoading(false)
  }, [router])

  const handleSubmit = () => {
    alert("邀请人地址已成功提交！")
    router.push("/member")
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => router.push("/member")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回会员中心
        </Button>

        <Card className="p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">填写邀请人地址</h1>
          <p className="text-sm text-muted-foreground mb-4">
            您的钱包地址：{currentAddress.slice(0, 6)}...{currentAddress.slice(-4)}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            请输入邀请您加入的上级钱包地址，建立推荐关系后可以享受团队收益分成。
          </p>
        </Card>

        <ReferralInputCard currentAddress={currentAddress} onSubmit={handleSubmit} />

        <Card className="p-4 mt-6 bg-muted/50">
          <h3 className="font-semibold mb-2">温馨提示</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• 邀请人地址必须是有效的以太坊地址（0x开头，42位）</li>
            <li>• 邀请人必须已经在系统中注册</li>
            <li>• 邀请关系一旦建立无法修改</li>
            <li>• 您的上级将获得您消费的一定比例佣金</li>
          </ul>
        </Card>
      </div>
    </main>
  )
}
