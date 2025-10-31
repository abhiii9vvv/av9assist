const https = require("https")
const http = require("http")

/**
 * Pollinations.AI Provider
 * Free AI service for image generation
 * Complete integration with Pollinations.AI services
 * - Text Generation (GET & POST)
 * - Image Generation
 * - Audio Generation (Text-to-Speech)
 * - OpenAI Compatible Endpoint
 */
class PollinationsProvider {
  constructor() {
    this.baseUrls = {
      text: "https://text.pollinations.ai",
      image: "https://image.pollinations.ai",
    }

    // Available voices for audio generation
    this.voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]

    // Default configuration
    this.defaultConfig = {
      text: {
        model: "openai", // Default model
        seed: 42,
        jsonMode: false,
      },
      image: {
        width: 1024,
        height: 1024,
        seed: 42,
        model: "flux", // Default image model
        nologo: true,
        enhance: false,
      },
      audio: {
        model: "openai-audio",
        voice: "alloy",
      },
    }
  }

  /**
   * Generate text using simple GET request
   * @param {string} prompt - The text prompt
   * @param {object} options - Optional parameters (model, seed, jsonMode)
   * @returns {Promise<string>} Generated text
   */
  async generateTextSimple(prompt, options = {}) {
    try {
      const encodedPrompt = encodeURIComponent(prompt)
      let url = `${this.baseUrls.text}/${encodedPrompt}`
      
      // Add query parameters if provided
      const params = new URLSearchParams()
      if (options.model) params.append('model', options.model)
      if (options.seed !== undefined) params.append('seed', options.seed)
      if (options.jsonMode) params.append('jsonMode', 'true')
      
      const queryString = params.toString()
      if (queryString) url += `?${queryString}`

      console.log('🌸 Pollinations Text (GET):', url)
      
      const response = await this.makeRequest(url, {
        method: "GET",
        headers: {
          'Accept': 'text/plain',
        }
      })

      return response
    } catch (error) {
      console.error("Pollinations Text (GET) error:", error.message)
      throw error
    }
  }

  /**
   * Generate text using advanced POST request
   * @param {object} payload - Full request payload
   * @returns {Promise<string>} Generated text
   */
  async generateTextAdvanced(payload) {
    try {
      const url = `${this.baseUrls.text}/`
      
      console.log('🌸 Pollinations Text (POST):', JSON.stringify(payload).slice(0, 200))
      
      const response = await this.makeRequest(url, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/plain',
        },
        body: JSON.stringify(payload)
      })

      return response
    } catch (error) {
      console.error("Pollinations Text (POST) error:", error.message)
      throw error
    }
  }

  /**
   * Generate text with conversation context
   * @param {string} message - User message
   * @param {array} context - Conversation history
   * @param {object} options - Optional parameters
   * @returns {Promise<string>} Generated text
   */
  async generateText(message, context = [], options = {}) {
    try {
      // Build messages array
      const messages = []
      
      // Add context messages
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
      
      // Add current message
      messages.push({ role: "user", content: String(message) })

      // Use POST endpoint for conversational AI
      const payload = {
        messages,
        model: options.model || this.defaultConfig.text.model,
        seed: options.seed !== undefined ? options.seed : this.defaultConfig.text.seed,
        jsonMode: options.jsonMode || false,
      }

      return await this.generateTextAdvanced(payload)
    } catch (error) {
      console.error("Pollinations Text generation error:", error.message)
      throw error
    }
  }

  /**
   * Generate text using OpenAI-compatible endpoint
   * @param {array} messages - Chat messages in OpenAI format
   * @param {object} options - Optional parameters
   * @returns {Promise<object>} OpenAI-compatible response
   */
  async generateTextOpenAI(messages, options = {}) {
    try {
      const url = `${this.baseUrls.text}/openai`
      
      const payload = {
        messages,
        model: options.model || "openai",
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2048,
        stream: options.stream || false,
      }

      console.log('🌸 Pollinations OpenAI endpoint:', JSON.stringify(payload).slice(0, 200))
      
      const response = await this.makeRequestJSON(url, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      return response
    } catch (error) {
      console.error("Pollinations OpenAI endpoint error:", error.message)
      throw error
    }
  }

  /**
   * Generate an image from a text prompt
   * @param {string} prompt - Image description
   * @param {object} options - Image generation options
   * @returns {Promise<string>} Image URL
   */
  async generateImage(prompt, options = {}) {
    try {
      const encodedPrompt = encodeURIComponent(prompt)
      const params = new URLSearchParams()
      
      // Add options
      if (options.width) params.append('width', options.width)
      if (options.height) params.append('height', options.height)
      if (options.seed !== undefined) params.append('seed', options.seed)
      if (options.model) params.append('model', options.model)
      if (options.nologo !== undefined) params.append('nologo', options.nologo)
      if (options.enhance !== undefined) params.append('enhance', options.enhance)
      
      const queryString = params.toString()
      const imageUrl = `${this.baseUrls.image}/prompt/${encodedPrompt}${queryString ? `?${queryString}` : ''}`
      
      console.log('🌸 Pollinations Image URL:', imageUrl)
      
      return imageUrl
    } catch (error) {
      console.error("Pollinations Image generation error:", error.message)
      throw error
    }
  }

  /**
   * Get list of available image models
   * @returns {Promise<array>} List of image models
   */
  async getImageModels() {
    try {
      const url = `${this.baseUrls.image}/models`
      const response = await this.makeRequestJSON(url, {
        method: "GET",
      })
      
      return response
    } catch (error) {
      console.error("Pollinations get image models error:", error.message)
      throw error
    }
  }

  /**
   * Get list of available text models
   * @returns {Promise<array>} List of text models
   */
  async getTextModels() {
    try {
      const url = `${this.baseUrls.text}/models`
      const response = await this.makeRequestJSON(url, {
        method: "GET",
      })
      
      return response
    } catch (error) {
      console.error("Pollinations get text models error:", error.message)
      throw error
    }
  }

  /**
   * Generate audio (text-to-speech)
   * @param {string} text - Text to convert to speech
   * @param {string} voice - Voice to use (alloy, echo, fable, onyx, nova, shimmer)
   * @returns {Promise<string>} Audio URL
   */
  async generateAudio(text, voice = "alloy") {
    try {
      if (!this.voices.includes(voice)) {
        console.warn(`Invalid voice "${voice}", using default "alloy"`)
        voice = "alloy"
      }
      
      const encodedText = encodeURIComponent(text)
      const audioUrl = `${this.baseUrls.text}/${encodedText}?model=openai-audio&voice=${voice}`
      
      console.log('🌸 Pollinations Audio URL:', audioUrl)
      
      return audioUrl
    } catch (error) {
      console.error("Pollinations Audio generation error:", error.message)
      throw error
    }
  }

  /**
   * Get real-time image feed
   * @returns {Promise<array>} Recent generated images
   */
  async getImageFeed() {
    try {
      const url = `${this.baseUrls.image}/feed`
      const response = await this.makeRequestJSON(url, {
        method: "GET",
      })
      
      return response
    } catch (error) {
      console.error("Pollinations image feed error:", error.message)
      throw error
    }
  }

  /**
   * Get real-time text feed
   * @returns {Promise<array>} Recent generated texts
   */
  async getTextFeed() {
    try {
      const url = `${this.baseUrls.text}/feed`
      const response = await this.makeRequestJSON(url, {
        method: "GET",
      })
      
      return response
    } catch (error) {
      console.error("Pollinations text feed error:", error.message)
      throw error
    }
  }

  /**
   * Make HTTP request and return text response
   */
  makeRequest(url, options) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith("https:") ? https : http
      const urlObj = new URL(url)

      const reqOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: options.method || "GET",
        headers: options.headers || {},
        timeout: options.timeout || 60000,
      }

      const req = protocol.request(reqOptions, (res) => {
        let data = ""

        res.on("data", (chunk) => {
          data += chunk
        })

        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data)
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`))
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

  /**
   * Make HTTP request and return JSON response
   */
  makeRequestJSON(url, options) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith("https:") ? https : http
      const urlObj = new URL(url)

      const reqOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: options.method || "GET",
        headers: options.headers || {},
        timeout: options.timeout || 60000,
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
}

module.exports = PollinationsProvider
