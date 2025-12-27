"use client"

import type { ReactNode } from "react"
import { LanguageProvider } from "@/lib/i18n/context"
import { WalletProvider } from "@/lib/wallet-provider"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <WalletProvider>{children}</WalletProvider>
    </LanguageProvider>
  )
}
