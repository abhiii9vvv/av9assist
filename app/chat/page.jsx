"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FadeTransition, ScaleTransition } from "@/components/page-transition"
import { AlertCircle, ChevronDown } from "lucide-react"
import { sendMessage, ApiError } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRenderTime } from "@/components/performance-monitor"
import { ChatHeader } from "./components/chat-header"
import { PrivacyNoticeDialog } from "./components/privacy-notice-dialog"
import { ChatHistoryDrawer } from "./components/chat-history-drawer"
import { KeyboardShortcutsDialog } from "./components/keyboard-shortcuts-dialog"
import { AnalyticsDialog } from "./components/analytics-dialog"
import { HelpDialog } from "./components/help-dialog"
import { SettingsDialog } from "./components/settings-dialog"
import { ChatMessageList } from "./components/chat-message-list"
import { ChatInputArea } from "./components/chat-input-area"

export default function ChatPage() {
  // Performance monitoring
  useRenderTime('ChatPage')
  
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState("")
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isConversationLoading, setIsConversationLoading] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [conversationId, setConversationId] = useState("")
  const [error, setError] = useState("")
  const [historyOpen, setHistoryOpen] = useState(false)
  const [conversations, setConversations] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [replyingTo, setReplyingTo] = useState(null)
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [favorites, setFavorites] = useState(new Set())
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [editingContent, setEditingContent] = useState("")
  const [inputError, setInputError] = useState("")
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const streamTimersRef = useRef({})
  const sendingRef = useRef(false)
  const abortControllerRef = useRef(null)
  const router = useRouter()
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [isMobileKeyboardVisible, setIsMobileKeyboardVisible] = useState(false)
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState("auto") // auto, gemini, sambanova, openrouter
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [isImageMode, setIsImageMode] = useState(false)

  // Check for email on mount and redirect if missing
  useEffect(() => {
    const checkEmail = () => {
      const storedEmail = localStorage.getItem("av9assist_user_email")
      if (!storedEmail || !storedEmail.trim()) {
        console.log("No email found, redirecting to homepage...")
        router.replace("/")
        return false
      }
      return true
    }

    if (!checkEmail()) {
      return
    }

    setIsInitialLoading(true)
    // Get user email from localStorage
    const storedEmail = localStorage.getItem("av9assist_user_email")
    if (storedEmail) {
      setUserEmail(storedEmail)
    } else {
      // Redirect to homepage if no email found
      router.replace("/")
      return
    }
    
    // Check last activity timestamp
    const lastActivityTime = localStorage.getItem("av9assist_last_activity_time")
    const currentTime = Date.now()
    const FIFTEEN_MINUTES = 15 * 60 * 1000 // 15 minutes in milliseconds
    
    // Only restore conversation if last activity was within 15 minutes
    let shouldRestoreConversation = false
    if (lastActivityTime) {
      const timeDifference = currentTime - parseInt(lastActivityTime, 10)
      shouldRestoreConversation = timeDifference < FIFTEEN_MINUTES
      
      if (!shouldRestoreConversation) {
        console.log("Last activity was more than 15 minutes ago - starting fresh session")
        // Clear old conversation state
        localStorage.removeItem("av9assist_last_conversation_id")
        localStorage.removeItem("av9assist_last_activity_time")
      }
    }
    
    // Load conversation list
    loadConversationList()
    setIsInitialLoading(false)
    
    // After loading, refresh titles in case past entries need dedupe or welcome filtering
    setTimeout(() => {
      try { refreshAllConversationTitles() } catch {}
    }, 0)
    
    // Try to restore the last conversation only if within time window
    if (shouldRestoreConversation) {
      const lastConversationId = localStorage.getItem("av9assist_last_conversation_id")
      if (lastConversationId) {
        const restored = loadConversationMessages(lastConversationId)
        if (restored && restored.length > 0) {
          setConversationId(lastConversationId)
          setMessages(restored)
          setTimeout(() => scrollToBottom("auto"), 80)
          // Successfully restored - don't show welcome message
          return
        }
      }
    }
    
    // Start with an empty chat when no conversation is restored
    setMessages([])
  }, [])

  // Periodic check to ensure email is still present (prevents localStorage clearing during session)
  useEffect(() => {
    const emailCheckInterval = setInterval(() => {
      const storedEmail = localStorage.getItem("av9assist_user_email")
      if (!storedEmail || !storedEmail.trim()) {
        console.log("Email removed from localStorage, redirecting to homepage...")
        clearInterval(emailCheckInterval)
        router.replace("/")
      }
    }, 3000) // Check every 3 seconds

    return () => clearInterval(emailCheckInterval)
  }, [router])


  // Check if user has seen privacy notice
  useEffect(() => {
    const hasSeenNotice = localStorage.getItem("av9assist_privacy_notice_seen")
    if (!hasSeenNotice) {
      setShowPrivacyNotice(true)
    }
  }, [])

  // Handle privacy notice acceptance
  const handlePrivacyNoticeAccept = () => {
    try {
      localStorage.setItem("av9assist_privacy_notice_seen", "true")
      setShowPrivacyNotice(false)
    } catch (e) {
      console.warn("Failed to save privacy notice status", e)
      setShowPrivacyNotice(false)
    }
  }

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("av9assist_favorites")
      if (saved) {
        setFavorites(new Set(JSON.parse(saved)))
      }
    } catch (e) {
      console.warn("Failed to load favorites", e)
    }
  }, [])

  const toggleFavorite = (conversationId) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(conversationId)) {
      newFavorites.delete(conversationId)
    } else {
      newFavorites.add(conversationId)
    }
    setFavorites(newFavorites)
    
    // Save to localStorage
    try {
      localStorage.setItem("av9assist_favorites", JSON.stringify([...newFavorites]))
    } catch (e) {
      console.warn("Failed to save favorites", e)
    }
  }

  // Auto-save message drafts (disabled - drafts will be cleared on refresh)
  useEffect(() => {
    // Drafts are no longer persisted to prevent stale content
    // Input is cleared on page refresh/revisit
  }, [inputValue, conversationId])

  // Load draft when conversation changes and update activity timestamp
  useEffect(() => {
    if (conversationId) {
      try {
        // Update last activity timestamp
        localStorage.setItem("av9assist_last_activity_time", Date.now().toString())
        localStorage.setItem("av9assist_last_conversation_id", conversationId)
        
        // Clear any old drafts - we don't restore them anymore
        const draftKey = `av9assist_draft_${conversationId}`
        localStorage.removeItem(draftKey)
        
        // Ensure input is clear when switching conversations
        if (inputValue) {
          setInputValue("")
        }
      } catch (e) {
        console.warn("Failed to update activity timestamp", e)
      }
    }
  }, [conversationId])
  
  // Save messages whenever they change
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      // Save the current conversation
      saveConversationMessages(conversationId, messages)
    }
  }, [messages, conversationId])

  // Close attachment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAttachMenu && !event.target.closest('.relative')) {
        setShowAttachMenu(false)
      }
    }

    if (showAttachMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showAttachMenu])

  const handleRegenerate = async (message) => {
    if (isTyping || sendingRef.current) return

    // Find the user message that led to this AI response
    const messageIndex = messages.findIndex(m => m.id === message.id)
    if (messageIndex === -1) return

    // Get all messages up to the user message before this AI response
    const userMessageIndex = messageIndex - 1
    if (userMessageIndex < 0) return

    const userMessage = messages[userMessageIndex]
    const messagesUpToUser = messages.slice(0, userMessageIndex + 1)

    // Remove the current AI message and any subsequent messages
    setMessages(messagesUpToUser)
    setIsTyping(true)
    setError("")

    try {
      const response = await sendMessage(userMessage.content, {
        userId: userEmail || undefined,
        conversationId: conversationId || undefined,
        regenerate: true, // Flag to indicate this is a regeneration
      })

      const aiMessage = {
        id: response.message.id,
        content: "",
        sender: "ai",
        timestamp: new Date(response.message.timestamp),
      }

      setMessages((prev) => {
        const next = [...prev, aiMessage]
        saveConversationMessages(conversationId, next)
        return next
      })

      streamInContent(response.message.content || "", aiMessage.id, () => {
        setMessages((prev) => {
          // Do not overwrite the title during regenerate
          saveConversationMessages(conversationId, prev)
          setTimeout(() => {
            try { refreshAllConversationTitles() } catch {}
          }, 0)
          return prev
        })
      })
    } catch (err) {
      console.error("Failed to regenerate message:", err)
      setError("Failed to regenerate response. Please try again.")
    } finally {
      setIsTyping(false)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K: Focus input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      
      // Ctrl/Cmd + /: Show history
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        setHistoryOpen(true)
      }
      
      // Ctrl/Cmd + R: Regenerate last AI response
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault()
        const lastAiMessage = [...messages].reverse().find(m => m.sender === 'ai')
        if (lastAiMessage && handleRegenerate) {
          handleRegenerate(lastAiMessage)
        }
      }
      
      // Ctrl/Cmd + L: Clear chat (with confirmation)
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault()
        if (window.confirm('Clear all messages in this conversation?')) {
          clearConversation()
        }
      }
      
      // Escape: Close history or clear input focus
      if (e.key === 'Escape') {
        if (historyOpen) {
          setHistoryOpen(false)
        } else if (document.activeElement === inputRef.current) {
          inputRef.current?.blur()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [historyOpen, messages, handleRegenerate])

  // Track scroll position to toggle the scroll-to-bottom button
  useEffect(() => {
    const list = document.querySelector('#chat-scroll-area')
    if (!list) return
    const onScroll = () => {
      const atBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 80
      setShowScrollToBottom(!atBottom)
    }
    list.addEventListener('scroll', onScroll, { passive: true })
    // initialize state
    onScroll()
    return () => list.removeEventListener('scroll', onScroll)
  }, [])



  const generateConversationTitle = (messages, userMessage = "") => {
    // If we have AI responses, try to extract title from them.
    // IMPORTANT: Ignore the default welcome message so it never influences titles.
    const aiMessages = messages.filter(
      (m) => m.sender === "ai" && m.id !== "welcome" && m.content?.trim()
    )

    for (const message of aiMessages) {
      const content = message.content.trim()

      // Look for markdown headers
      const h1Match = content.match(/^#\s+(.+)$/m)
      if (h1Match && h1Match[1].trim()) {
        return h1Match[1].trim().slice(0, 60)
      }

      // Look for common title patterns
      const titlePatterns = [
        /^["'](.+?)["']\s*[:-]/,  // "Title": or 'Title':
        /^(.+?)\s*[:-]\s*$/m,     // Title: or Title-
        /^(.+?)\s*\n\s*=+\s*$/m,  // Title\n===
      ]

      for (const pattern of titlePatterns) {
        const match = content.match(pattern)
        if (match && match[1].trim()) {
          return match[1].trim().slice(0, 60)
        }
      }

      // Look for first meaningful sentence
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10)
      if (sentences.length > 0) {
        const firstSentence = sentences[0].trim()
        // Skip very short or generic sentences
        if (firstSentence.length > 15 && !firstSentence.toLowerCase().includes('hello') && !firstSentence.toLowerCase().includes('hi there')) {
          return firstSentence.slice(0, 60)
        }
      }
    }

    // Fallback to user message analysis
    if (userMessage) {
      const userContent = userMessage.trim()

      // Extract key phrases from user message
      const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'can you', 'please']
      const words = userContent.toLowerCase().split(/\s+/)

      // If it's a question, try to extract the main topic
      if (questionWords.some(word => words.includes(word))) {
        // Remove question words and get the main subject
        const filteredWords = words.filter(word =>
          !questionWords.includes(word) &&
          !['is', 'are', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word)
        )
        if (filteredWords.length > 0) {
          return filteredWords.slice(0, 4).join(' ').slice(0, 60)
        }
      }

      // For non-questions, use first few meaningful words
      const meaningfulWords = words.filter(word =>
        word.length > 2 &&
        !['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'this', 'that', 'these', 'those'].includes(word)
      )
      if (meaningfulWords.length > 0) {
        return meaningfulWords.slice(0, 5).join(' ').slice(0, 60)
      }

      // Last resort: use first 8 words of user message
      return userContent.split(/\s+/).slice(0, 8).join(' ').slice(0, 60)
    }

    // Final fallback
    return "New Conversation"
  }

  const scrollToBottom = (behavior = "smooth") => {
    const node = messagesEndRef.current
    if (!node) return
    try {
      node.scrollIntoView({ behavior, block: "end" })
    } catch (e) {
      node.scrollIntoView()
    }
  }

  // Ensure conversation titles are unique within the history list.
  // If a title already exists (case-insensitive), append " (2)", " (3)", etc.
  const ensureUniqueTitle = (baseTitle, existingTitles = []) => {
    const title = (baseTitle || "New Conversation").trim() || "New Conversation"
    const lowerExisting = new Set(
      (existingTitles || []).filter(Boolean).map((t) => String(t).toLowerCase())
    )

    if (!lowerExisting.has(title.toLowerCase())) return title

    // Find next available suffix
    let n = 2
    let candidate = `${title} (${n})`
    while (lowerExisting.has(candidate.toLowerCase())) {
      n += 1
      candidate = `${title} (${n})`
    }
    return candidate
  }

  // ---- History helpers (localStorage) ----
  const LS_LIST_KEY = "av9assist_conversations"
  const LS_CONVO_KEY = (id) => `av9assist_convo_${id}`

  // Make a title from the FIRST user prompt only (truncate to keep it tidy)
  const getFirstPromptTitle = (msgs = []) => {
    const firstUser = (msgs || []).find((m) => m.sender === "user" && m.content?.trim())
    if (!firstUser) return "New Conversation"
    const text = String(firstUser.content || "").trim().replace(/\s+/g, " ")
    const words = text.split(/\s+/).slice(0, 8).join(" ")
    return words.slice(0, 60) || "New Conversation"
  }

  const loadConversationList = () => {
    try {
      const raw = localStorage.getItem(LS_LIST_KEY)
      const list = raw ? JSON.parse(raw) : []
      setConversations(Array.isArray(list) ? list : [])
    } catch (e) {
      console.warn("Failed to load conversation list", e)
      setConversations([])
    }
  }

  const saveConversationList = (list) => {
    try {
      localStorage.setItem(LS_LIST_KEY, JSON.stringify(list))
      setConversations(list)
    } catch (e) {
      console.warn("Failed to save conversation list", e)
    }
  }

  const upsertConversationMeta = (id, title, messages = []) => {
    if (!id) return
    const now = new Date().toISOString()
    const list = [...conversations]
    const idx = list.findIndex((c) => c.id === id)

    let finalTitle
    if (idx >= 0) {
      // Existing conversation: preserve existing title if present; otherwise derive from first prompt
      const current = list[idx]
      const hasTitle = current.title && String(current.title).trim().length > 0 && current.title !== "Conversation"
      if (hasTitle) {
        finalTitle = current.title
      } else {
        const base = title && title.trim().length ? title : getFirstPromptTitle(messages)
        const existingTitles = list.filter((c) => c.id !== id).map((c) => c.title).filter(Boolean)
        finalTitle = ensureUniqueTitle(base, existingTitles)
      }
      list[idx] = { ...current, title: finalTitle, updatedAt: now }
    } else {
      // New conversation: use provided title if any, else first prompt
      const base = title && title.trim().length ? title : getFirstPromptTitle(messages)
      const existingTitles = list.map((c) => c.title).filter(Boolean)
      finalTitle = ensureUniqueTitle(base, existingTitles)
      list.unshift({ id, title: finalTitle, updatedAt: now })
    }
    // keep recent 50
    saveConversationList(list.slice(0, 50))
  }

  // Recompute and de-duplicate titles for ALL saved conversations.
  // - Ignores the welcome message when computing titles.
  // - Ensures uniqueness across the entire set by appending (2), (3), ... as needed.
  const refreshAllConversationTitles = () => {
    try {
      const raw = localStorage.getItem(LS_LIST_KEY)
      const list = raw ? JSON.parse(raw) : []
      if (!Array.isArray(list) || list.length === 0) return

      const taken = new Set()
      const updated = list.map((meta) => {
        const msgs = loadConversationMessages(meta.id) || []
        // Title strictly from FIRST user prompt
        const base = getFirstPromptTitle(msgs)
        const unique = ensureUniqueTitle(base, Array.from(taken))
        taken.add(unique.toLowerCase())
        // Only change the title field; preserve id and updatedAt
        if (meta.title !== unique) {
          return { ...meta, title: unique }
        }
        return meta
      })

      // Only save if anything actually changed
      const changed = updated.some((m, i) => m.title !== list[i].title)
      if (changed) {
        saveConversationList(updated)
      }
    } catch (e) {
      console.warn("Failed to refresh conversation titles", e)
    }
  }

  const saveConversationMessages = (id, msgs) => {
    if (!id) return
    try {
      const serializable = msgs.map((m) => ({ ...m, timestamp: new Date(m.timestamp).toISOString() }))
      localStorage.setItem(LS_CONVO_KEY(id), JSON.stringify(serializable))
    } catch (e) {
      console.warn("Failed to save conversation messages", e)
    }
  }

  const loadConversationMessages = (id) => {
    if (!id) return []
    try {
      const raw = localStorage.getItem(LS_CONVO_KEY(id))
      const data = raw ? JSON.parse(raw) : []
      return Array.isArray(data) ? data : []
    } catch (e) {
      console.warn("Failed to load conversation messages", e)
      return []
    }
  }

  const deleteConversation = (id) => {
    try {
      localStorage.removeItem(LS_CONVO_KEY(id))
      const next = conversations.filter((c) => c.id !== id)
      saveConversationList(next)
      if (conversationId === id) {
        setConversationId("")
        setMessages([])
      }
    } catch (e) {
      console.warn("Failed to delete conversation", e)
    }
  }

  const openConversation = async (id) => {
    setIsConversationLoading(true)
    try {
      const msgs = loadConversationMessages(id)
      setConversationId(id)
      setMessages(msgs.length ? msgs : [])
      setHistoryOpen(false)
      // ensure scrolled
  setTimeout(() => scrollToBottom(), 50)
    } finally {
      setIsConversationLoading(false)
    }
  }

  const trackEvent = useCallback((eventName, data = {}) => {
    const analyticsData = {
      event: eventName,
      timestamp: new Date().toISOString(),
      conversationId,
      userAgent: navigator.userAgent,
      ...data
    }

    try {
      const existing = JSON.parse(localStorage.getItem('av9assist_analytics') || '[]')
      existing.push(analyticsData)
      if (existing.length > 100) {
        existing.splice(0, existing.length - 100)
      }
      localStorage.setItem('av9assist_analytics', JSON.stringify(existing))
    } catch (e) {
      console.warn('Failed to track analytics', e)
    }
  }, [conversationId])


  const handleAttachMenuToggle = () => setShowAttachMenu((prev) => !prev)

  const handleUploadClick = () => {
    fileInputRef.current?.click()
    setShowAttachMenu(false)
  }

  const handleEnableImageMode = () => {
    setIsImageMode(true)
    setShowAttachMenu(false)
    setSelectedImage(null)
    setImagePreview(null)
    setStatusMessage("Describe the image you'd like me to create.")
    trackEvent('image_mode_enabled', {
      conversationId: conversationId || null,
    })
    setTimeout(() => {
      try { inputRef.current?.focus() } catch {}
    }, 0)
  }

  const handleExitImageMode = () => {
    setIsImageMode(false)
    setStatusMessage("")
    trackEvent('image_mode_cancelled', {
      conversationId: conversationId || null,
    })
  }

  const startNewChat = () => {
    trackEvent('conversation_started', { previousConversationId: conversationId })
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    // stop any streaming timers
    const timers = streamTimersRef.current || {}
    Object.values(timers).forEach((t) => clearInterval(t))
    streamTimersRef.current = {}
    setConversationId("")
    setSelectedImage(null)
    setImagePreview(null)
    setIsImageMode(false)
    setMessages([])
    setHistoryOpen(false)
  setTimeout(() => scrollToBottom(), 50)
  }

  // Image handling functions
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (isImageMode) {
      setIsImageMode(false)
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    // Compress and convert to base64
    const reader = new FileReader()
    reader.onloadend = () => {
      const img = new Image()
      img.onload = () => {
        // Create canvas for compression
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Calculate new dimensions (max 512px on longest side for faster processing)
        const maxSize = 512
        let width = img.width
        let height = img.height
        
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        } else if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress image (0.5 quality = smaller size, faster API response)
        ctx.drawImage(img, 0, 0, width, height)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5)
        
        setSelectedImage(compressedBase64)
        setImagePreview(compressedBase64)
        setError('')
        
        // Log compression stats
        const originalSize = (reader.result.length / 1024).toFixed(2)
        const compressedSize = (compressedBase64.length / 1024).toFixed(2)
        console.log(`📦 Image compressed: ${originalSize}KB → ${compressedSize}KB (${((compressedSize/originalSize)*100).toFixed(1)}% of original)`)
      }
      img.onerror = () => {
        setError('Failed to process image')
      }
      img.src = reader.result
    }
    reader.onerror = () => {
      setError('Failed to read image file')
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSendMessage = useCallback(async () => {
    const trimmedInput = inputValue.trim()
    const hasAttachment = !!selectedImage

    // Guard against rapid re-entry
    if (sendingRef.current || (trimmedInput.length === 0 && !hasAttachment && !isImageMode) || isTyping) {
      return
    }

    // Update activity timestamp when user interacts
    try {
      localStorage.setItem("av9assist_last_activity_time", Date.now().toString())
    } catch (e) {
      console.warn("Failed to update activity timestamp", e)
    }

    // Handle inline Pollinations image generation mode
    if (isImageMode) {
      if (!trimmedInput) return

      sendingRef.current = true
      setStatusMessage("Generating image with Pollinations...")
      setError("")

      const prompt = trimmedInput
      const userMessage = {
        id: Date.now().toString(),
        content: prompt,
        sender: "user",
        timestamp: new Date(),
      }

      const placeholderId = `pollinations-${Date.now()}`
      const aiPlaceholder = {
        id: placeholderId,
        content: "",
        sender: "ai",
        timestamp: new Date(),
        generatingImage: true,
      }

      let convId = conversationId
      if (!convId) {
        convId = `conv-${Date.now()}`
        setConversationId(convId)
      }

      setMessages((prev) => {
        const next = [...prev, userMessage, aiPlaceholder]
        upsertConversationMeta(convId, prompt, next)
        saveConversationMessages(convId, next)
        return next
      })

      trackEvent('image_generation_started', {
        provider: 'pollinations',
        promptLength: prompt.length,
      })

      setInputValue("")
      setIsImageMode(false)
      setReplyingTo(null)
      setSelectedImage(null)
      setImagePreview(null)
      setTimeout(() => scrollToBottom(), 100)

      try {
        const startTime = Date.now()
        
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            width: 1024,
            height: 1024,
            seed: Date.now(),
            model: 'flux',
            nologo: true,
            enhance: false,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate image')
        }

        // Since API typically takes 5-6 seconds, no need for artificial delay
        const elapsed = Date.now() - startTime
        const remainingTime = 0

        setTimeout(() => {
          setMessages((prev) => {
            const next = prev.map((msg) =>
              msg.id === placeholderId
                ? {
                    ...msg,
                    content: "",
                    generatedImage: data.imageUrl,
                    generatingImage: false,
                  }
                : msg
            )
            saveConversationMessages(convId, next)
            return next
          })

          // Delay text streaming to let image fade in smoothly
          setTimeout(() => {
            const successText = `Here is what I created for "${prompt}"`
            streamInContent(successText, placeholderId, () => {
              setMessages((prev) => {
                const finalMsgs = prev
                saveConversationMessages(convId, finalMsgs)
                return finalMsgs
              })
            })
            scrollToBottom()
          }, 300)
        }, remainingTime)

        setTimeout(() => {
          try { refreshAllConversationTitles() } catch {}
        }, 0)

        trackEvent('image_generated', {
          provider: 'pollinations',
          promptLength: prompt.length,
        })

        setStatusMessage("Image ready!")
        setTimeout(() => setStatusMessage(""), 1200)
      } catch (error) {
        console.error('Image generation error:', error)
        const message = error.message || 'Failed to generate image'
        setError(message)
        setStatusMessage(`Error: ${message}`)
        setMessages((prev) => {
          const next = prev.map((msg) =>
            msg.id === placeholderId
              ? {
                  ...msg,
                  content: `⚠️ ${message}`,
                  generatingImage: false,
                }
              : msg
          )
          saveConversationMessages(convId, next)
          return next
        })
      } finally {
        sendingRef.current = false
        setIsTyping(false)
      }

      return
    }

    // Default message flow (text and attachments)
    if (!trimmedInput && !hasAttachment) return

    sendingRef.current = true

    setStatusMessage(hasAttachment ? "Processing image attachment..." : "Sending message...")

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    const userMessage = {
      id: Date.now().toString(),
      content: trimmedInput || (hasAttachment ? "[Image]" : ""),
      sender: "user",
      timestamp: new Date(),
      image: selectedImage,
      replyTo: replyingTo ? {
        id: replyingTo.id,
        content: replyingTo.content.slice(0, 100) + (replyingTo.content.length > 100 ? "..." : ""),
        sender: replyingTo.sender
      } : null
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setSelectedImage(null)
    setImagePreview(null)
    setReplyingTo(null)

    setTimeout(() => scrollToBottom(), 100)

    trackEvent('message_sent', {
      messageLength: userMessage.content.length,
      hasReply: !!userMessage.replyTo,
      hasImage: hasAttachment,
      conversationLength: messages.length + 1,
    })
    setIsTyping(true)
    setError("")

    try {
      const response = await sendMessage(userMessage.content || "What's in this image?", {
        userId: userEmail || undefined,
        conversationId: conversationId || undefined,
        signal: controller.signal,
        image: selectedImage,
      })

      const convId = conversationId || response.conversationId
      if (!conversationId) {
        setConversationId(convId)
      }

      const aiMessage = {
        id: response.message.id,
        content: "",
        sender: "ai",
        timestamp: new Date(response.message.timestamp),
      }

      setMessages((prev) => {
        const next = [...prev, aiMessage]
        if (!conversationId) {
          upsertConversationMeta(convId, userMessage.content, next)
        } else {
          upsertConversationMeta(convId, undefined, next)
        }
        saveConversationMessages(convId, next)
        setTimeout(() => scrollToBottom(), 100)
        return next
      })

      streamInContent(response.message.content || "", aiMessage.id, () => {
        setStatusMessage("AI response complete")
        setTimeout(() => setStatusMessage(""), 1000)
        setMessages((prev) => {
          const finalMsgs = prev
          saveConversationMessages(convId, finalMsgs)
          setTimeout(() => {
            try { refreshAllConversationTitles() } catch {}
          }, 0)
          return finalMsgs
        })
      })
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Request was cancelled')
        return
      }

      console.error("Failed to send message:", err)

      let errorMessage = "Failed to send message. Please try again."
      if (err instanceof ApiError) {
        errorMessage = err.message
      }

      setError(errorMessage)
      setStatusMessage(`Error: ${errorMessage}`)

      const errorMsg = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble responding right now. Please try again in a moment.",
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
      sendingRef.current = false
      abortControllerRef.current = null
    }
  }, [inputValue, conversationId, userEmail, messages, selectedImage, isImageMode, trackEvent])

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        // allow newline
        return
      }
      e.preventDefault()
      handleSendMessage()
    }
  }



  const handleEdit = (message) => {
    setEditingMessageId(message.id)
    setEditingContent(message.content)
  }

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editingContent.trim()) return

    const messageIndex = messages.findIndex(m => m.id === editingMessageId)
    if (messageIndex === -1) return

    // Update the message content
    const updatedMessages = [...messages]
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      content: editingContent.trim(),
    }

    // Remove all subsequent messages (AI responses after this edit)
    const messagesAfterEdit = updatedMessages.slice(0, messageIndex + 1)
    setMessages(messagesAfterEdit)
    setEditingMessageId(null)
    setEditingContent("")
    setIsTyping(true)
    setError("")

    try {
      const response = await sendMessage(editingContent.trim(), {
        userId: userEmail || undefined,
        conversationId: conversationId || undefined,
        edit: true, // Flag to indicate this is an edit
      })

      const aiMessage = {
        id: response.message.id,
        content: "",
        sender: "ai",
        timestamp: new Date(response.message.timestamp),
      }

      setMessages((prev) => {
        const next = [...prev, aiMessage]
        saveConversationMessages(conversationId, next)
        return next
      })

      streamInContent(response.message.content || "", aiMessage.id, () => {
        setMessages((prev) => {
          // Do not overwrite the title during edit
          saveConversationMessages(conversationId, prev)
          setTimeout(() => {
            try { refreshAllConversationTitles() } catch {}
          }, 0)
          return prev
        })
      })
    } catch (err) {
      console.error("Failed to send edited message:", err)
      setError("Failed to send edited message. Please try again.")
    } finally {
      setIsTyping(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditingContent("")
  }

  const handleReply = (message) => {
    setReplyingTo(message)
    // Focus the input
    inputRef.current?.focus()
  }

  const cancelReply = () => {
    setReplyingTo(null)
  }

  const insertFormatting = (before, after = "") => {
    const textarea = inputRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = inputValue.substring(start, end)
    const replacement = before + selectedText + after
    const newValue = inputValue.substring(0, start) + replacement + inputValue.substring(end)
    
    setInputValue(newValue)
    
    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  const handleFeedback = (message, type) => {
    // Store feedback in localStorage for analytics
    const feedbackKey = `feedback_${message.id}`
    const feedback = {
      messageId: message.id,
      type, // 'positive' or 'negative'
      timestamp: new Date().toISOString(),
      conversationId
    }
    localStorage.setItem(feedbackKey, JSON.stringify(feedback))

    trackEvent('feedback_given', { 
      type, 
      messageId: message.id,
      messageLength: message.content.length 
    })

    // You could send this to an analytics service here
    console.log(`Feedback received: ${type} for message ${message.id}`)
  }

  // Auto-resize textarea as user types
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    const max = 200 // px max height before scroll
    el.style.height = Math.min(el.scrollHeight, max) + 'px'
  }, [inputValue])

  const dismissError = () => {
    setError("")
  }

  // Stream helper: incrementally updates message content by id while preserving other properties
  const streamInContent = (fullText, messageId, onComplete) => {
    const text = String(fullText)
    if (!text) {
      if (typeof onComplete === "function") onComplete()
      return
    }
    // Choose a base step depending on length
    const len = text.length
    const baseStep = len > 1200 ? 28 : len > 600 ? 18 : len > 300 ? 10 : 6
    const intervalMs = 22
    let i = 0

    const tick = () => {
      if (i >= text.length) {
        clear()
        if (typeof onComplete === "function") onComplete()
        return
      }
      let step = baseStep
      // Try to end at a nearby whitespace/punctuation so chunks look natural
      const sliceEnd = Math.min(i + step, text.length)
      let end = sliceEnd
      const window = text.slice(i, Math.min(i + step + 20, text.length))
      const boundary = window.search(/[\s\n\r.,;!?)]/)
      if (boundary > 0 && boundary < step + 15) {
        end = i + boundary + 1
      }

      const next = text.slice(0, end)
      setMessages((prev) => prev.map((m) => {
        if (m.id === messageId) {
          // Preserve all existing properties, only update content
          return { ...m, content: next }
        }
        return m
      }))
      i = end
    }

    const id = setInterval(tick, intervalMs)
    streamTimersRef.current[messageId] = id

    const clear = () => {
      const t = streamTimersRef.current[messageId]
      if (t) {
        clearInterval(t)
        delete streamTimersRef.current[messageId]
      }
    }
  }

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      const timers = streamTimersRef.current || {}
      Object.values(timers).forEach((t) => clearInterval(t))
      streamTimersRef.current = {}
    }
  }, [])

  const validateInput = (value) => {
    const maxLength = 4000 // Reasonable limit for chat messages
    if (value.length > maxLength) {
      setInputError(`Message too long (${value.length}/${maxLength} characters)`)
      return false
    }
    if (value.length > maxLength * 0.9) {
      setInputError(`Approaching limit (${value.length}/${maxLength})`)
    } else {
      setInputError("")
    }
    return true
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    if (validateInput(value)) {
      setInputValue(value)
    }
  }

  // Memoized filtered conversations for performance
  const filteredConversations = useMemo(() =>
    conversations.filter(conversation =>
      conversation.title?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (!showOnlyFavorites || favorites.has(conversation.id))
    ), [conversations, searchQuery, showOnlyFavorites, favorites])

  const stopStreaming = () => {
    // Abort the current request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    const timers = streamTimersRef.current || {}
    Object.values(timers).forEach((t) => clearInterval(t))
    streamTimersRef.current = {}
    // Persist whatever content exists now
    if (conversationId) {
      setMessages((prev) => {
        saveConversationMessages(conversationId, prev)
        upsertConversationMeta(conversationId, undefined, prev)
        setTimeout(() => {
          try { refreshAllConversationTitles() } catch {}
        }, 0)
        return prev
      })
    }
  }

  // Show loading screen if no email (while redirecting)
  if (!userEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Checking authentication...</p>
      </div>
    )
  }

  const trimmedInput = inputValue.trim()
  const canSend = isImageMode ? trimmedInput.length > 0 : trimmedInput.length > 0 || !!selectedImage

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col overflow-hidden">
      <PrivacyNoticeDialog
        show={showPrivacyNotice}
        onOpenChange={setShowPrivacyNotice}
        onAccept={handlePrivacyNoticeAccept}
        isStarting={false}
      />

      {/* Skip links for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary text-primary-foreground px-4 py-2 rounded z-50"
      >
        Skip to main content
      </a>
      <a 
        href="#message-input" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-40 bg-primary text-primary-foreground px-4 py-2 rounded z-50"
      >
        Skip to message input
      </a>
      
      {/* Screen reader status announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        role="status"
      >
        {statusMessage}
      </div>
      <ChatHeader
        onBack={() => router.push("/")}
        onNewChat={startNewChat}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Error Alert */}
      {error && (
        <div className="container mx-auto px-3 sm:px-4 pt-3 sm:pt-4 max-w-6xl shrink-0">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-sm">{error}</span>
              <Button variant="ghost" size="sm" onClick={dismissError} className="ml-2 min-h-[32px]">
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <ChatMessageList
        isConversationLoading={isConversationLoading}
        messages={messages}
        editingMessageId={editingMessageId}
        editingContent={editingContent}
        onEditContentChange={setEditingContent}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        onRegenerate={handleRegenerate}
        onEdit={handleEdit}
        isTyping={isTyping}
        isSending={sendingRef.current}
        messagesEndRef={messagesEndRef}
      />

      <ChatInputArea
        isMobileKeyboardVisible={isMobileKeyboardVisible}
        isImageMode={isImageMode}
        imagePreview={imagePreview}
        onRemoveImage={handleRemoveImage}
        onExitImageMode={handleExitImageMode}
        showAttachMenu={showAttachMenu}
        onToggleAttachMenu={handleAttachMenuToggle}
        onUploadClick={handleUploadClick}
        onEnableImageMode={handleEnableImageMode}
        fileInputRef={fileInputRef}
        onImageSelect={handleImageSelect}
        inputRef={inputRef}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onKeyPress={handleKeyPress}
        inputError={inputError}
        canSend={canSend}
        isTyping={isTyping}
        onSendMessage={handleSendMessage}
      />

      {/* Scroll to latest button - adjusted for fixed input */}
      {showScrollToBottom && (
        <FadeTransition>
          <div className="fixed right-3 sm:right-5 bottom-24 sm:bottom-28 z-30">
            <ScaleTransition>
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full shadow transition-all duration-300 min-w-[44px] min-h-[44px]"
                onClick={() => {
                  const list = document.querySelector('#chat-scroll-area')
                  if (list) list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' })
                  setShowScrollToBottom(false)
                }}
                title="Scroll to latest"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </ScaleTransition>
          </div>
        </FadeTransition>
      )}

      <ChatHistoryDrawer
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        conversations={conversations}
        filteredConversations={filteredConversations}
        isInitialLoading={isInitialLoading}
        showOnlyFavorites={showOnlyFavorites}
        onToggleFavorites={() => setShowOnlyFavorites(!showOnlyFavorites)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenConversation={openConversation}
        onDeleteConversation={deleteConversation}
        onToggleFavorite={toggleFavorite}
        isFavorite={(id) => favorites.has(id)}
        onPromptPreset={(text) => {
          setInputValue(text)
          setHistoryOpen(false)
        }}
      />

      <KeyboardShortcutsDialog
        open={showKeyboardShortcuts}
        onOpenChange={setShowKeyboardShortcuts}
      />

      <AnalyticsDialog
        open={showAnalytics}
        onOpenChange={setShowAnalytics}
      />

      <HelpDialog
        open={showHelp}
        onOpenChange={setShowHelp}
      />

      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        selectedProvider={selectedProvider}
        onChangeProvider={setSelectedProvider}
      />
    </div>
  )
}


