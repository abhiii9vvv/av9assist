import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

// Minimal Node.js script to generate an image with Gemini and save it locally.
// Requirements:
// - Node >=18
// - Env var GOOGLE_API_KEY set with your Google AI Studio key
// - npm i -D @google/generative-ai (already part of this script's import)
// Usage (PowerShell):
//   $env:GOOGLE_API_KEY = "<your-key>"
//   node ./scripts/gemini_image_gen.mjs

async function main() {
  // Load .env.local or .env if present
  try {
    dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })
    dotenv.config({ path: path.resolve(process.cwd(), ".env") })
  } catch {}

  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    console.error("Missing GOOGLE_API_KEY env var. Set it before running.")
    process.exit(1)
  }

  const genAI = new GoogleGenerativeAI(apiKey)

  // CLI overrides
  const argv = process.argv.slice(2)
  const getArg = (name, fallback = undefined) => {
    const idx = argv.findIndex(a => a === name || a.startsWith(name + "="))
    if (idx === -1) return fallback
    const val = argv[idx].includes("=") ? argv[idx].split("=").slice(1).join("=") : argv[idx + 1]
    return val ?? fallback
  }

  // Optional: pass --image D:\\path\\cat.png to remix an existing image
  const imagePath = getArg("--image")
  const hasImage = Boolean(imagePath)
  if (hasImage && !fs.existsSync(imagePath)) {
    console.warn(`Warning: image not found at ${imagePath}. Proceeding without inline image.`)
  }

  const base64Image = hasImage && fs.existsSync(imagePath)
    ? fs.readFileSync(imagePath).toString("base64")
    : null

  const modelId = getArg("--model", "gemini-2.0-flash-exp")
  const model = genAI.getGenerativeModel({ model: modelId })

  const promptText = getArg("--prompt", "Create a picture of my cat eating a nano-banana in a fancy restaurant under the Gemini constellation")
  const parts = [ { text: promptText } ]
  if (base64Image) {
    parts.push({ inlineData: { mimeType: "image/png", data: base64Image } })
  }

  const result = await model.generateContent({ contents: [{ role: "user", parts }] })
  const candidate = result.response.candidates?.[0]
  const outParts = candidate?.content?.parts || []
  let wroteImage = false
  // Allow custom output path: --out D:\\images\\gemini.png (folder or file)
  const outArg = getArg("--out")
  let outPath = path.resolve(process.cwd(), outArg || "gemini-native-image.png")

  for (const part of outParts) {
    if (part.text) {
      console.log(part.text)
    } else if (part.inlineData) {
      const imageData = part.inlineData.data
      const mime = part.inlineData.mimeType || "image/png"
      // If user passed a directory, append default filename
      const isDirLike = outPath.endsWith(path.sep) || (!path.extname(outPath) && fs.existsSync(outPath) && fs.statSync(outPath).isDirectory())
      if (isDirLike) {
        const ext = mime.includes("jpeg") ? ".jpg" : mime.includes("webp") ? ".webp" : ".png"
        outPath = path.join(outPath, `gemini-native-image${ext}`)
      } else if (!path.extname(outPath)) {
        // Add extension if missing
        const ext = mime.includes("jpeg") ? ".jpg" : mime.includes("webp") ? ".webp" : ".png"
        outPath = `${outPath}${ext}`
      }
      // Ensure directory exists
      const dir = path.dirname(outPath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      const buffer = Buffer.from(imageData, "base64")
      fs.writeFileSync(outPath, buffer)
      const { size } = fs.statSync(outPath)
      console.log(`Image saved: ${outPath} (${size} bytes)`) 
      wroteImage = true
    }
  }

  if (!wroteImage) {
    console.log("No inline image returned by the model. Check model capability or prompt.")
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
