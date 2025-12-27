import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ashva - Web3 Node Platform",
  description: "Member Center for Ashva Blockchain Node Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body>{children}</body>
    </html>
  );
}
