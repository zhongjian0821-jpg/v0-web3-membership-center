import type React from "react"
import { Providers } from "../providers"

export default function CommissionManageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Providers>{children}</Providers>
}
