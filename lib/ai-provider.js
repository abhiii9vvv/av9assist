/**
 * av9Assist Multi-Provider AI Integration
 * Handles communication with multiple AI providers with fallback support
 */

const https = require("https")
const http = require("http")
const fs = require("fs")
const path = require("path")

// Load environment variables from external or local .env files when available
;(function loadEnv() {
  try {
    const dotenv = require("dotenv")
    const candidates = [
      process.env.AV9ASSIST_ENV_PATH,
      // User-requested external path
      "E:/PROJECT/AI-ChatBot/config/.env",
      // Windows-style path (backslashes)
      "E\\PROJECT\\AI-ChatBot\\config\\.env",
      // Project-local fallbacks
      path.resolve(process.cwd(), ".env.local"),
      path.resolve(process.cwd(), ".env"),
    ].filter(Boolean)

    for (const p of candidates) {
      try {
        if (p && fs.existsSync(p)) {
          dotenv.config({ path: p })
          console.log(`[av9Assist] Loaded environment from: ${p}`)
          break
        }
      } catch {
        // ignore existsSync/perm errors and continue trying next path
      }
    }
  } catch {
    // dotenv is optional; if not installed, ignore
  }
})()

class AIProvider {
  constructor() {
    this.providers = {
      gemini: this.callGemini.bind(this),
      sambanova: this.callSambaNova.bind(this),
      openrouter: this.callOpenRouter.bind(this),
    }

    // Provider configurations
    this.configs = {
      gemini: {
        apiKey: process.env.GOOGLE_API_KEY,
        apiKey2: process.env.GOOGLE_API_KEY_2,
        model: process.env.GOOGLE_MODEL || "gemini-2.5-flash",
        url: "https://generativelanguage.googleapis.com/v1/models/{model}:generateContent?key={key}",
      },
      sambanova: {
        apiKey: process.env.SAMBANOVA_API_KEY,
        model: process.env.SAMBANOVA_MODEL || "Llama-4-Maverick-17B-128E-Instruct",
        url: "https://api.sambanova.ai/v1/chat/completions",
      },
      openrouter: {
        apiKey: process.env.OPENROUTER_API_KEY,
        model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-8b-instruct:free",
        url: "https://openrouter.ai/api/v1/chat/completions",
      },
    }

    // Configure per-request timeout (ms) via env or default
    this.requestTimeoutMs = parseInt(process.env.AI_PROVIDER_TIMEOUT_MS, 10) || 10000
  }

  /**
   * Main method to get AI response with provider fallback
   */
  async getAIResponse(message, providerOrder = null, context = null, imageData = null) {
    const providers =
      providerOrder || (process.env.PROVIDERS_ORDER || "gemini,sambanova,openrouter").split(",")

    for (const providerName of providers) {
      const provider = providerName.trim()
      
      // Check if provider exists and has at least one API key
      if (!this.providers[provider]) {
        console.log(`⚠️ Skipping ${provider} - provider not found`)
        continue
      }
      
      // For Gemini, check if either API key exists
      if (provider === 'gemini') {
        if (!this.configs[provider].apiKey && !this.configs[provider].apiKey2) {
          console.log(`⚠️ Skipping ${provider} - no API keys configured`)
          continue
        }
      } else {
        // For other providers, check the single API key
        if (!this.configs[provider].apiKey) {
          console.log(`⚠️ Skipping ${provider} - missing API key`)
          continue
        }
      }
      
      // Skip non-vision providers if image is present
      if (imageData && provider !== 'gemini') {
        console.log(`⚠️ Skipping ${provider} - does not support vision`)
        continue
      }

      try {
        console.log(`🔄 Trying ${provider}...`)
        const response = provider === 'gemini' 
          ? await this.providers[provider](message, context, imageData)
          : await this.providers[provider](message, context)
        if (response) {
          console.log(`✅ ${provider} succeeded`)
          return { success: true, response, provider }
        }
      } catch (error) {
        console.error(`❌ ${provider} failed:`, error.message)
        continue
      }
    }

    return {
      success: false,
      error: "All AI providers failed",
      response: "Sorry, all AI services are currently unavailable. Please try again later.",
    }
  }

  /**
   * Fast path: call all configured providers in parallel and return the first successful response.
   * Uses a per-provider timeout to avoid hanging on slow providers.
   */
  async getAIResponseFast(message, providerOrder = null, context = null, options = {}) {
    const providers =
      providerOrder || (process.env.PROVIDERS_ORDER || "gemini,sambanova,openrouter").split(",")

    const timeoutMs = options.timeoutMs || this.requestTimeoutMs
    const imageData = options.imageData || null
    const tasks = []

    for (const providerName of providers) {
      const provider = providerName.trim()
      if (!this.providers[provider] || !this.configs[provider].apiKey) {
        continue
      }
      
      // Skip non-vision providers if image is present
      if (imageData && provider !== 'gemini') {
        console.log(`⚠️ Skipping ${provider} - does not support vision`)
        continue
      }
      
      const task = this.withTimeout(
        (async () => {
          const response = provider === 'gemini'
            ? await this.providers[provider](message, context, imageData)
            : await this.providers[provider](message, context)
          if (!response) throw new Error("Empty response")
          return { success: true, response: String(response), provider }
        })(),
        timeoutMs,
        `Timeout from ${provider}`,
      )
      tasks.push(task)
    }

    if (tasks.length === 0) {
      return {
        success: false,
        error: "No providers configured",
        response: "Sorry, all AI services are currently unavailable. Please try again later.",
      }
    }

    try {
      // Return the first fulfilled provider
      const result = await Promise.any(tasks)
      return result
    } catch (aggregateErr) {
      return {
        success: false,
        error: "All parallel providers failed",
        response: "Sorry, all AI services are currently unavailable. Please try again later.",
      }
    }
  }

  /**
   * Google Gemini API call with vision support
   *
   * Notes on roles and payload shape:
   * - Gemini (Generative Language API) requires a role field on each content entry
   *   and only accepts two role values: 'user' and 'model'.
   * - We normalize roles from upstream context where roles may be
   *   'user' | 'assistant' (mapped to 'model') | 'system' (moved into system_instruction).
   * - Each message is provided as { role, parts: [{ text }, { inline_data }] }.
   * - For vision: parts can include { inline_data: { mime_type, data } } for images
   */
  async callGemini(message, context, imageData = null) {
    const config = this.configs.gemini
    
    // Try primary API key first, then fallback to secondary
    const apiKeys = [config.apiKey, config.apiKey2].filter(Boolean)
    let lastError = null
    
    for (const apiKey of apiKeys) {
      try {
        const url = config.url.replace("{model}", config.model).replace("{key}", apiKey)

    // Gemini v1beta requires role to be either 'user' or 'model'.
    // Map common roles and optionally include a system instruction.
    const contents = []
    let systemText = ""

    if (Array.isArray(context)) {
      for (const m of context.slice(-8)) {
        if (!m || !m.role || !m.content) continue
        const role = m.role.toLowerCase()
        if (role === "system") {
          // Collect system prompts; Gemini supports a top-level system_instruction.
          systemText += (systemText ? "\n" : "") + String(m.content)
          continue
        }
        // Map 'assistant' -> 'model', keep 'user' -> 'user'. Ignore others.
        const mappedRole = role === "assistant" ? "model" : role === "user" ? "user" : null
        if (!mappedRole) continue
        
        // Build parts array for this message
        const parts = [{ text: String(m.content) }]
        
        // If message has an image, add it to parts
        if (m.image) {
          const imageBase64 = m.image.split(',')[1] || m.image // Remove data:image/xxx;base64, prefix if present
          const mimeType = m.image.match(/data:(image\/\w+);base64/)?.[1] || 'image/jpeg'
          parts.push({
            inline_data: {
              mime_type: mimeType,
              data: imageBase64
            }
          })
        }
        
        contents.push({ role: mappedRole, parts })
      }
    }
    
    // Current user message with optional image
    const userParts = [{ text: String(message) }]
    
    if (imageData) {
      // Extract base64 data and mime type from data URL
      const imageBase64 = imageData.split(',')[1] || imageData
      const mimeType = imageData.match(/data:(image\/\w+);base64/)?.[1] || 'image/jpeg'
      
      userParts.push({
        inline_data: {
          mime_type: mimeType,
          data: imageBase64
        }
      })
    }
    
    contents.push({ role: "user", parts: userParts })

    const payload = {
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }
    if (systemText) {
      // Per Generative Language API, this field is named 'system_instruction'
      payload.system_instruction = { parts: [{ text: systemText }] }
    }

    // Debug logging for image requests
    if (imageData) {
      console.log('🖼️ Gemini Vision Request:', {
        hasImage: true,
        messageLength: message.length,
        imageSize: imageData.length,
        mimeType: imageData.match(/data:(image\/\w+);base64/)?.[1] || 'unknown',
        contentsCount: contents.length
      })
    }

    const response = await this.makeRequest(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
      return response.candidates[0].content.parts[0].text.trim()
    }
    
    // Check for specific error responses
    if (response.error) {
      const errorMsg = response.error.message || JSON.stringify(response.error)
      console.error('Gemini API Error:', errorMsg)
      throw new Error(`Gemini API Error: ${errorMsg}`)
    }
    
    throw new Error("Invalid Gemini response format")
      } catch (error) {
        lastError = error
        console.log(`Gemini API key ${apiKey.slice(0, 10)}... failed, trying next key...`)
      }
    }
    
    // If all keys failed, throw the last error
    throw lastError || new Error("All Gemini API keys failed")
  }

  /**
   * SambaNova API call
   */
  async callSambaNova(message, context) {
    const config = this.configs.sambanova

    const messages = []
    if (Array.isArray(context)) {
      for (const m of context.slice(-8)) {
        if (!m || !m.role || !m.content) continue
        const role = String(m.role).toLowerCase()
        const mapped =
          role === "user"
            ? "user"
            : role === "assistant" || role === "ai" || role === "model"
              ? "assistant"
              : role === "system"
                ? "system"
                : null
        if (!mapped) continue
        messages.push({ role: mapped, content: String(m.content) })
      }
    }
    messages.push({ role: "user", content: String(message) })

    const payload = {
      model: config.model,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    }

    const response = await this.makeRequest(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (response.choices && response.choices[0]?.message?.content) {
      return response.choices[0].message.content.trim()
    }
    throw new Error("Invalid SambaNova response format")
  }

  /**
   * OpenRouter API call
   */
  async callOpenRouter(message, context) {
    const config = this.configs.openrouter

    const messages = []
    if (Array.isArray(context)) {
      for (const m of context.slice(-8)) {
        if (!m || !m.role || !m.content) continue
        const role = String(m.role).toLowerCase()
        const mapped =
          role === "user"
            ? "user"
            : role === "assistant" || role === "ai" || role === "model"
              ? "assistant"
              : role === "system"
                ? "system"
                : null
        if (!mapped) continue
        messages.push({ role: mapped, content: String(m.content) })
      }
    }
    messages.push({ role: "user", content: String(message) })

    const payload = {
      model: config.model,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    }

    const response = await this.makeRequest(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        "HTTP-Referer": "https://av9assist.com",
        "X-Title": "av9Assist Chat",
      },
      body: JSON.stringify(payload),
    })

    if (response.choices && response.choices[0]?.message?.content) {
      return response.choices[0].message.content.trim()
    }
    throw new Error("Invalid OpenRouter response format")
  }



  /**
   * Generic HTTP request helper
   */
  makeRequest(url, options) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith("https:") ? https : http
      const urlObj = new URL(url)

      const reqOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: options.method,
        headers: options.headers,
        timeout: Number.isFinite(options.timeoutMs) ? options.timeoutMs : this.requestTimeoutMs || 30000,
      }

      const req = protocol.request(reqOptions, (res) => {
        let data = ""

        res.on("data", (chunk) => {
          data += chunk
        })

        res.on("end", () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const jsonData = data ? JSON.parse(data) : {}
              resolve(jsonData)
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${data}`))
            }
          } catch (error) {
            reject(new Error(`JSON parse error: ${error.message}`))
          }
        })
      })

      req.on("error", (error) => {
        reject(error)
      })

      req.on("timeout", () => {
        req.destroy()
        reject(new Error("Request timeout"))
      })

      if (options.body) {
        req.write(options.body)
      }

      req.end()
    })
  }

  // Utility: wrap a promise with a timeout
  withTimeout(promise, ms, label = "Timeout") {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(label)), Math.max(1, ms || 0))
      promise
        .then((v) => {
          clearTimeout(t)
          resolve(v)
        })
        .catch((e) => {
          clearTimeout(t)
          reject(e)
        })
    })
  }
}

module.exports = AIProvider
