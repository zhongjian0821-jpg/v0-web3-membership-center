import EthereumProvider from "@walletconnect/ethereum-provider"
import { ethers } from "ethers"

let provider: any = null
let ethersProvider: ethers.BrowserProvider | null = null

export async function initWalletConnect() {
  if (provider) return provider

  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ""

  provider = await EthereumProvider.init({
    projectId,
    chains: [1], // Ethereum mainnet
    showQrModal: true,
    qrModalOptions: {
      themeMode: "dark" as const,
    },
    metadata: {
      name: "Web3 Membership Center",
      description: "Web3 会员中心",
      url: typeof window !== "undefined" ? window.location.origin : "",
      icons: ["https://avatars.githubusercontent.com/u/37784886"],
    },
  })

  return provider
}

export async function connectWallet() {
  const wcProvider = await initWalletConnect()
  const accounts = await wcProvider.enable()

  ethersProvider = new ethers.BrowserProvider(wcProvider)

  return {
    address: accounts[0] as string,
    provider: ethersProvider,
  }
}

export async function disconnectWallet() {
  if (provider) {
    await provider.disconnect()
    provider = null
    ethersProvider = null
  }
}

export function getProvider() {
  return ethersProvider
}

export function isConnected() {
  return provider?.connected || false
}

export async function getAccounts() {
  if (!provider) return []
  return provider.accounts || []
}
