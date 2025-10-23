import { NextResponse } from "next/server"
const PollinationsProvider = require("@/lib/pollinations-provider")

export async function POST(request) {
  try {
    const body = await request.json()

    if (!body.text || typeof body.text !== "string") {
      return NextResponse.json(
        { error: "Text is required and must be a string" },
        { status: 400 }
      )
    }

    const pollinations = new PollinationsProvider()

    // Validate voice
    const voice = body.voice || "alloy"
    const validVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
    
    if (!validVoices.includes(voice)) {
      return NextResponse.json(
        { 
          error: `Invalid voice. Must be one of: ${validVoices.join(", ")}`,
          availableVoices: validVoices
        },
        { status: 400 }
      )
    }

    // Generate audio URL
    const audioUrl = await pollinations.generateAudio(body.text, voice)

    return NextResponse.json({
      success: true,
      audioUrl,
      text: body.text,
      voice,
    })
  } catch (error) {
    console.error("Audio generation API error:", error)
    return NextResponse.json(
      { error: "Failed to generate audio", details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    if (action === "voices") {
      // Return available voices
      const voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
      return NextResponse.json({ 
        voices,
        descriptions: {
          alloy: "Neutral and balanced",
          echo: "Clear and articulate",
          fable: "Warm and expressive",
          onyx: "Deep and authoritative",
          nova: "Friendly and energetic",
          shimmer: "Soft and gentle"
        }
      })
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use ?action=voices" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Audio API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch data", details: error.message },
      { status: 500 }
    )
  }
}
