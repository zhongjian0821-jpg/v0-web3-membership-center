import { NextResponse } from "next/server"
import { createPublicClient, http, formatUnits, parseAbi } from "viem"
import { mainnet } from "viem/chains"

// ASHVA Token contract address on Ethereum mainnet
const ASHVA_CONTRACT = "0xea75cb12bbe6232eb082b365f450d3fe06d02fb3"

// Uniswap V2 Factory
const UNISWAP_V2_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"

// WETH address
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"

// ETH/USD Chainlink Price Feed
const ETH_USD_PRICE_FEED = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"

const FALLBACK_PRICE = 0.00006883 // Updated fallback price

let cachedResponse: any = null
let lastUpdateTime = 0
const CACHE_DURATION = Number(process.env.PRICE_CACHE_DURATION) || 1 * 60 * 1000 // 1分钟缓存

let lastSuccessfulPrice = FALLBACK_PRICE
let lastSuccessfulSource = "fallback"

let pendingRequest: Promise<{ price: number; source: string }> | null = null

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http("https://eth.llamarpc.com", {
    timeout: 5000, // 减少超时时间
    retryCount: 1, // 减少重试次数
  }),
})

const chainlinkAbi = parseAbi([
  "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
])

const uniswapV2PairAbi = parseAbi([
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
])

const uniswapV2FactoryAbi = parseAbi([
  "function getPair(address tokenA, address tokenB) external view returns (address pair)",
])

const erc20Abi = parseAbi(["function decimals() external view returns (uint8)"])

async function getETHPrice(): Promise<number> {
  try {
    const result = (await publicClient.readContract({
      address: ETH_USD_PRICE_FEED,
      abi: chainlinkAbi,
      functionName: "latestRoundData",
    })) as [bigint, bigint, bigint, bigint, bigint]

    const price = Number(formatUnits(result[1], 8))
    return price
  } catch (error) {
    console.error("[v0] Error fetching ETH price, using fallback")
    return 3500
  }
}

async function getASHVAPriceFromUniswap(): Promise<number | null> {
  try {
    const pairAddress = (await publicClient.readContract({
      address: UNISWAP_V2_FACTORY,
      abi: uniswapV2FactoryAbi,
      functionName: "getPair",
      args: [ASHVA_CONTRACT, WETH_ADDRESS],
    })) as `0x${string}`

    if (!pairAddress || pairAddress === "0x0000000000000000000000000000000000000000") {
      return null
    }

    const [reserves, token0] = await Promise.all([
      publicClient.readContract({
        address: pairAddress,
        abi: uniswapV2PairAbi,
        functionName: "getReserves",
      }) as Promise<[bigint, bigint, number]>,
      publicClient.readContract({
        address: pairAddress,
        abi: uniswapV2PairAbi,
        functionName: "token0",
      }) as Promise<`0x${string}`>,
    ])

    const isAshvaToken0 = token0.toLowerCase() === ASHVA_CONTRACT.toLowerCase()
    const ashvaReserve = isAshvaToken0 ? reserves[0] : reserves[1]
    const wethReserve = isAshvaToken0 ? reserves[1] : reserves[0]

    const ashvaReserveNumber = Number(formatUnits(ashvaReserve, 18))
    const wethReserveNumber = Number(formatUnits(wethReserve, 18))

    if (ashvaReserveNumber === 0) return null

    const ashvaPriceInETH = wethReserveNumber / ashvaReserveNumber
    const ethPrice = await getETHPrice()
    return ashvaPriceInETH * ethPrice
  } catch (error) {
    console.error("[v0] Error fetching from Uniswap")
    return null
  }
}

async function fetchDEXScreenerPrice(): Promise<number | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${ASHVA_CONTRACT}`, {
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) return null

    const data = await response.json()
    if (data.pairs && Array.isArray(data.pairs) && data.pairs.length > 0) {
      const validPairs = data.pairs
        .filter((pair: any) => pair.priceUsd && Number(pair.priceUsd) > 0)
        .sort((a: any, b: any) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))

      if (validPairs.length > 0) {
        return Number.parseFloat(validPairs[0].priceUsd)
      }
    }
    return null
  } catch (error) {
    return null
  }
}

async function getAggregatedPrice(): Promise<{ price: number; source: string }> {
  try {
    const dexScreenerPrice = await fetchDEXScreenerPrice()
    if (dexScreenerPrice && dexScreenerPrice > 0) {
      lastSuccessfulPrice = dexScreenerPrice
      lastSuccessfulSource = "dexscreener"
      return { price: dexScreenerPrice, source: "dexscreener" }
    }
  } catch (e) {
    console.log("[v0] DEXScreener failed, trying Uniswap")
  }

  try {
    const uniswapPrice = await getASHVAPriceFromUniswap()
    if (uniswapPrice && uniswapPrice > 0) {
      lastSuccessfulPrice = uniswapPrice
      lastSuccessfulSource = "uniswap-onchain"
      return { price: uniswapPrice, source: "uniswap-onchain" }
    }
  } catch (e) {
    console.log("[v0] Uniswap failed")
  }

  console.log("[v0] All price sources failed, using last successful price")
  return { price: lastSuccessfulPrice, source: `${lastSuccessfulSource}-cached` }
}

export async function GET() {
  try {
    const now = Date.now()

    if (cachedResponse && now - lastUpdateTime < CACHE_DURATION) {
      return NextResponse.json({
        ...cachedResponse,
        cached: true,
        cacheAge: Math.floor((now - lastUpdateTime) / 1000),
      })
    }

    if (pendingRequest) {
      const { price, source } = await pendingRequest
      return NextResponse.json({
        price,
        source,
        contract: ASHVA_CONTRACT,
        lastUpdated: new Date().toISOString(),
        cached: true,
      })
    }

    pendingRequest = getAggregatedPrice()

    try {
      const { price, source } = await pendingRequest

      cachedResponse = {
        price,
        source,
        contract: ASHVA_CONTRACT,
        lastUpdated: new Date().toISOString(),
      }
      lastUpdateTime = now

      return NextResponse.json(cachedResponse)
    } finally {
      pendingRequest = null
    }
  } catch (error) {
    console.error("[v0] Error in price API:", error)
    return NextResponse.json({
      price: lastSuccessfulPrice,
      source: "fallback-error",
      contract: ASHVA_CONTRACT,
      lastUpdated: new Date().toISOString(),
    })
  }
}
