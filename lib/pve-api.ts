// PVE 运营中心 API 客户端
// 用于 Web3 会员中心调用 PVE 的统一数据 API
// 已更新：包含 7 个新功能模块

const PVE_API_BASE = 'https://v0-pve-operations-center.vercel.app';

class PVEApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('pve_token', token);
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('pve_token');
    }
    return this.token;
  }

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
      this.token = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pve_token');
      }
      throw new Error('Unauthorized');
    }

    return response.json();
  }

  // === PVE 核心 API ===

  async getWallets(page = 1, limit = 100) {
    return this.request(`/api/admin/wallets?page=${page}&limit=${limit}`);
  }

  async getNodes() {
    return this.request('/api/admin/nodes');
  }

  async getTransactions(walletAddress?: string) {
    const params = walletAddress ? `?wallet_address=${walletAddress}` : '';
    return this.request(`/api/admin/transactions${params}`);
  }

  // === Web3 会员中心 API ===

  async getHierarchy() {
    return this.request('/api/admin/hierarchy');
  }

  async getCommissionRecords() {
    return this.request('/api/admin/commission-records');
  }

  async getMemberLevelConfig() {
    return this.request('/api/admin/member-level-config');
  }

  async getAssignedRecords() {
    return this.request('/api/admin/assigned-records');
  }

  async getStakingRecords() {
    return this.request('/api/admin/staking-records');
  }

  async getOperationLogs() {
    return this.request('/api/admin/operation-logs');
  }

  // === 新增功能 API ===

  // 云节点购买
  async getCloudNodePurchases() {
    return this.request('/api/admin/cloud-node-purchases');
  }

  async createCloudNodePurchase(data: any) {
    return this.create('/api/admin/cloud-node-purchases', data);
  }

  // 镜像节点购买
  async getImageNodePurchases() {
    return this.request('/api/admin/image-node-purchases');
  }

  async createImageNodePurchase(data: any) {
    return this.create('/api/admin/image-node-purchases', data);
  }

  // 市场挂单
  async getMarketplaceListings(status?: string) {
    const params = status ? `?status=${status}` : '';
    return this.request(`/api/admin/marketplace-listings${params}`);
  }

  async createMarketplaceListing(data: any) {
    return this.create('/api/admin/marketplace-listings', data);
  }

  // 市场交易
  async getMarketplaceTransactions() {
    return this.request('/api/admin/marketplace-transactions');
  }

  async createMarketplaceTransaction(data: any) {
    return this.create('/api/admin/marketplace-transactions', data);
  }

  // ASHVA 价格历史
  async getAshvaPriceHistory(limit?: number) {
    const params = limit ? `?limit=${limit}` : '';
    return this.request(`/api/admin/ashva-price-history${params}`);
  }

  async addAshvaPrice(data: any) {
    return this.create('/api/admin/ashva-price-history', data);
  }

  // 系统日志
  async getSystemLogs(eventType?: string) {
    const params = eventType ? `?event_type=${eventType}` : '';
    return this.request(`/api/admin/system-logs${params}`);
  }

  async createSystemLog(data: any) {
    return this.create('/api/admin/system-logs', data);
  }

  // 用户管理
  async getUsers() {
    return this.request('/api/admin/users');
  }

  async createUser(data: any) {
    return this.create('/api/admin/users', data);
  }

  async updateUser(data: any) {
    return this.update('/api/admin/users', data);
  }

  // === 通用 CRUD 方法 ===

  async create(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string, id: number) {
    return this.request(`${endpoint}?id=${id}`, {
      method: 'DELETE',
    });
  }
}

// 导出单例
export const pveApi = new PVEApiClient();

// 自动登录
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
