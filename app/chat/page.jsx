"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StaggerContainer, StaggerItem, FadeTransition, ScaleTransition } from "@/components/page-transition"
import { Send, ArrowLeft, Mic, AlertCircle, History as HistoryIcon, Trash2, ChevronDown, StopCircle, Plus, Download, FileText, Star, X, Bold, Italic, Code, Keyboard, BarChart, MessageSquare, Search, HelpCircle, Lock, Database, Shield, Sparkles, Image as ImageIcon } from "lucide-react"
import { sendMessage, ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ComponentLoader } from "@/components/loading-spinner"
import { ChatSkeleton, MessageSkeleton, HeaderSkeleton, InputSkeleton } from "@/components/skeleton-loaders"
import { useRenderTime } from "@/components/performance-monitor"

// Dynamic imports for better code splitting
const DynamicThemeToggle = dynamic(
  () => import("@/components/theme-toggle").then(mod => ({ default: mod.ThemeToggle })),
  { 
    loading: () => <div className="w-8 h-8 bg-muted animate-pulse rounded-md" />,
    ssr: false 
  }
)

const DynamicChatMessage = dynamic(
  () => import("@/components/chat-message").then(mod => ({ default: mod.ChatMessage })),
  { 
    loading: () => <ComponentLoader />,
    ssr: false 
  }
)

const DynamicTypingIndicator = dynamic(
  () => import("@/components/typing-indicator").then(mod => ({ default: mod.TypingIndicator })),
  { 
    loading: () => <div className="h-4 w-16 bg-muted animate-pulse rounded" />,
    ssr: false 
  }
)

// Import Drawer components normally since they are used conditionally
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function ChatPage() {
  // Performance monitoring
  useRenderTime('ChatPage')
  
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState("")
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isConversationLoading, setIsConversationLoading] = useState(false)
  const [userName, setUserName] = useState("")
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
  const [showFormattingToolbar, setShowFormattingToolbar] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [editingContent, setEditingContent] = useState("")
  const [inputError, setInputError] = useState("")
  const [isInputFocused, setIsInputFocused] = useState(false)
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

  useEffect(() => {
    setIsInitialLoading(true)
    // Get user name from localStorage
    const storedName = localStorage.getItem("av9assist_user_name")
    
    // Try to restore last active conversation
    const lastConversationId = localStorage.getItem("av9assist_last_conversation_id")
    
    // Load conversation list
    loadConversationList()
    setIsInitialLoading(false)
    
    // After loading, refresh titles in case past entries need dedupe or welcome filtering
    setTimeout(() => {
      try { refreshAllConversationTitles() } catch {}
    }, 0)
    
    // Try to restore the last conversation if it exists
    if (lastConversationId) {
      const restored = loadConversationMessages(lastConversationId)
      if (restored && restored.length > 0) {
        setConversationId(lastConversationId)
        setMessages(restored)
        // Successfully restored - don't show welcome message
        return
      }
    }
    
    // Show welcome message only if no conversation was restored
    if (storedName) {
      const welcomeMessage = {
        id: "welcome",
        content: `Hello ${storedName}! I'm av9Assist, your AI-powered assistant. How can I help you today?`,
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    } else {
      // Generic welcome message
      const welcomeMessage = {
        id: "welcome",
        content: "Hello! I'm av9Assist, your AI-powered assistant. How can I help you today?",
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    }
  }, [])

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

  // Auto-save message drafts
  useEffect(() => {
    const saveDraft = () => {
      if (inputValue.trim() && conversationId) {
        try {
          localStorage.setItem(`av9assist_draft_${conversationId}`, inputValue)
        } catch (e) {
          console.warn("Failed to save draft", e)
        }
      }
    }

    const timeoutId = setTimeout(saveDraft, 500) // Debounce saves
    return () => clearTimeout(timeoutId)
  }, [inputValue, conversationId])

  // Load draft when conversation changes
  useEffect(() => {
    if (conversationId) {
      try {
        // Save current conversation ID as last active
        localStorage.setItem("av9assist_last_conversation_id", conversationId)
        
        // Load draft for this conversation
        const draft = localStorage.getItem(`av9assist_draft_${conversationId}`)
        if (draft && !inputValue) { // Only load if input is empty
          setInputValue(draft)
        }
      } catch (e) {
        console.warn("Failed to load draft", e)
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
        userId: userName || undefined,
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
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
        // Reset to welcome
        const welcomeMessage = {
          id: "welcome",
          content: "Hello! I'm av9Assist, your AI-powered assistant. How can I help you today?",
          sender: "ai",
          timestamp: new Date(),
        }
        setMessages([welcomeMessage])
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
      setTimeout(scrollToBottom, 50)
    } finally {
      setIsConversationLoading(false)
    }
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
    const welcomeMessage = {
      id: "welcome",
      content: "Hello! I'm av9Assist, your AI-powered assistant. How can I help you today?",
      sender: "ai",
      timestamp: new Date(),
    }
    setMessages([welcomeMessage])
    setHistoryOpen(false)
    setTimeout(scrollToBottom, 50)
  }

  // Image handling functions
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

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

    // Convert to base64
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result
      setSelectedImage(base64String)
      setImagePreview(base64String)
      setError('')
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
    // Guard against rapid re-entry and require either text or image
    if (sendingRef.current || (!inputValue.trim() && !selectedImage) || isTyping) return
    sendingRef.current = true

    setStatusMessage("Sending message...")

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    const controller = new AbortController()
    abortControllerRef.current = controller

    const userMessage = {
      id: Date.now().toString(),
      content: inputValue.trim() || (selectedImage ? "[Image]" : ""),
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
    setReplyingTo(null) // Clear reply state
    
    trackEvent('message_sent', { 
      messageLength: userMessage.content.length,
      hasReply: !!userMessage.replyTo,
      hasImage: !!selectedImage,
      conversationLength: messages.length + 1
    })
    setIsTyping(true)
    setError("")

    try {
      const response = await sendMessage(userMessage.content || "What's in this image?", {
        userId: userName || undefined,
        conversationId: conversationId || undefined,
        signal: controller.signal, // Pass abort signal
        image: selectedImage,
      })

      // Update conversation ID if it's new
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

      // Insert empty AI message first, then stream in the content for a ChatGPT-like feel
      setMessages((prev) => {
        const next = [...prev, aiMessage]
        // Persist immediately: include the just-sent user message and empty ai placeholder
        // Title based on FIRST user prompt only
        if (!conversationId) {
          upsertConversationMeta(convId, userMessage.content, next)
        } else {
          upsertConversationMeta(convId, undefined, next)
        }
        saveConversationMessages(convId, next)
        return next
      })
      streamInContent(response.message.content || "", aiMessage.id, () => {
        // On complete: persist final message content and improve title
        setStatusMessage("AI response complete")
        setTimeout(() => setStatusMessage(""), 1000) // Clear after 1 second
        setMessages((prev) => {
          const finalMsgs = prev
          // Do not overwrite the title here; it's already set from the first prompt
          saveConversationMessages(convId, finalMsgs)
          setTimeout(() => {
            try { refreshAllConversationTitles() } catch {}
          }, 0)
          return finalMsgs
        })
      })
    } catch (err) {
      if (err.name === 'AbortError') {
        // Request was cancelled, don't show error
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

      // Add error message to chat
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble responding right now. Please try again in a moment.",
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      // Stop the typing indicator once the server has responded; streaming continues independently
      setIsTyping(false)
      sendingRef.current = false
      abortControllerRef.current = null
    }
  }, [inputValue, conversationId, userName, messages, selectedImage])

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
        userId: userName || undefined,
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

  const exportConversation = (format) => {
    if (!messages.length) return

    const conversationTitle = conversations.find(c => c.id === conversationId)?.title || "Conversation"
    const timestamp = new Date().toISOString().split('T')[0]

    if (format === 'json') {
      const data = {
        title: conversationTitle,
        conversationId,
        exportedAt: new Date().toISOString(),
        messages: messages.filter(m => m.id !== 'welcome').map(m => ({
          id: m.id,
          sender: m.sender,
          content: m.content,
          timestamp: m.timestamp
        }))
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${conversationTitle.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else if (format === 'markdown') {
      let markdown = `# ${conversationTitle}\n\n`
      markdown += `*Exported on ${new Date().toLocaleDateString()}*\n\n`
      markdown += `---\n\n`

      messages.filter(m => m.id !== 'welcome').forEach(message => {
        const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const sender = message.sender === 'user' ? '**You**' : '**Assistant**'
        markdown += `${sender} (${time}):\n\n${message.content}\n\n---\n\n`
      })

      const blob = new Blob([markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${conversationTitle.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
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

  // Stream helper: incrementally updates message content by id
  const streamInContent = (fullText, messageId, onComplete) => {
    const text = String(fullText)
    if (!text) return
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
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, content: next } : m)))
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

  // Analytics tracking
  const trackEvent = (eventName, data = {}) => {
    const analyticsData = {
      event: eventName,
      timestamp: new Date().toISOString(),
      conversationId,
      userAgent: navigator.userAgent,
      ...data
    }
    
    // Store in localStorage for now (could be sent to analytics service)
    try {
      const existing = JSON.parse(localStorage.getItem('av9assist_analytics') || '[]')
      existing.push(analyticsData)
      // Keep only last 100 events
      if (existing.length > 100) {
        existing.splice(0, existing.length - 100)
      }
      localStorage.setItem('av9assist_analytics', JSON.stringify(existing))
    } catch (e) {
      console.warn('Failed to track analytics', e)
    }
  }

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

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Privacy Notice Dialog */}
      <Dialog open={showPrivacyNotice} onOpenChange={setShowPrivacyNotice}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Privacy & Data Safety
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Your privacy matters.</strong> All your conversations and data are stored locally in your browser.
                </span>
              </p>
              <p className="flex items-start gap-3">
                <Database className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Local storage only.</strong> We don't have access to your messages or personal information.
                </span>
              </p>
              <p className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Complete control.</strong> You can clear your data anytime from your browser settings.
                </span>
              </p>
              <p className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Secure & private.</strong> Your conversations stay on your device and are never shared with us.
                </span>
              </p>
            </div>
            <div className="pt-2">
              <Button 
                onClick={handlePrivacyNoticeAccept}
                className="w-full"
                size="lg"
              >
                Got it, Start Chatting
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
      {/* Header */}
      <header className="border-b bg-card/70 backdrop-blur-sm sticky top-0 z-10 shadow-sm shrink-0">
        <div className="container mx-auto px-1 sm:px-2 py-2 sm:py-3 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              className="hover:scale-110 transition-transform shrink-0 min-w-[44px] min-h-[44px]"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <div className="flex items-center gap-1 min-w-0">
              {/* Hide AI logo to save space */}
              <div className="min-w-0">
                <h1 className="text-xs sm:text-sm font-semibold truncate">av9Assist</h1>
                <p className="text-xs text-muted-foreground hidden">AI Assistant</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={startNewChat}
              className="min-w-[44px] min-h-[44px]"
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHistoryOpen(true)}
              className="min-w-[44px] min-h-[44px]"
              title="History"
            >
              <HistoryIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowKeyboardShortcuts(true)}
              className="min-w-[44px] min-h-[44px]"
              title="Keyboard Shortcuts"
            >
              <Keyboard className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAnalytics(true)}
              className="min-w-[44px] min-h-[44px]"
              title="Analytics"
            >
              <BarChart className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHelp(true)}
              className="min-w-[44px] min-h-[44px]"
              title="Help & Tips"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="min-w-[44px] min-h-[44px]"
                  title="Export"
                  disabled={!messages.length || messages.length <= 1}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportConversation('json')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportConversation('markdown')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as Markdown
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DynamicThemeToggle />
          </div>
        </div>
      </header>

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

      {/* Chat Messages Area */}
      <main className="flex-1 min-h-0 overflow-hidden" role="main" aria-label="Chat messages" id="main-content">
        <div className="h-full container mx-auto px-1 sm:px-2 py-1 sm:py-2 max-w-6xl pb-20 sm:pb-24">
          <div 
            id="chat-scroll-area" 
            className="h-full space-y-2 sm:space-y-3 pb-2 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
            role="log"
            aria-label="Chat conversation"
            aria-live="polite"
            aria-atomic="false"
          >
            <div className="space-y-2 sm:space-y-3">
              <StaggerContainer>
                {isConversationLoading ? (
                  // Show skeleton loaders when loading conversation
                  [...Array(3)].map((_, i) => (
                    <StaggerItem key={`skeleton-${i}`}>
                      <FadeTransition className="flex gap-3 px-0 sm:px-0">
                        <div className="w-8 h-8 bg-muted animate-pulse rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                          <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                        </div>
                      </FadeTransition>
                    </StaggerItem>
                  ))
                ) : (
                  messages.map((message, index) => {
                    if (editingMessageId === message.id) {
                      return (
                        <StaggerItem key={message.id}>
                          <FadeTransition className="flex gap-1 sm:gap-2 flex-row-reverse px-0 sm:px-0">
                            <div className="flex flex-col gap-2 min-w-0 items-end max-w-[96%] xs:max-w-[92%] sm:max-w-[90%] md:max-w-[86%] lg:max-w-[82%] xl:max-w-[78%]">{/* Continue with existing structure */}
                              <ScaleTransition>
                                <Card className="px-3 sm:px-5 py-3 sm:py-4 border-0 shadow-xl bg-primary text-primary-foreground rounded-2xl rounded-br-md min-w-0 w-fit">
                                  <Textarea
                                    value={editingContent}
                                    onChange={(e) => setEditingContent(e.target.value)}
                                    className="min-h-[60px] bg-transparent border-none text-primary-foreground placeholder:text-primary-foreground/50 resize-none text-sm sm:text-base transition-all duration-300 focus:scale-105"
                                    placeholder="Edit your message..."
                                    autoFocus
                                  />
                                  <div className="flex gap-2 sm:gap-3 mt-3">
                                    <ScaleTransition>
                                      <Button
                                        size="sm"
                                    onClick={handleSaveEdit}
                                    disabled={!editingContent.trim()}
                                    className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-medium transition-all duration-300"
                                  >
                                    Save Changes
                                  </Button>
                                </ScaleTransition>
                                <ScaleTransition>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 transition-all duration-300"
                                  >
                                  Cancel
                                </Button>
                              </ScaleTransition>
                            </div>
                          </Card>
                        </ScaleTransition>
                      </div>
                    </FadeTransition>
                  </StaggerItem>
                )
              }

              return (
                <StaggerItem key={message.id}>
                  <FadeTransition>
                    <DynamicChatMessage
                      message={message}
                      onRegenerate={handleRegenerate}
                      onEdit={handleEdit}
                      isLast={message.sender === "ai" && index === messages.length - 1}
                      isTyping={isTyping && message.sender === "ai" && index === messages.length - 1}
                      showTimestamp={true}
                      showActions={true}
                      status={
                        message.sender === "user" && index === messages.length - 1 && sendingRef.current ? "sending" :
                        message.sender === "ai" && index === messages.length - 1 && isTyping ? "generating" :
                        null
                      }
                    />
                  </FadeTransition>
                </StaggerItem>
              )
            })
                )}
              </StaggerContainer>
          {isTyping && <DynamicTypingIndicator />}
          <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </main>

        {/* Input Area - Fixed at bottom */}
        <div className={cn(
          "fixed bottom-0 left-0 right-0 border-t bg-card/70 backdrop-blur-sm z-20 pb-safe shadow-inner transition-all duration-300",
          isMobileKeyboardVisible && "pb-2"
        )}>
          <div className="container mx-auto px-1 sm:px-2 py-1 sm:py-2 max-w-6xl">
            <FadeTransition>
              <Card className="p-1 sm:p-2 bg-gradient-to-r from-background via-background/95 to-background border soft-divider shadow-lg hover:shadow-xl transition-all duration-300" role="region" aria-label="Message input area">
                {/* Image preview */}
                {imagePreview && (
                  <div className="mb-2 relative inline-block">
                    <div className="relative group">
                      <img 
                        src={imagePreview} 
                        alt="Selected" 
                        className="max-h-32 rounded-lg border border-border shadow-md"
                      />
                      <Button
                        onClick={handleRemoveImage}
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
                <div className="flex gap-1 sm:gap-2 items-end" role="group" aria-label="Message composition">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    aria-label="Upload image"
                  />
                  {/* Image attachment button - Coming Soon */}
                  <Button
                    onClick={() => {
                      setError('Image upload feature coming soon! 🚀')
                      setTimeout(() => setError(''), 3000)
                    }}
                    variant="ghost"
                    size="icon"
                    className="min-w-[36px] min-h-[36px] transition-colors duration-200 shrink-0 opacity-50 cursor-not-allowed"
                    title="Image upload (Coming Soon)"
                    aria-label="Image upload coming soon"
                    disabled
                  >
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <Textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyPress}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                      placeholder="Type your message..."
                      className={`min-h-[36px] sm:min-h-[40px] max-h-[100px] sm:max-h-[120px] resize-none border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary text-sm sm:text-base ${
                        inputError ? "border-red-500 focus-visible:ring-red-500" : ""
                      }`}
                      disabled={false}
                      aria-label="Type your message"
                      aria-describedby={inputError ? "input-error" : undefined}
                      id="message-input"
                    />
                    {inputError && (
                      <p id="input-error" className="text-xs text-red-500 mt-1" role="alert" aria-live="polite">{inputError}</p>
                    )}
                  </div>
                  {inputValue.trim() && (
                    <ScaleTransition>
                      <Button
                        onClick={() => {
                          setInputValue("")
                          if (conversationId) {
                            try {
                              localStorage.removeItem(`av9assist_draft_${conversationId}`)
                            } catch (e) {
                              console.warn("Failed to clear draft", e)
                            }
                          }
                        }}
                        variant="ghost"
                        size="icon"
                        className="min-w-[36px] min-h-[36px] transition-colors duration-200 shrink-0"
                        title="Clear draft"
                        aria-label="Clear message draft"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </ScaleTransition>
                  )}
                  <ScaleTransition>
                    <Button
                      onClick={handleSendMessage}
                      disabled={(!inputValue.trim() && !selectedImage) || isTyping || inputError}
                      size="icon"
                      className={cn(
                        "min-w-[44px] min-h-[44px] transition-all duration-300 shrink-0",
                        (inputValue.trim() || selectedImage) && !isTyping && !inputError && "animate-pulse hover:animate-none hover:scale-105 shadow-lg"
                      )}
                      aria-label="Send message"
                      aria-disabled={(!inputValue.trim() && !selectedImage) || isTyping || inputError}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </ScaleTransition>
                </div>
              </Card>
            </FadeTransition>
          </div>
        </div>

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

      {/* History Drawer */}
      <Drawer open={historyOpen} onOpenChange={setHistoryOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>History</DrawerTitle>
            {conversations.length > 0 && (
              <div className="px-1 space-y-2">
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
                <Button
                  variant={showOnlyFavorites ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                  className="w-full"
                >
                  <Star className="w-4 h-4 mr-2" />
                  {showOnlyFavorites ? "Show All" : "Show Favorites"}
                </Button>
              </div>
            )}
          </DrawerHeader>
          <div className="px-4 pb-2 overflow-y-auto">
            {isInitialLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="flex-1 pr-2">
                      <div className="h-4 bg-muted animate-pulse rounded w-3/4 mb-1"></div>
                      <div className="h-3 bg-muted animate-pulse rounded w-1/2"></div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-8 h-8 bg-muted animate-pulse rounded-md"></div>
                      <div className="w-8 h-8 bg-muted animate-pulse rounded-md"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              conversations.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Welcome to av9Assist!</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Start a conversation with our AI assistant. Ask questions, get help with tasks, or explore creative ideas.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInputValue("Hello! Can you help me get started?")
                        setHistoryOpen(false)
                      }}
                      className="text-xs"
                    >
                      💬 Say Hello
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInputValue("What can you help me with?")
                        setHistoryOpen(false)
                      }}
                      className="text-xs"
                    >
                      ❓ What can you do?
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInputValue("Tell me a fun fact")
                        setHistoryOpen(false)
                      }}
                      className="text-xs"
                    >
                      🎯 Fun Fact
                    </Button>
                  </div>
                </div>
              ) : showOnlyFavorites ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 mx-auto bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                    <Star className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">No favorite conversations</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Star conversations you want to keep track of. They will appear here for quick access.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowOnlyFavorites(false)}
                    className="text-xs"
                  >
                    Show All Conversations
                  </Button>
                </div>
              ) : searchQuery ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">No conversations found</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Try adjusting your search terms or filters to find what you're looking for.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("")
                      setShowOnlyFavorites(false)
                    }}
                    className="text-xs"
                  >
                    Clear Search
                  </Button>
                </div>
              ) : null
            ) : (
              <ul className="divide-y divide-border/60">
                {filteredConversations.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2">
                    <button
                      className="text-left flex-1 pr-2 hover:opacity-90"
                      onClick={() => openConversation(c.id)}
                    >
                      <div className="font-medium line-clamp-1">{c.title || "Conversation"}</div>
                      <div className="text-xs text-muted-foreground">{new Date(c.updatedAt).toLocaleString()}</div>
                    </button>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => toggleFavorite(c.id)} 
                        title={favorites.has(c.id) ? "Remove from favorites" : "Add to favorites"}
                        className={favorites.has(c.id) ? "text-yellow-500" : "text-muted-foreground"}
                      >
                        <Star className={`w-4 h-4 ${favorites.has(c.id) ? "fill-current" : ""}`} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteConversation(c.id)} title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="secondary">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={showKeyboardShortcuts} onOpenChange={setShowKeyboardShortcuts}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm">Focus input</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+K</kbd>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm">Show history</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+/</kbd>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm">Regenerate last response</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+R</kbd>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm">Clear chat</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+L</kbd>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm">Send message</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm">New line</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Shift+Enter</kbd>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Usage Analytics</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(() => {
              try {
                const analytics = JSON.parse(localStorage.getItem('av9assist_analytics') || '[]')
                const stats = analytics.reduce((acc, event) => {
                  acc[event.event] = (acc[event.event] || 0) + 1
                  return acc
                }, {})
                
                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{stats.conversation_started || 0}</div>
                        <div className="text-sm text-muted-foreground">Conversations Started</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{stats.message_sent || 0}</div>
                        <div className="text-sm text-muted-foreground">Messages Sent</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{stats.feedback_given || 0}</div>
                        <div className="text-sm text-muted-foreground">Feedback Given</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{analytics.length}</div>
                        <div className="text-sm text-muted-foreground">Total Events</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      Analytics are stored locally and help improve the app
                    </div>
                  </div>
                )
              } catch (e) {
                return <div className="text-center text-muted-foreground">No analytics data available</div>
              }
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Help & Tips</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Getting Started</h3>
              <div className="space-y-3 text-sm">
                <p>
                  Welcome to av9Assist! Here's how to make the most of your AI assistant:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Type your message in the input field at the bottom</li>
                  <li>Press Enter or click the send button to send your message</li>
                  <li>Use the formatting buttons to add <strong>bold</strong>, <em>italic</em>, or <code>code</code> text</li>
                  <li>Your conversations are automatically saved and can be accessed from the History panel</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Keyboard Shortcuts</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">General</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>New Chat</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+K</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>History</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+/</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Regenerate</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+R</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Clear Chat</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+L</kbd>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Formatting</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Bold</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+B</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Italic</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+I</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Code</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+`</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Features</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">💬 Conversations</h4>
                    <p className="text-muted-foreground">Start new chats, browse history, and favorite important conversations.</p>
                  </div>
                  <div>
                    <h4 className="font-medium">📝 Message Actions</h4>
                    <p className="text-muted-foreground">Reply to messages, provide feedback, regenerate responses, and copy text.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">⚡ Quick Actions</h4>
                    <p className="text-muted-foreground">Use keyboard shortcuts for faster interaction and productivity.</p>
                  </div>
                  <div>
                    <h4 className="font-medium">📊 Analytics</h4>
                    <p className="text-muted-foreground">Track your usage patterns and conversation insights.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Tips</h3>
              <div className="space-y-2 text-sm">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-blue-800 dark:text-blue-200">
                    💡 <strong>Pro tip:</strong> Use Shift+Enter for new lines in your messages. Press Enter alone to send.
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-green-800 dark:text-green-200">
                    🎯 <strong>Be specific:</strong> The more detailed your questions, the better the AI can help you.
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-purple-800 dark:text-purple-200">
                    🔄 <strong>Iterate:</strong> If you don't like a response, use the regenerate button or provide feedback.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
