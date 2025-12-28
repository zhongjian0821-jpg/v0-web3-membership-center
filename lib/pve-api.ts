// PVE 运营中心 API 客户端
// 用于 Web3 会员中心调用 PVE 的统一数据 API

const PVE_API_BASE = 'https://v0-pve-operations-center.vercel.app';

class PVEApiClient {
  private token: string | null = null;

  // 设置 token
  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('pve_token', token);
    }
  }

  // 获取 token
  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('pve_token');
    }
    return this.token;
  }

  // 登录 PVE
  async login(username: string, password: string) {
    const response = await fetch(`${PVE_API_BASE}/api/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    
    if (data.success && data.data.token) {
      this.setToken(data.data.token);
      return data;
    }
    
    throw new Error(data.error || 'Login failed');
  }

  // 通用 API 调用
  async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    
    const response = await fetch(`${PVE_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token 过期，需要重新登录
      this.token = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pve_token');
      }
      throw new Error('Unauthorized');
    }

    return response.json();
  }

  // === PVE 核心 API ===

  // 获取钱包列表
  async getWallets(page = 1, limit = 100) {
    return this.request(`/api/admin/wallets?page=${page}&limit=${limit}`);
  }

  // 获取节点列表
  async getNodes() {
    return this.request('/api/admin/nodes');
  }

  // 获取交易记录
  async getTransactions(walletAddress?: string) {
    const params = walletAddress ? `?wallet_address=${walletAddress}` : '';
    return this.request(`/api/admin/transactions${params}`);
  }

  // === Web3 会员中心 API ===

  // 获取层级关系
  async getHierarchy() {
    return this.request('/api/admin/hierarchy');
  }

  // 获取佣金记录
  async getCommissionRecords() {
    return this.request('/api/admin/commission-records');
  }

  // 获取会员等级配置
  async getMemberLevelConfig() {
    return this.request('/api/admin/member-level-config');
  }

  // 获取分配记录
  async getAssignedRecords() {
    return this.request('/api/admin/assigned-records');
  }

  // 获取质押记录
  async getStakingRecords() {
    return this.request('/api/admin/staking-records');
  }

  // 获取操作日志
  async getOperationLogs() {
    return this.request('/api/admin/operation-logs');
  }

  // === 通用 CRUD 方法 ===

  // 创建记录
  async create(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 更新记录
  async update(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // 删除记录
  async delete(endpoint: string, id: number) {
    return this.request(`${endpoint}?id=${id}`, {
      method: 'DELETE',
    });
  }
}

// 导出单例
export const pveApi = new PVEApiClient();

// 自动登录（使用默认管理员账号）
export async function ensurePVEAuth() {
  if (!pveApi.getToken()) {
    try {
      await pveApi.login('admin', 'Admin123!');
    } catch (error) {
      console.error('PVE auto-login failed:', error);
      throw error;
    }
  }
}
