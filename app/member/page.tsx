"use client"

import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'

export default function MemberPage() {
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [walletData, setWalletData] = useState<any>(null)
  const [nodes, setNodes] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await api.getNodesStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }

  const handleConnectWallet = async () => {
    setLoading(true)
    try {
      const wallet = await api.connectWallet()
      setWalletAddress(wallet.address)
      setConnected(true)
      
      // 加载钱包数据
      await loadWalletData(wallet.address)
      await loadNodes()
    } catch (err) {
      console.error('Failed to connect wallet:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadWalletData = async (address: string) => {
    try {
      const data = await api.getWalletInfo(address)
      setWalletData(data)
    } catch (err) {
      console.error('Failed to load wallet data:', err)
    }
  }

  const loadNodes = async () => {
    try {
      const data = await api.getNodes()
      setNodes(data.nodes || [])
    } catch (err) {
      console.error('Failed to load nodes:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Ashva 会员中心
            </h1>
            
            {!connected ? (
              <button
                onClick={handleConnectWallet}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg font-semibold transition disabled:opacity-50"
              >
                {loading ? '连接中...' : '连接钱包'}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-slate-800 rounded-lg">
                  <span className="text-xs text-slate-400">钱包地址</span>
                  <p className="text-sm font-mono text-white">{walletAddress.substring(0, 10)}...{walletAddress.substring(38)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-6">
              <h3 className="text-sm text-slate-400 mb-2">总节点数</h3>
              <p className="text-3xl font-bold text-white">{stats.total || 0}</p>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-6">
              <h3 className="text-sm text-slate-400 mb-2">活跃节点</h3>
              <p className="text-3xl font-bold text-green-400">{stats.active || 0}</p>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-6">
              <h3 className="text-sm text-slate-400 mb-2">活跃率</h3>
              <p className="text-3xl font-bold text-blue-400">
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
              </p>
            </div>
          </div>
        )}

        {/* 钱包信息 */}
        {connected && walletData && (
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">钱包信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400">ASHVA 余额</p>
                <p className="text-2xl font-bold text-white">{walletData.ashva_balance || 0}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">质押总额</p>
                <p className="text-2xl font-bold text-white">{walletData.total_staked || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* 节点列表 */}
        {connected && nodes.length > 0 && (
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">我的节点</h2>
            <div className="space-y-3">
              {nodes.map((node) => (
                <div key={node.id} className="bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800 transition">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-mono text-slate-300">{node.node_id.substring(0, 30)}...</p>
                      <p className="text-xs text-slate-500 mt-1">类型: {node.node_type}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      node.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-600/50 text-slate-400'
                    }`}>
                      {node.status === 'active' ? '活跃' : '离线'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 未连接提示 */}
        {!connected && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">👛</div>
            <h3 className="text-xl font-bold text-white mb-2">连接钱包开始使用</h3>
            <p className="text-slate-400">连接您的 Web3 钱包以查看节点信息和管理资产</p>
          </div>
        )}
      </main>
    </div>
  )
}
