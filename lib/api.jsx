const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

// Creative error messages for different scenarios
const ERROR_MESSAGES = {
  network: [
    "🌐 Oops! Lost connection to the AI servers. Check your internet!",
    "📡 Houston, we have a network problem! Please check your connection.",
    "🔌 Can't reach the AI brain right now. Is your internet working?",
    "🌊 Lost in the digital ocean! Please check your network connection.",
  ],
  timeout: [
    "⏰ The AI is taking too long to think. Let's try that again!",
    "⌛ Timeout! Even AIs need a break sometimes. Please retry.",
    "🐌 That took too long! The AI might be overloaded. Try again?",
  ],
  serverError: [
    "🔧 Our AI servers are having a moment. Please try again!",
    "⚠️ Something went wrong on our end. We're looking into it!",
    "🤖 The AI gremlins are at it again! Please try later.",
    "💥 Server hiccup! Give us a moment and try again.",
  ],
  badRequest: [
    "🤔 Hmm, that request didn't quite make sense. Try rephrasing?",
    "📝 Invalid request! Let's try asking that differently.",
    "❌ Something's off with that request. Mind trying again?",
  ],
  unauthorized: [
    "🔐 Access denied! Authentication required.",
    "🚫 You don't have permission for that action.",
  ],
  notFound: [
    "🔍 Couldn't find what you're looking for!",
    "❓ That resource seems to have vanished into thin air!",
  ],
  tooManyRequests: [
    "🚦 Whoa there! Slow down a bit. Too many requests!",
    "⏸️ You're going too fast! Please wait a moment before trying again.",
    "🐢 Easy there, speed racer! Let's pace ourselves.",
  ],
  serviceUnavailable: [
    "🛠️ AI service is temporarily unavailable. We'll be back soon!",
    "💤 The AI is taking a quick nap. Check back in a moment!",
    "🔄 Service maintenance in progress. Hang tight!",
  ],
  default: [
    "😅 Something unexpected happened! Please try again.",
    "🎲 Well, that was random! Mind giving it another shot?",
    "🌟 Oops! Let's pretend that didn't happen and try again!",
  ]
}

// Get a random error message based on the error type
function getErrorMessage(status) {
  let messages = ERROR_MESSAGES.default
  
  if (status === 0) {
    messages = ERROR_MESSAGES.network
  } else if (status === 408 || status === 504) {
    messages = ERROR_MESSAGES.timeout
  } else if (status >= 500) {
    messages = ERROR_MESSAGES.serverError
  } else if (status === 400) {
    messages = ERROR_MESSAGES.badRequest
  } else if (status === 401 || status === 403) {
    messages = ERROR_MESSAGES.unauthorized
  } else if (status === 404) {
    messages = ERROR_MESSAGES.notFound
  } else if (status === 429) {
    messages = ERROR_MESSAGES.tooManyRequests
  } else if (status === 503) {
    messages = ERROR_MESSAGES.serviceUnavailable
  }
  
  return messages[Math.floor(Math.random() * messages.length)]
}

export class ApiError extends Error {
  constructor(message, status, response) {
    // Use creative error message if it's a generic error
    const errorMessage = message.includes('HTTP error!') || message === 'Network error occurred'
      ? getErrorMessage(status)
      : message
    
    super(errorMessage)
    this.name = "ApiError"
    this.status = status
    this.response = response
    this.originalMessage = message
  }
}

export async function sendMessage(message, options = {}) {
  try {
    const request = {
      message,
      userId: options.userId,
      conversationId: options.conversationId,
      image: options.image || null,
    }

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: options.signal, // Add AbortController signal support
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error || getErrorMessage(response.status)
      throw new ApiError(errorMessage, response.status, response)
    }

    return await response.json()
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error // Re-throw AbortError so it can be handled specially
    }
    if (error instanceof ApiError) {
      throw error
    }
    // Network errors
    throw new ApiError(getErrorMessage(0), 0)
  }
}

export async function getChatHistory(conversationId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat?conversationId=${encodeURIComponent(conversationId)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error || getErrorMessage(response.status)
      throw new ApiError(errorMessage, response.status, response)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(getErrorMessage(0), 0)
  }
}

export async function checkApiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new ApiError(getErrorMessage(response.status), response.status, response)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(getErrorMessage(0), 0)
  }
}
