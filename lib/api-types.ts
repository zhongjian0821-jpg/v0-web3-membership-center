// lib/api-types.ts
// 前端项目使用的API类型定义（与后端保持一致）

/**
 * 会员等级枚举
 */
export enum MemberLevel {
  NORMAL = "normal",
  BRONZE_PARTNER = "bronze_partner",
  SILVER_PARTNER = "silver_partner",
  GOLD_PARTNER = "gold_partner",
  GLOBAL_PARTNER = "global_partner",
}

/**
 * 会员等级显示名称映射
 */
export const MEMBER_LEVEL_NAMES: Record<MemberLevel, string> = {
  [MemberLevel.NORMAL]: "普通会员",
  [MemberLevel.BRONZE_PARTNER]: "铜牌合伙人",
  [MemberLevel.SILVER_PARTNER]: "银牌合伙人",
  [MemberLevel.GOLD_PARTNER]: "金牌合伙人",
  [MemberLevel.GLOBAL_PARTNER]: "全球合伙人",
}

/**
 * API响应包装类型
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  code?: string
  message?: string
}

/**
 * 钱包连接请求
 */
export interface WalletConnectRequest {
  walletAddress: string
  signature?: string
  message?: string
}

/**
 * 钱包连接响应
 */
export interface WalletConnectResponse {
  walletAddress: string
  ashvaBalance: number
  ashvaBalanceUSD: number
  memberLevel: MemberLevel
  hasReferrer: boolean
  isRegistered: boolean
  token: string
}

/**
 * ASHVA余额验证响应
 */
export interface AshvaBalanceResponse {
  walletAddress: string
  ashvaBalance: number
  ashvaBalanceUSD: number
  meetsMinimum: boolean
  minimumRequired: number
}

/**
 * 钱包基本信息
 */
export interface WalletInfo {
  walletAddress: string
  memberLevel: MemberLevel
  memberLevelDisplay: string
  totalEarnings: number
  distributableCommission: number
  distributedCommission: number
  parentWallet: string | null
  registeredAt: string
  lastActiveAt: string
}

/**
 * 推荐人状态
 */
export interface ReferralStatus {
  hasReferrer: boolean
  referrerAddress: string | null
  referrerLevel: MemberLevel | null
  canChangeReferrer: boolean
  referralCode: string
  referredCount: number
}

/**
 * 更新推荐人请求
 */
export interface UpdateReferralRequest {
  walletAddress: string
  parentWallet: string
}

/**
 * 更新推荐人响应
 */
export interface UpdateReferralResponse {
  walletAddress: string
  parentWallet: string
  updatedAt: string
}

/**
 * 同步钱包请求
 */
export interface SyncWalletRequest {
  walletAddress: string
  forceSync?: boolean
}

/**
 * 同步钱包响应
 */
export interface SyncWalletResponse {
  walletAddress: string
  syncedAt: string
  updatedFields: string[]
}

/**
 * 错误代码枚举
 */
export enum ErrorCode {
  WALLET_NOT_FOUND = "WALLET_NOT_FOUND",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  REFERRER_ALREADY_SET = "REFERRER_ALREADY_SET",
  INVALID_REFERRER = "INVALID_REFERRER",
  INVALID_TOKEN = "INVALID_TOKEN",
  DATABASE_ERROR = "DATABASE_ERROR",
  BLOCKCHAIN_ERROR = "BLOCKCHAIN_ERROR",
}
