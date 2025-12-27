"use client"

import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    // 重定向到会员中心
    window.location.href = '/member'
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
          Ashva - Web3 Node Platform
        </h1>
        <p className="text-slate-400">正在加载...</p>
      </div>
    </div>
  )
}
