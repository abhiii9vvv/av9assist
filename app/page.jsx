"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bot, ArrowRight, Settings } from "lucide-react"

const DynamicThemeToggle = dynamic(
  () => import("@/components/theme-toggle").then(mod => ({ default: mod.ThemeToggle })),
  { ssr: false }
)

export default function LandingPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [hasStoredEmail, setHasStoredEmail] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const storedEmail = localStorage.getItem("av9assist_user_email")
    if (storedEmail) {
      setEmail(storedEmail)
      setHasStoredEmail(true)
    }
    router.prefetch?.("/chat")
  }, []) // Empty dependency array - only run once on mount

  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    setEmailError("")
  }

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
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                <span>Admin</span>
              </Button>
            </Link>
            <DynamicThemeToggle />
          </div>
        </div>
      </header>

      {/* Centered Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full space-y-8 text-center">
          
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-2xl flex items-center justify-center border-2 border-purple-500/30 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="56" height="56">
                <defs>
                  <linearGradient id="av9-gradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#7c3aed"/>
                    <stop offset="100%" stopColor="#06b6d4"/>
                  </linearGradient>
                </defs>
                <rect width="64" height="64" rx="14" fill="#0b1020" fillOpacity="0.5"/>
                <g fill="none" stroke="url(#av9-gradient)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 40 L24 20 L36 40"/>
                  <path d="M40 20 L52 20 L46 28 L52 40 L38 40"/>
                </g>
                <circle cx="32" cy="32" r="30" fill="none" stroke="url(#av9-gradient)" strokeOpacity="0.25"/>
              </svg>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight">
              av9Assist
            </h1>
            <p className="text-muted-foreground text-lg">
              Your intelligent AI companion, always ready to assist
            </p>
          </div>

          {/* Email Input or Start Button */}
          <div className="space-y-4 pt-4">
            {!hasStoredEmail ? (
              // Show email input when no email is stored
              <>
                <div className="space-y-2">
                  <Input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={handleEmailChange}
                    onKeyDown={(e) => e.key === 'Enter' && handleStartChat()}
                    className="h-12 text-center border-2 border-primary/20 focus:border-primary/50 transition-colors"
                    disabled={isLoading}
                  />
                  {emailError && (
                    <p className="text-sm text-destructive">{emailError}</p>
                  )}
                </div>

                <Button
                  onClick={handleStartChat}
                  disabled={isLoading || !email.trim()}
                  className="w-full h-12 text-base gap-2 relative overflow-hidden"
                  size="lg"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="relative w-5 h-5">
                        <div className="absolute inset-0 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <div className="absolute inset-1 border-2 border-white/20 border-b-white rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                      </div>
                      <span>Launching...</span>
                    </span>
                  ) : (
                    <>
                      Start Chatting
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </>
            ) : (
              // Show only Start Chatting button when email exists
              <>
                <div className="text-center space-y-2 mb-4">
                  <p className="text-sm text-muted-foreground">Welcome back!</p>
                  <p className="font-medium text-base">{email}</p>
                  <button
                    onClick={() => {
                      setHasStoredEmail(false)
                      setEmail("")
                      localStorage.removeItem("av9assist_user_email")
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Use different email
                  </button>
                </div>
                
                <Button
                  onClick={handleStartChat}
                  disabled={isLoading}
                  className="w-full h-12 text-base gap-2 relative overflow-hidden"
                  size="lg"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="relative w-5 h-5">
                        <div className="absolute inset-0 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <div className="absolute inset-1 border-2 border-white/20 border-b-white rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                      </div>
                      <span>Launching...</span>
                    </span>
                  ) : (
                    <>
                      Start Chatting
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <button
                  onClick={() => setEmail('')}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors mt-2"
                >
                  Use a different email
                </button>
              </>
            )}
          </div>

          {/* Simple Features */}
          <div className="pt-8 grid grid-cols-3 gap-3 text-sm">
            <div className="space-y-1 p-3 rounded-xl border-2 border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40 transition-colors">
              <div className="font-medium text-foreground">Fast</div>
              <div className="text-xs text-muted-foreground">Instant responses</div>
            </div>
            <div className="space-y-1 p-3 rounded-xl border-2 border-green-500/20 bg-green-500/5 hover:border-green-500/40 transition-colors">
              <div className="font-medium text-foreground">Secure</div>
              <div className="text-xs text-muted-foreground">Private & safe</div>
            </div>
            <div className="space-y-1 p-3 rounded-xl border-2 border-purple-500/20 bg-purple-500/5 hover:border-purple-500/40 transition-colors">
              <div className="font-medium text-foreground">Free</div>
              <div className="text-xs text-muted-foreground">No credit card</div>
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
