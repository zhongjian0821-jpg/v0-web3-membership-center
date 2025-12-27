const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://pve-operations-api-production.up.railway.app'

export const api = {
  // 获取节点列表
  async getNodes() {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/api/nodes`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
    if (!res.ok) throw new Error('Failed to fetch nodes')
    return res.json()
  },

  // 获取钱包信息
  async getWalletInfo(address: string) {
    const res = await fetch(`${API_BASE}/api/wallets?address=${address}`)
    if (!res.ok) throw new Error('Failed to fetch wallet')
    return res.json()
  },

  // 获取节点统计
  async getNodesStats() {
    const res = await fetch(`${API_BASE}/api/nodes/stats`)
    if (!res.ok) throw new Error('Failed to fetch stats')
    return res.json()
  },

  // 连接钱包 (模拟)
  async connectWallet() {
    // 这里应该集成真实的 Web3 钱包连接
    // 暂时返回模拟数据
    return {
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
      connected: true
    }
  },

  // 登录
  async login(username: string, password: string) {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    if (!res.ok) throw new Error('Login failed')
    const data = await res.json()
    if (data.token) {
      localStorage.setItem('token', data.token)
    }
    return data
  },

  // 登出
  logout() {
    localStorage.removeItem('token')
  }
}
