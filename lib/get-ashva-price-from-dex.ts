import { ethers } from "ethers"

// ASHVA Token Contract Address
const ASHVA_TOKEN = "0xea75cb12bbe6232eb082b365f450d3fe06d02fb3"

// Uniswap V2 Router Address
const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"

// WETH Address (used for pricing)
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"

// USDT Address (for USD price)
const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7"

// Uniswap V2 Pair ABI (minimal)
const PAIR_ABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
]

// Uniswap V2 Factory ABI (minimal)
const FACTORY_ABI = ["function getPair(address tokenA, address tokenB) external view returns (address pair)"]

const FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"

/**
 * Get ASHVA price in USD from Uniswap DEX through MetaMask
 */
export async function getAshvaPriceFromDEX(): Promise<number> {
  try {
    // Check if MetaMask is available
    if (typeof window === "undefined" || !window.ethereum) {
      console.log("[v0] MetaMask not available, using fallback price")
      return 0.00015
    }

    // Create provider from MetaMask
    const provider = new ethers.BrowserProvider(window.ethereum)

    // Get Uniswap V2 Factory contract
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider)

    // Try to get ASHVA/WETH pair
    const ashvaWethPair = await factory.getPair(ASHVA_TOKEN, WETH)

    if (ashvaWethPair === ethers.ZeroAddress) {
      console.log("[v0] No ASHVA/WETH pair found")
      return 0.00015
    }

    // Get pair contract
    const pairContract = new ethers.Contract(ashvaWethPair, PAIR_ABI, provider)

    // Get reserves
    const [reserve0, reserve1] = await pairContract.getReserves()
    const token0 = await pairContract.token0()

    // Calculate ASHVA price in ETH
    let ashvaReserve: bigint
    let wethReserve: bigint

    if (token0.toLowerCase() === ASHVA_TOKEN.toLowerCase()) {
      ashvaReserve = reserve0
      wethReserve = reserve1
    } else {
      ashvaReserve = reserve1
      wethReserve = reserve0
    }

    // Price of ASHVA in ETH
    const ashvaPriceInETH = Number(wethReserve) / Number(ashvaReserve)

    // Now get ETH price in USDT
    const wethUsdtPair = await factory.getPair(WETH, USDT)
    if (wethUsdtPair === ethers.ZeroAddress) {
      console.log("[v0] No WETH/USDT pair found, using estimated ETH price")
      // Assume ETH is around $3000
      return ashvaPriceInETH * 3000
    }

    const wethUsdtPairContract = new ethers.Contract(wethUsdtPair, PAIR_ABI, provider)
    const [wethUsdtReserve0, wethUsdtReserve1] = await wethUsdtPairContract.getReserves()
    const wethUsdtToken0 = await wethUsdtPairContract.token0()

    let wethReserveInPair: bigint
    let usdtReserveInPair: bigint

    if (wethUsdtToken0.toLowerCase() === WETH.toLowerCase()) {
      wethReserveInPair = wethUsdtReserve0
      usdtReserveInPair = wethUsdtReserve1
    } else {
      wethReserveInPair = wethUsdtReserve1
      usdtReserveInPair = wethUsdtReserve0
    }

    // ETH price in USDT (USDT has 6 decimals)
    const ethPriceInUSDT = Number(usdtReserveInPair) / 1e6 / (Number(wethReserveInPair) / 1e18)

    // Final ASHVA price in USD
    const ashvaPriceUSD = ashvaPriceInETH * ethPriceInUSDT

    console.log("[v0] ASHVA price from DEX:", ashvaPriceUSD)
    return ashvaPriceUSD
  } catch (error) {
    console.error("[v0] Error getting price from DEX:", error)
    return 0.00015 // Fallback price
  }
}
