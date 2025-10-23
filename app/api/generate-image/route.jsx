import { NextResponse } from "next/server"
const PollinationsProvider = require("@/lib/pollinations-provider")

export async function POST(request) {
  try {
    const body = await request.json()

    if (!body.prompt || typeof body.prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required and must be a string" },
        { status: 400 }
      )
    }

    const pollinations = new PollinationsProvider()

    // Generate image URL with options
    const options = {
      width: body.width || 1024,
      height: body.height || 1024,
      seed: body.seed || Math.floor(Math.random() * 1000000),
      model: body.model || "flux",
      nologo: body.nologo !== undefined ? body.nologo : true,
      enhance: body.enhance || false,
    }

    const imageUrl = await pollinations.generateImage(body.prompt, options)

    return NextResponse.json({
      success: true,
      imageUrl,
      prompt: body.prompt,
      options,
    })
  } catch (error) {
    console.error("Image generation API error:", error)
    return NextResponse.json(
      { error: "Failed to generate image", details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    const pollinations = new PollinationsProvider()

    if (action === "models") {
      // Get available image models
      const models = await pollinations.getImageModels()
      return NextResponse.json({ models })
    } else if (action === "feed") {
      // Get image feed
      const feed = await pollinations.getImageFeed()
      return NextResponse.json({ feed })
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use ?action=models or ?action=feed" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Image API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch data", details: error.message },
      { status: 500 }
    )
  }
}
