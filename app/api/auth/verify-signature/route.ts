import { NextResponse } from "next/server"
import { ethers } from "ethers"

export async function POST(req: Request) {
  try {
    const { address, message, signature } = await req.json()

    if (!address || !message || !signature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(message, signature)

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      console.error("[API] Signature verification failed:", {
        expected: address,
        recovered: recoveredAddress,
      })
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    console.log("[API] Signature verified successfully for:", address)

    return NextResponse.json({
      success: true,
      address: recoveredAddress,
    })
  } catch (error: any) {
    console.error("[API] Signature verification error:", error)
    return NextResponse.json({ error: error.message || "Verification failed" }, { status: 500 })
  }
}
