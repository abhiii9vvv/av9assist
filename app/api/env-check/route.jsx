import { NextResponse } from "next/server"

// Diagnostic endpoint to check environment variables (remove after debugging)
export async function GET() {
  const envCheck = {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? `${process.env.GOOGLE_API_KEY.substring(0, 10)}...` : '❌ NOT SET',
    GOOGLE_API_KEY_2: process.env.GOOGLE_API_KEY_2 ? `${process.env.GOOGLE_API_KEY_2.substring(0, 10)}...` : '❌ NOT SET',
    GOOGLE_MODEL: process.env.GOOGLE_MODEL || '❌ NOT SET',
    SAMBANOVA_API_KEY: process.env.SAMBANOVA_API_KEY ? `${process.env.SAMBANOVA_API_KEY.substring(0, 10)}...` : '❌ NOT SET',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? `${process.env.OPENROUTER_API_KEY.substring(0, 10)}...` : '❌ NOT SET',
    PROVIDERS_ORDER: process.env.PROVIDERS_ORDER || '❌ NOT SET',
    NODE_ENV: process.env.NODE_ENV,
  }

  return NextResponse.json(envCheck)
}
