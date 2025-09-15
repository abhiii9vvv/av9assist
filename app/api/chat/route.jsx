import { NextResponse } from "next/server"
const AIProvider = require("@/lib/ai-provider")
import autoFormatResponse from "@/lib/auto-format"



// Canonical personal name for static responses
const CANONICAL_NAME = 'ABHINAV TIWARY'

// Simple in-memory storage for demo purposes
// In production, you'd use a proper database
const conversations = new Map()

export async function POST(request) {
  try {
    const body = await request.json()

    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json({ error: "Message is required and must be a string" }, { status: 400 })
    }

    // Moderation: configurable banned words with Hindi support and regex patterns
    const rawText = String(body.message || "")
    const normalized = normalizeForMatch(rawText)

    // Include ENV-configured lists plus built-in defaults for Hindi slurs
    const defaults = 'randi,lund,chut,re:\\brandi\\w*,re:\\blund\\w*,re:\\bchut\\w*'
    const bannedList = parseBannedList([
      process.env.BANNED_WORDS,
      process.env.BANNED_WORDS_HI,
      defaults,
    ])

    if (bannedList.length > 0) {
      const hit = findBannedHit(normalized, bannedList)
      if (hit) {
        return NextResponse.json({
          message: {
            id: generateMessageId(),
            content: "Sorry, that message contains content we don't allow. Please rephrase.",
            sender: "ai",
            timestamp: new Date().toISOString(),
          },
          conversationId: body.conversationId || generateConversationId(),
          moderated: true,
        })
      }
    }

  // Generate conversation ID if not provided
  const conversationId = body.conversationId || generateConversationId()

  // Get existing conversation or create new one
    const existingMessages = conversations.get(conversationId) || []

    // Create user message
    const userMessage = {
      id: generateMessageId(),
      content: body.message.trim(),
      sender: "user",
      timestamp: new Date().toISOString(),
    }

    // Add user message to conversation
    const updatedMessages = [...existingMessages, userMessage]

    // Explicit profile reply for Abhinav ONLY when directly asked (no trigger on mere mentions)
    const staticAbhinavBio = maybeAbhinavBioReply(userMessage.content)
    if (staticAbhinavBio) {
      const aiMessage = {
        id: generateMessageId(),
        content: staticAbhinavBio, // return structured details as-is
        sender: "ai",
        timestamp: new Date().toISOString(),
      }

      updatedMessages.push(aiMessage)
      conversations.set(conversationId, updatedMessages)

      return NextResponse.json({ message: aiMessage, conversationId })
    }

    // Static reply: Abhinav's girlfriend information
    const staticAbhinav = maybeStaticAbhinavReply(userMessage.content)
    if (staticAbhinav) {
      const aiMessage = {
        id: generateMessageId(),
        content: staticAbhinav, // raw static reply
        sender: "ai",
        timestamp: new Date().toISOString(),
      }

      updatedMessages.push(aiMessage)
      conversations.set(conversationId, updatedMessages)

      return NextResponse.json({ message: aiMessage, conversationId })
    }

    // Correction: user denies creator attribution — clarify politely
    const denial = maybeCreatorDenialReply(userMessage.content)
    if (denial) {
      const aiMessage = {
        id: generateMessageId(),
        content: denial,
        sender: "ai",
        timestamp: new Date().toISOString(),
      }
      updatedMessages.push(aiMessage)
      conversations.set(conversationId, updatedMessages)
      return NextResponse.json({ message: aiMessage, conversationId })
    }

  // Static reply: handle creator/identity meta questions
    const staticReply = maybeStaticCreatorReply(userMessage.content)
    if (staticReply) {
      const aiMessage = {
        id: generateMessageId(),
        content: staticReply, // return raw, no auto-formatting
        sender: "ai",
        timestamp: new Date().toISOString(),
      }

      updatedMessages.push(aiMessage)
      conversations.set(conversationId, updatedMessages)

      return NextResponse.json({ message: aiMessage, conversationId })
    }

    // Build recent context for iterative chat (excluding the current user message)
    const recentContext = updatedMessages.slice(-10).map((m) => ({
      role: m.sender === 'ai' ? 'assistant' : m.sender,
      content: m.content,
    }))

    // Detect intents that affect formatting/rules
    const codeIntent = looksLikeCodeIntent(userMessage.content)
    const promptRequest = looksLikePromptRequest(userMessage.content)
    // Do NOT inject any hidden directives for prompt requests; and per request, also remove code-only directive
    const systemDirectives = []

    // Generate AI response with context
  const aiRaw = await generateAIResponseFastFirst(body.message, body.userId, [...systemDirectives, ...recentContext])
  // For prompt/code requests return raw; otherwise apply friendly auto-format
  const aiResponse = (promptRequest || codeIntent) ? aiRaw : autoFormatResponse(aiRaw)

    const aiMessage = {
      id: generateMessageId(),
      content: aiResponse,
      sender: "ai",
      timestamp: new Date().toISOString(),
    }

    // Add AI message to conversation
    updatedMessages.push(aiMessage)

    // Store updated conversation
    conversations.set(conversationId, updatedMessages)

    const response = {
      message: aiMessage,
      conversationId,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 })
    }

    const messages = conversations.get(conversationId) || []

    return NextResponse.json({ messages, conversationId })
  } catch (error) {
    console.error("Chat history API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper functions
function generateConversationId() {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function generateMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Simple intent matcher for creator-related questions
function maybeStaticCreatorReply(text) {
  if (!text) return ""
  const t = String(text).toLowerCase().trim()

  // patterns for “who made you / who created/built you / what company made you” etc.
  const patterns = [
    /\bwho\s+(made|created|built)\s+(you|u|this|it)\b/,               // who made you/u
    /\bwho\s+is\s+your\s+(creator|maker)\b/,                          // who is your creator
    /\bwho\s+developed\s+(you|u|this)\b/,                              // who developed you/u
    /\bwho\s+are\s+you\s+made\s+by\b/,                               // who are you made by
    /\bwhat\s+company\s+(made|created|built)\s+(you|u|this)\b/,       // what company built you
    /\bwho\s+designed\s+(you|u|this)\b/,                               // who designed you
    /\bwho\s+m[ao]d[ea]\s+(you|u)\b/,                                  // tolerate typos: mode/made u/you
    /\bwho\s+build\s+(you|u)\b/,                                       // who build u
  ]

  if (patterns.some((re) => re.test(t))) {
    return `I was built by ${CANONICAL_NAME}.`
  }
  return ""
}

// Correct claims denying the creator attribution
function maybeCreatorDenialReply(text) {
  if (!text) return ""
  const t = String(text).toLowerCase()
  // Examples: "no you are not built by abhinav tiwary", "you're not made by abhinav"
  const denyPatterns = [
    /\bnot\s+(built|made|created)\s+by\s+abhinav\b/,
    /\byou'?re\s+not\s+(built|made|created)\s+by\s+abhinav\b/,
    /\bno\s+you\s+are\s+not\s+(built|made|created)\s+by\s+abhinav\b/,
    /\b(abhinav|tiwar[yi])\s+didn'?t\s+(build|make|create)\s+you\b/,
  ]
  if (!denyPatterns.some((re) => re.test(t))) return ""

  return `For this application, I was built by ${CANONICAL_NAME}. If you meant the underlying AI models, I can use different providers to generate replies.`
}

// Static reply for questions about Abhinav's girlfriend/relationship
function maybeStaticAbhinavReply(text) {
  if (!text) return ""
  const t = String(text).toLowerCase().trim()
  if (!t.includes("abhinav")) return ""

  const gfKeywords = [
    "girlfriend",
    "gf",
    "partner",
    "dating",
    "relationship",
    "lover",
    "love life",
    "seeing",
    "together",
  ]

  const isGfQuery = gfKeywords.some((k) => t.includes(k)) ||
    /who\s+is\s+abhinav'?s?\s+(gf|girlfriend|partner)/.test(t) ||
    /abhinav'?s?\s+(gf|girlfriend|partner)\s+name/.test(t)

  if (isGfQuery) {
    return "Abhinav's girlfriend is Neha."
  }
  return ""
}

// Handle "who is abhinavb tiwary" and similar queries with provided details
function maybeAbhinavBioReply(text) {
  if (!text) return ""
  const t = String(text).toLowerCase().trim()

  // Match variants like: who is abhinav tiwary / who is abhinavb tiwary / tell me about ... / ... bio/details
  // Allow optional 'b' and minor spelling variants for 'tiwary' vs 'tiwari'
  const patterns = [
    /\bwho\s+is\s+abhinavb?\s+tiwar[yi]\b/,
    /\btell\s+me\s+about\s+abhinavb?\s+tiwar[yi]\b/,
    /\babhinavb?\s+tiwar[yi]\s+(bio|details|profile|info)\b/,
    /\babout\s+abhinavb?\s+tiwar[yi]\b/,
  ]

  if (!patterns.some((re) => re.test(t))) return ""

  // Provided details to return
  const abhinav = {
    pronouns: "he/him",
    location: "India 🇮🇳",
    currentFocus: "AI Integration & Full-Stack Development",
    philosophy: "Simplicity is the ultimate sophistication",
    currentlyLearning: [
      "Advanced React Patterns",
      "System Design",
      "Cloud Architecture",
    ],
    askMeAbout: [
      "Web Development",
      "AI Integration",
      "Data Structures",
      "Problem Solving",
    ],
    funFact: "I debug with console.log() and I'm not ashamed! 😄",
  }

  // Respond as simple Markdown for nice rendering in chat
  const lines = [
    `**${CANONICAL_NAME}**`,
    `- Pronouns: ${abhinav.pronouns}`,
    `- Location: ${abhinav.location}`,
    `- Current Focus: ${abhinav.currentFocus}`,
    `- Philosophy: ${abhinav.philosophy}`,
    `- Currently Learning: ${abhinav.currentlyLearning.join(", ")}`,
    `- Ask Me About: ${abhinav.askMeAbout.join(", ")}`,
    `- Fun Fact: ${abhinav.funFact}`,
  ]
  return lines.join("\n")
}

// Heuristic code-intent detector
function looksLikeCodeIntent(text) {
  if (!text) return false
  const t = String(text).toLowerCase()
  // Direct asks
  if (/^\s*(write|give|show|generate|create)\s+.*\b(code|function|class|script|component|regex|sql|query)\b/.test(t)) return true
  // Mentions of languages or code fences
  if (/```|\bjavascript\b|\btypescript\b|\bpython\b|\bjava\b|\bc\+\+\b|\bc#\b|\bgo\b|\brust\b|\bsql\b|\bhtml\b|\bcss\b/.test(t)) return true
  // Snippet keywords
  if (/\bexample\b.*\bcode\b|\bsnippet\b|\bboilerplate\b/.test(t)) return true
  return false
}

// Detect when user is asking for a literal prompt (e.g., "give me a prompt for ..." or "prompt code")
function looksLikePromptRequest(text) {
  if (!text) return false
  const t = String(text).toLowerCase()
  // direct asks for prompts or prompt code
  if (/\b(prompt|prompt\s+code|system\s+prompt|jailbreak\s+prompt|writing\s+prompt)\b/.test(t)) return true
  if (/\bgive\s+me\s+(a|the)\s+prompt\b|\bwrite\s+.*\bprompt\b/.test(t)) return true
  return false
}

async function generateAIResponseLegacy(userMessage, userId) {
  try {
    const aiProvider = new AIProvider()

    // Get conversation context for better responses
    const context = [
      {
        role: "system",
        content: "You are av9Assist, a helpful AI assistant. Respond naturally and helpfully to user questions.",
      },
    ]

    const result = await aiProvider.getAIResponse(userMessage, null, context)

    if (result.success) {
      console.log(`[v0] AI response generated using ${result.provider}`)
      return result.response
    } else {
      console.error("[v0] All AI providers failed:", result.error)
      return result.response // This contains the fallback message
    }
  } catch (error) {
    console.error("[v0] AI generation error:", error)

    // Fallback to simple responses if AI fails
    const message = userMessage.toLowerCase()

    if (message.includes("hello") || message.includes("hi")) {
      return userId
        ? `Hello! It's great to chat with you. How can I assist you today?`
        : "Hello! Nice to meet you. What can I help you with?"
    }

    if (message.includes("help")) {
      return "I'm here to help! I can assist with questions, provide information, help with problem-solving, or just have a conversation. What specific area would you like help with?"
    }

    return "I'm sorry, I'm having some technical difficulties right now. Please try again in a moment."
  }
}

async function generateAIResponseFastFirst(userMessage, userId, contextFromRoute = []) {
  try {
    const aiProvider = new AIProvider()
    const context = [
      {
        role: "system",
        content: "You are av9Assist, a helpful AI assistant. Respond naturally and helpfully to user questions.",
      },
      // Recent chat context from the current conversation
      ...(Array.isArray(contextFromRoute) ? contextFromRoute : []),
    ]

    // Try fast parallel first with shorter timeout to reduce latency spikes
    const fast = await aiProvider.getAIResponseFast(userMessage, null, context, { timeoutMs: 6000 })
    if (fast && fast.success) {
      console.log(`[v1] Fast AI response using ${fast.provider}`)
      return fast.response
    }

    // Fallback to legacy sequential approach
    const result = await aiProvider.getAIResponse(userMessage, null, context)
    if (result.success) {
      console.log(`[v1] Sequential AI response using ${result.provider}`)
      return result.response
    } else {
      console.error("[v1] All AI providers failed:", result.error)
      return result.response
    }
  } catch (error) {
    console.error("[v1] AI generation error:", error)
    // graceful fallback responses
    const message = String(userMessage || "").toLowerCase()
    if (message.includes("hello") || message.includes("hi")) {
      return userId
        ? `Hello! It's great to chat with you. How can I assist you today?`
        : "Hello! Nice to meet you. What can I help you with?"
    }
    if (message.includes("help")) {
      return "I'm here to help! I can assist with questions, provide information, help with problem-solving, or just have a conversation. What specific area would you like help with?"
    }
    return "I'm sorry, I'm having some technical difficulties right now. Please try again in a moment."
  }
}

// ------- Moderation helpers -------
function normalizeForMatch(text) {
  try {
    // Lowercase, normalize unicode, strip diacritics, collapse whitespace
    return String(text || "")
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '') // diacritics
      .replace(/[\p{P}\p{S}]+/gu, ' ') // punctuation/symbols
      .replace(/\s+/g, ' ') // collapse spaces
      .trim()
  } catch {
    return String(text || "").toLowerCase().trim()
  }
}

function parseBannedList(envValues = []) {
  const items = []
  for (const val of envValues) {
    if (!val) continue
    for (const raw of String(val).split(',').map((s) => s.trim()).filter(Boolean)) {
      // Allow regex via prefix: re:pattern
      if (raw.startsWith('re:')) {
        const pattern = raw.slice(3)
        try {
          items.push({ type: 're', re: new RegExp(pattern, 'i') })
        } catch {
          // ignore invalid regex entries
        }
      } else {
        items.push({ type: 'str', s: normalizeForMatch(raw) })
      }
    }
  }
  return items
}

function findBannedHit(normalizedText, bannedItems) {
  for (const item of bannedItems) {
    if (item.type === 'str') {
      if (normalizedText.includes(item.s)) return item.s
    } else if (item.type === 're') {
      if (item.re.test(normalizedText)) return item.re.source
    }
  }
  return ''
}
