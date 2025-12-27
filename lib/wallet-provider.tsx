"use client"

if (typeof window !== "undefined" && typeof process !== "undefined") {
  if (!process.emitWarning) {
    process.emitWarning = (warning: any) => {
      console.warn(warning)
    }
  }
}

import { createContext, useContext, useState, type ReactNode } from "react"
import { ethers } from "ethers"
import EthereumProvider from "@walletconnect/ethereum-provider"

interface WalletContextType {
  address: string | null
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  provider: ethers.BrowserProvider | null
  signer: ethers.Signer | null
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  connect: async () => {},
  disconnect: async () => {},
  provider: null,
  signer: null,
})

export function useWallet() {
  return useContext(WalletContext)
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [wcProvider, setWcProvider] = useState<any>(null)

  const connect = async () => {
    try {
      const ethereumProvider = await EthereumProvider.init({
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
        chains: [1], // Ethereum mainnet
        showQrModal: true,
        qrModalOptions: {
          themeMode: "dark",
          themeVariables: {
            "--wcm-z-index": "9999",
          },
        },
        metadata: {
          name: "Web3 Membership Center",
          description: "Web3 Membership Management Platform",
          url: typeof window !== "undefined" ? window.location.origin : "",
          icons: ["https://avatars.githubusercontent.com/u/37784886"],
        },
      })

      await ethereumProvider.enable()
      setWcProvider(ethereumProvider)

      const ethersProvider = new ethers.BrowserProvider(ethereumProvider as any)
      const accounts = await ethersProvider.listAccounts()
      const ethSigner = await ethersProvider.getSigner()

      setProvider(ethersProvider)
      setSigner(ethSigner)
      setAddress(accounts[0]?.address || null)

      ethereumProvider.on("accountsChanged", (accounts: string[]) => {
        setAddress(accounts[0] || null)
      })

      ethereumProvider.on("disconnect", () => {
        setAddress(null)
        setProvider(null)
        setSigner(null)
      })
    } catch (error) {
      console.error("[v0] Wallet connection error:", error)
      throw error
    }
  }

  const disconnect = async () => {
    try {
      if (wcProvider) {
        await wcProvider.disconnect()
      }
      setAddress(null)
      setProvider(null)
      setSigner(null)
      setWcProvider(null)
    } catch (error) {
      console.error("[v0] Wallet disconnect error:", error)
    }
  }

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: !!address,
        connect,
        disconnect,
        provider,
        signer,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
