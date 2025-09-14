"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StaggerContainer, StaggerItem, FadeTransition, ScaleTransition } from "@/components/page-transition"
import { Sparkles, Zap, Shield, ArrowRight } from "lucide-react"
import { useRenderTime } from "@/components/performance-monitor"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Logo } from "@/components/optimized-image"

// Dynamic import for ThemeToggle since it's not critical for initial render
const DynamicThemeToggle = dynamic(
  () => import("@/components/theme-toggle").then(mod => ({ default: mod.ThemeToggle })),
  { 
    loading: () => <div className="w-8 h-8 bg-muted animate-pulse rounded-md" />,
    ssr: false 
  }
)

export default function LandingPage() {
  // Performance monitoring
  useRenderTime('LandingPage')
  
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Prefetch the chat route so the first navigation is instant
  useEffect(() => {
    try {
      // App Router supports router.prefetch
      router.prefetch?.("/chat")
    } catch {}
  }, [router])

  const handleStartChat = async () => {
    if (!name.trim()) return

    setIsLoading(true)
    // Store user name in localStorage for personalization
    localStorage.setItem("av9assist_user_name", name.trim())

    // Simulate brief loading for smooth transition
    await new Promise((resolve) => setTimeout(resolve, 800))
    router.push("/chat")
  }

  const handleSkipLogin = async () => {
    setIsLoading(true)
    // small delay to ensure overlay paints before navigation
    await new Promise((r) => setTimeout(r, 150))
    router.push("/chat")
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-background via-card to-muted overflow-x-hidden">
      {/* Header */}
      <header className="flex justify-between items-center p-3 sm:p-4 lg:p-6 sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Logo className="shrink-0" />
          <span className="text-lg sm:text-xl font-bold text-foreground truncate">av9Assist</span>
        </div>
        <div className="shrink-0">
          <DynamicThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
        <StaggerContainer className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6 lg:space-y-8">{/* Hero Content */}
          <StaggerItem className="space-y-4 sm:space-y-6">
            <FadeTransition delay={0.2}>
              <Badge variant="secondary" className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium">
                <Sparkles className="w-3 sm:w-4 h-3 sm:h-4 mr-1.5 sm:mr-2" />
                AI-Powered Assistant
              </Badge>
            </FadeTransition>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-balance leading-tight">
              Welcome to <span className="text-primary">av9Assist</span>
              <br />
              Your AI-powered assistant
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground text-pretty max-w-2xl mx-auto leading-relaxed px-2 sm:px-0">
              Experience intelligent conversations with our modern AI interface. Get instant help, creative solutions,
              and personalized assistance.
            </p>
          </StaggerItem>

          {/* Name Input Card */}
          <StaggerItem>
            <ScaleTransition>
              <Card className="max-w-md mx-3 sm:mx-auto shadow-lg border-0 bg-card/50 backdrop-blur-sm">
                <CardHeader className="text-center pb-3 sm:pb-4 lg:pb-6 px-4 sm:px-6">
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl">Get Started</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Tell us your name for a personalized experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Enter your name..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleStartChat()}
                      className="text-center text-sm sm:text-base lg:text-lg py-2.5 sm:py-3 min-h-[44px] transition-all duration-300 focus:scale-[1.02] sm:focus:scale-105"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <ScaleTransition whileHover={true} whileTap={true}>
                      <Button
                        onClick={handleStartChat}
                        disabled={!name.trim() || isLoading}
                        className="w-full py-2.5 sm:py-3 text-base sm:text-lg font-medium transition-all duration-300 min-h-[44px]"
                        size="lg"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            Starting...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            Start Chatting
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        )}
                      </Button>
                    </ScaleTransition>

                    <ScaleTransition>
                      <Button
                        onClick={handleSkipLogin}
                        variant="ghost"
                        className="w-full text-muted-foreground hover:text-foreground min-h-[44px]"
                        disabled={isLoading}
                      >
                        Skip for now
                      </Button>
                    </ScaleTransition>
                  </div>
                </CardContent>
              </Card>
            </ScaleTransition>
          </StaggerItem>

          {/* Features Grid */}
          <StaggerItem>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mt-8 sm:mt-12 lg:mt-16 px-3 sm:px-4 lg:px-0">
              <ScaleTransition>
                <Card className="border-0 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all duration-300">
                  <CardContent className="p-3 sm:p-4 lg:p-6 text-center space-y-2 sm:space-y-3 lg:space-y-4">
                    <div className="w-8 sm:w-10 lg:w-12 h-8 sm:h-10 lg:h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Zap className="w-4 sm:w-5 lg:w-6 h-4 sm:h-5 lg:h-6 text-primary" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold">Lightning Fast</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                      Get instant responses with our optimized AI engine
                    </p>
                  </CardContent>
                </Card>
              </ScaleTransition>

              <ScaleTransition>
                <Card className="border-0 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all duration-300">
                  <CardContent className="p-3 sm:p-4 lg:p-6 text-center space-y-2 sm:space-y-3 lg:space-y-4">
                    <div className="w-8 sm:w-10 lg:w-12 h-8 sm:h-10 lg:h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Shield className="w-4 sm:w-5 lg:w-6 h-4 sm:h-5 lg:h-6 text-primary" />
                    </div>
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold">Secure & Private</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                      Your conversations are protected with enterprise-grade security
                    </p>
                  </CardContent>
                </Card>
              </ScaleTransition>

              <ScaleTransition>
                <Card className="border-0 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all duration-300 sm:col-span-2 lg:col-span-1">
                  <CardContent className="p-3 sm:p-4 lg:p-6 text-center space-y-2 sm:space-y-3 lg:space-y-4">
                    <div className="w-8 sm:w-10 lg:w-12 h-8 sm:h-10 lg:h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Sparkles className="w-4 sm:w-5 lg:w-6 h-4 sm:h-5 lg:h-6 text-primary" />
                    </div>
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold">Smart & Adaptive</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                      AI that learns and adapts to your communication style
                    </p>
                  </CardContent>
                </Card>
              </ScaleTransition>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </main>
      {isLoading && (
        <div className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center space-y-3">
            <LoadingSpinner size="xl" />
            <p className="text-sm text-muted-foreground">Entering chat…</p>
          </div>
        </div>
      )}
    </div>
  )
}
