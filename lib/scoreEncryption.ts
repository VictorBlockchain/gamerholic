import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ENCRYPTION_KEY = Buffer.from(process.env.NEXT_PUBLIC_SCORE_ENCRYPTION_KEY!, "hex"); // Ensure the key is 32 bytes in hex format
const IV_LENGTH = 16

// const ENCRYPTION_KEY = randomBytes(32).toString('hex');
// console.log("Encryption Key:", ENCRYPTION_KEY);

export function encryptScore(score: number): string {
  console.log("Encryption Key (hex):", ENCRYPTION_KEY); // Log the hex-encoded key
  const iv = randomBytes(IV_LENGTH); // Generate a random IV
  const cipher = createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv); // Use the Buffer key
  let encrypted = cipher.update(score.toString(), "utf8", "hex"); // Encrypt the score
  encrypted += cipher.final("hex"); // Finalize the encryption
  return iv.toString("hex") + ":" + encrypted; // Return IV + encrypted data
}

export function decryptScore(encryptedScore: string): number {
  const [ivHex, encryptedData] = encryptedScore.split(":"); // Split IV and encrypted data
  const iv = Buffer.from(ivHex, "hex"); // Convert IV to a buffer
  const decipher = createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv); // Create decipher
  let decrypted = decipher.update(encryptedData, "hex", "utf8"); // Decrypt the data
  decrypted += decipher.final("utf8"); // Finalize decryption
  return parseInt(decrypted, 10); // Convert the decrypted string to a number
}

