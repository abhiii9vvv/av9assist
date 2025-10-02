"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bot, ArrowRight, Sparkles } from "lucide-react"

const DynamicThemeToggle = dynamic(
  () => import("@/components/theme-toggle").then(mod => ({ default: mod.ThemeToggle })),
  { ssr: false }
)

export default function LandingPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const storedEmail = localStorage.getItem("av9assist_user_email")
    if (storedEmail) setEmail(storedEmail)
    router.prefetch?.("/chat")
  }, [router])

  const handleStartChat = async () => {
    if (!email.trim()) {
      setEmailError("Email is required")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setEmailError("Please enter a valid email")
      return
    }

    setIsLoading(true)
    setEmailError("")
    
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      })
      
      if (!response.ok) throw new Error('Failed to register')

      localStorage.setItem("av9assist_user_email", email.trim())
      await new Promise(r => setTimeout(r, 500))
      router.push("/chat")
    } catch (error) {
      setIsLoading(false)
      setEmailError("Failed to register. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal Header */}
      <header className="border-b">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">av9Assist</span>
          </div>
          <DynamicThemeToggle />
        </div>
      </header>

      {/* Centered Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full space-y-8 text-center">
          
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight">
              AI Assistant
            </h1>
            <p className="text-muted-foreground text-lg">
              Fast, intelligent, and always ready to help
            </p>
          </div>

          {/* Email Input */}
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setEmailError("")
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleStartChat()}
                className="h-12 text-center"
                disabled={isLoading}
              />
              {emailError && (
                <p className="text-sm text-destructive">{emailError}</p>
              )}
            </div>

            <Button
              onClick={handleStartChat}
              disabled={isLoading}
              className="w-full h-12 text-base gap-2"
              size="lg"
            >
              {isLoading ? (
                "Loading..."
              ) : (
                <>
                  Start Chatting
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

          {/* Simple Features */}
          <div className="pt-8 grid grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="space-y-1">
              <div className="font-medium text-foreground">Fast</div>
              <div className="text-xs">Instant responses</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-foreground">Secure</div>
              <div className="text-xs">Private & safe</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-foreground">Free</div>
              <div className="text-xs">No credit card</div>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          © 2025 av9Assist. Made with care.
        </div>
      </footer>
    </div>
  )
}
