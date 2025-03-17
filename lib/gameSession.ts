import { sign, verify } from "jsonwebtoken"
import { randomBytes } from "crypto"

const JWT_SECRET:any = process.env.NEXT_PUBIC_JWT_SECRET

export function generateGameToken(gameId: string, userId: string): string {
  const nonce = randomBytes(16).toString("hex")
  return sign({ gameId, userId, nonce, timestamp: Date.now() }, JWT_SECRET, { expiresIn: "1h" })
}

export function verifyGameToken(
  token: string,
): { gameId: string; userId: string; nonce: string; timestamp: number } | null {
  try {
    const decoded = verify(token, JWT_SECRET) as { gameId: string; userId: string; nonce: string; timestamp: number }
    return decoded
  } catch (error) {
    console.error("Invalid game token:", error)
    return null
  }
}

// Store used nonces in memory (consider using Redis for distributed systems)
const usedNonces = new Set<string>()

export function checkAndStoreNonce(nonce: string): boolean {
  if (usedNonces.has(nonce)) {
    return false
  }
  usedNonces.add(nonce)
  return true
}

