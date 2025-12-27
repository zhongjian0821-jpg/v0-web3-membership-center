export const GLOBAL_PARTNER_THRESHOLD = 10000 // $10,000 USD
export const MARKET_PARTNER_THRESHOLD = 3000 // $3,000 USD

export const MEMBER_LEVELS = {
  NORMAL: "normal",
  MARKET_PARTNER: "market_partner",
  GLOBAL_PARTNER: "global_partner",
} as const

export type MemberLevel = (typeof MEMBER_LEVELS)[keyof typeof MEMBER_LEVELS]
