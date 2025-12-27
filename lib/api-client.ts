// lib/api-client.ts
// 前端API客户端 - 调用后端API服务

import type {
  ApiResponse,
  WalletConnectRequest,
  WalletConnectResponse,
  AshvaBalanceResponse,
  WalletInfo,
  ReferralStatus,
  UpdateReferralRequest,
  UpdateReferralResponse,
  SyncWalletRequest,
  SyncWalletResponse,
} from "./api-types"

/**
 * API客户端配置
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:4000"
const API_VERSION = "v1"

/**
 * API客户端类
 */
class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/${API_VERSION}`
  }

  /**
   * 通用请求方法
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      return data
    } catch (error) {
      console.error(`[API Client] Error calling ${endpoint}:`, error)
      throw error
    }
  }

  /**
   * 获取认证头
   */
  private getAuthHeaders(): Record<string, string> {
    const token = this.getAuthToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  /**
   * 获取认证token
   */
  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("auth_token")
  }

  /**
   * 保存认证token
   */
  public setAuthToken(token: string): void {
    if (typeof window === "undefined") return
    localStorage.setItem("auth_token", token)
  }

  /**
   * 清除认证token
   */
  public clearAuthToken(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem("auth_token")
  }

  // ==================== 钱包管理接口 ====================

  /**
   * 1. 钱包连接验证
   */
  async connectWallet(data: WalletConnectRequest): Promise<ApiResponse<WalletConnectResponse>> {
    return this.request<WalletConnectResponse>("/wallet/connect", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  /**
   * 2. 验证ASHVA余额
   */
  async verifyAshvaBalance(walletAddress: string): Promise<ApiResponse<AshvaBalanceResponse>> {
    return this.request<AshvaBalanceResponse>(`/wallet/verify-ashva?walletAddress=${walletAddress}`)
  }

  /**
   * 3. 获取钱包基本信息
   */
  async getWalletInfo(walletAddress: string): Promise<ApiResponse<WalletInfo>> {
    return this.request<WalletInfo>(`/wallet/info?walletAddress=${walletAddress}`)
  }

  /**
   * 4. 获取推荐人状态
   */
  async getReferralStatus(walletAddress: string): Promise<ApiResponse<ReferralStatus>> {
    return this.request<ReferralStatus>(`/wallet/referral-status?walletAddress=${walletAddress}`)
  }

  /**
   * 5. 更新推荐人关系
   */
  async updateReferral(data: UpdateReferralRequest): Promise<ApiResponse<UpdateReferralResponse>> {
    return this.request<UpdateReferralResponse>("/wallet/update-referral", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  /**
   * 6. 同步钱包数据
   */
  async syncWallet(data: SyncWalletRequest): Promise<ApiResponse<SyncWalletResponse>> {
    return this.request<SyncWalletResponse>("/wallet/sync", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }
}

// 导出单例
export const apiClient = new ApiClient()
