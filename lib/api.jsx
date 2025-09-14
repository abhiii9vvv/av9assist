const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

export class ApiError extends Error {
  constructor(message, status, response) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.response = response
  }
}

export async function sendMessage(message, options = {}) {
  try {
    const request = {
      message,
      userId: options.userId,
      conversationId: options.conversationId,
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
      throw new ApiError(errorData.error || `HTTP error! status: ${response.status}`, response.status, response)
    }

    return await response.json()
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error // Re-throw AbortError so it can be handled specially
    }
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(error instanceof Error ? error.message : "Network error occurred", 0)
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
      throw new ApiError(errorData.error || `HTTP error! status: ${response.status}`, response.status, response)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(error instanceof Error ? error.message : "Network error occurred", 0)
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
      throw new ApiError(`HTTP error! status: ${response.status}`, response.status, response)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(error instanceof Error ? error.message : "Network error occurred", 0)
  }
}
