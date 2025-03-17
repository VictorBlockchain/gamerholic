import { NextResponse } from "next/server";

// Handle GET requests
export async function GET() {
  const nonce = Math.random().toString(36).substring(2); // Generate a random nonce
  return NextResponse.json({ success: true, message: nonce });
}

// Handle POST requests
export async function POST() {
  const nonce = Math.random().toString(36).substring(2); // Generate a random nonce
  return NextResponse.json({ success: true, message: nonce });
}