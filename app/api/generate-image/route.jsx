import { NextResponse } from "next/server";

const PollinationsProvider = require("@/lib/pollinations-provider");

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt, width, height, seed, model, nologo, enhance } = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const pollinations = new PollinationsProvider();
    const options = {
      width: width || 1024,
      height: height || 1024,
      seed: seed || Date.now(),
      model: model || "flux",
      nologo: nologo !== undefined ? nologo : true,
      enhance: enhance || false,
    };

    const imageUrl = await pollinations.generateImage(prompt.trim(), options);

    return NextResponse.json({
      success: true,
      imageUrl,
      prompt: prompt.trim(),
      options,
    });
  } catch (error) {
    console.error("Image generation API error:", error);
    return NextResponse.json(
      { error: "Failed to generate image", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const pollinations = new PollinationsProvider();

    if (action === "models") {
      // Get available image models
      const models = await pollinations.getImageModels();
      return NextResponse.json({ models });
    } else if (action === "feed") {
      // Get image feed
      const feed = await pollinations.getImageFeed();
      return NextResponse.json({ feed });
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use ?action=models or ?action=feed" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Image API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data", details: error.message },
      { status: 500 }
    );
  }
}
