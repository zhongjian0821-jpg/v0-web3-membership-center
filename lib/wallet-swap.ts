export const ASHVA_CONTRACT = "0xea75cb12bbe6232eb082b365f450d3fe06d02fb3"
export const USDT_CONTRACT = "0xdac17f958d2ee523a2206206994597c13d831ec7"

export interface SwapConfig {
  tokenAddress: string
  amount?: number
  chain?: "ethereum" | "bsc" | "polygon"
}

function isMobile(): boolean {
  if (typeof window === "undefined") return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

function detectWallet(): {
  type: "metamask" | "okx" | "trust" | "coinbase" | "phantom" | "rainbow" | "none"
  hasWallet: boolean
} {
  if (typeof window === "undefined") return { type: "none", hasWallet: false }

  const w = window as any

  // Check for specific wallets in priority order
  if (w.okxwallet) return { type: "okx", hasWallet: true }
  if (w.trustwallet) return { type: "trust", hasWallet: true }
  if (w.coinbaseWallet) return { type: "coinbase", hasWallet: true }
  if (w.phantom?.ethereum) return { type: "phantom", hasWallet: true }
  if (w.rainbow) return { type: "rainbow", hasWallet: true }
  if (w.ethereum?.isMetaMask) return { type: "metamask", hasWallet: true }

  return { type: "none", hasWallet: false }
}

export function openWalletSwap(config: SwapConfig) {
  const { tokenAddress, amount, chain = "ethereum" } = config
  const mobile = isMobile()
  const wallet = detectWallet()

  console.log("[v0] Opening swap interface:", { mobile, wallet: wallet.type, chain })

  if (mobile) {
    // Try wallet-specific deep links first
    switch (wallet.type) {
      case "okx":
        // OKX Wallet DEX deep link
        window.location.href = `okx://wallet/dex?fromTokenAddress=eth&toTokenAddress=${tokenAddress}${amount ? `&toTokenAmount=${amount}` : ""}`
        return

      case "trust":
        // Trust Wallet DEX deep link
        window.location.href = `trust://browser?url=https://app.uniswap.org/#/swap?outputCurrency=${tokenAddress}&chain=${chain}`
        return

      case "metamask":
        // MetaMask mobile deep link
        window.location.href = `https://metamask.app.link/dapp/app.uniswap.org/#/swap?outputCurrency=${tokenAddress}&chain=${chain}`
        return

      case "coinbase":
        // Coinbase Wallet deep link
        window.location.href = `https://go.cb-w.com/dapp?cb_url=https://app.uniswap.org/#/swap?outputCurrency=${tokenAddress}&chain=${chain}`
        return

      case "rainbow":
        // Rainbow Wallet deep link
        window.location.href = `rainbow://open?url=https://app.uniswap.org/#/swap?outputCurrency=${tokenAddress}&chain=${chain}`
        return
    }

    const uniswapMobileUrl = `https://app.uniswap.org/#/swap?outputCurrency=${tokenAddress}&chain=${chain}`
    window.location.href = uniswapMobileUrl
    return
  }

  const dexUrl = `https://app.uniswap.org/#/swap?outputCurrency=${tokenAddress}&chain=${chain}`

  // Also provide alternative DEX options
  const alternatives = [
    { name: "Uniswap", url: dexUrl },
    { name: "1inch", url: `https://app.1inch.io/#/1/simple/swap/ETH/${tokenAddress}` },
    { name: "Matcha", url: `https://matcha.xyz/tokens/ethereum/${tokenAddress}` },
  ]

  console.log("[v0] Available DEX options:", alternatives)

  // Open primary DEX (Uniswap)
  window.open(dexUrl, "_blank", "noopener,noreferrer")
}

export function calculateRequiredAshva(targetUSD: number, currentPrice: number): number {
  return Math.ceil(targetUSD / currentPrice)
}
