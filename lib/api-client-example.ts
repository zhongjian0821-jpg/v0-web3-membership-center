// lib/api-client-example.ts
// API客户端使用示例

import { apiClient } from "./api-client"
import type { WalletConnectRequest } from "./api-types"

/**
 * 示例1: 登录流程
 */
export async function loginExample(walletAddress: string) {
  try {
    // 1. 连接钱包
    const request: WalletConnectRequest = {
      walletAddress,
      // 可选：添加签名验证
      signature: "0x...",
      message: "Sign in to Web3 Membership",
    }

    const response = await apiClient.connectWallet(request)

    if (response.success && response.data) {
      // 2. 保存认证token
      apiClient.setAuthToken(response.data.token)

      // 3. 保存钱包地址到本地
      localStorage.setItem("walletAddress", response.data.walletAddress)

      // 4. 返回用户数据
      return {
        success: true,
        user: response.data,
      }
    } else {
      return {
        success: false,
        error: response.error || "登录失败",
      }
    }
  } catch (error: any) {
    console.error("Login error:", error)
    return {
      success: false,
      error: error.message || "网络错误",
    }
  }
}

/**
 * 示例2: 验证余额
 */
export async function checkBalanceExample(walletAddress: string) {
  try {
    const response = await apiClient.verifyAshvaBalance(walletAddress)

    if (response.success && response.data) {
      const { ashvaBalance, ashvaBalanceUSD, meetsMinimum } = response.data

      if (!meetsMinimum) {
        console.log("余额不足，需要至少:", response.data.minimumRequired)
        return { sufficient: false }
      }

      return {
        sufficient: true,
        balance: ashvaBalance,
        balanceUSD: ashvaBalanceUSD,
      }
    }

    return { sufficient: false, error: response.error }
  } catch (error: any) {
    console.error("Balance check error:", error)
    return { sufficient: false, error: error.message }
  }
}

/**
 * 示例3: 获取完整会员信息
 */
export async function getMemberDataExample(walletAddress: string) {
  try {
    // 并行请求多个API
    const [infoResponse, referralResponse] = await Promise.all([
      apiClient.getWalletInfo(walletAddress),
      apiClient.getReferralStatus(walletAddress),
    ])

    if (infoResponse.success && referralResponse.success) {
      return {
        success: true,
        data: {
          ...infoResponse.data,
          referral: referralResponse.data,
        },
      }
    }

    return {
      success: false,
      error: infoResponse.error || referralResponse.error,
    }
  } catch (error: any) {
    console.error("Get member data error:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * 示例4: 更新推荐人
 */
export async function setReferrerExample(walletAddress: string, parentWallet: string) {
  try {
    const response = await apiClient.updateReferral({
      walletAddress,
      parentWallet,
    })

    if (response.success) {
      return {
        success: true,
        message: "推荐人设置成功",
      }
    }

    return {
      success: false,
      error: response.error || "设置失败",
    }
  } catch (error: any) {
    console.error("Set referrer error:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * 示例5: 退出登录
 */
export function logoutExample() {
  // 1. 清除token
  apiClient.clearAuthToken()

  // 2. 清除本地存储
  localStorage.removeItem("walletAddress")

  // 3. 清除其他缓存
  localStorage.clear()
  sessionStorage.clear()

  // 4. 跳转到登录页
  window.location.href = "/"
}

/**
 * 示例6: 错误处理
 */
export async function apiCallWithErrorHandling<T>(
  apiCall: () => Promise<any>,
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await apiCall()

    if (response.success) {
      return {
        success: true,
        data: response.data,
      }
    }

    // 处理特定错误代码
    switch (response.code) {
      case "INVALID_TOKEN":
        apiClient.clearAuthToken()
        window.location.href = "/"
        return { success: false, error: "登录已过期，请重新登录" }

      case "INSUFFICIENT_BALANCE":
        return { success: false, error: "余额不足" }

      case "REFERRER_ALREADY_SET":
        return { success: false, error: "推荐人已设置，无法修改" }

      default:
        return { success: false, error: response.error || "操作失败" }
    }
  } catch (error: any) {
    console.error("API call failed:", error)
    return {
      success: false,
      error: error.message || "网络错误",
    }
  }
}
