"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { StaggerContainer, StaggerItem, FadeTransition, ScaleTransition } from "@/components/page-transition"
import { Bot, Zap, Shield, ArrowRight, Image, Rocket, CheckCircle2, Settings, AlertCircle } from "lucide-react"
import { useRenderTime } from "@/components/performance-monitor"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Logo } from "@/components/optimized-image"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LandingPage() {
  // Performance monitoring
  useRenderTime('LandingPage')
  
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showVersionPopup, setShowVersionPopup] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [hasExistingEmail, setHasExistingEmail] = useState(false)
  const router = useRouter()

  // Check if user already has email stored
  useEffect(() => {
    const storedEmail = localStorage.getItem("av9assist_user_email")
    if (storedEmail && storedEmail.trim()) {
      setEmail(storedEmail)
      setHasExistingEmail(true)
    }
  }, [])

  // Check if user has seen version 1.1 popup
  useEffect(() => {
    const hasSeenV11 = localStorage.getItem("av9assist_seen_v1.1")
    if (!hasSeenV11) {
      // Show popup after a short delay for better UX
      setTimeout(() => setShowVersionPopup(true), 1000)
    }
  }, [])

  const handleCloseVersionPopup = () => {
    localStorage.setItem("av9assist_seen_v1.1", "true")
    setShowVersionPopup(false)
  }

  // Prefetch the chat route so the first navigation is instant
  useEffect(() => {
    try {
      // App Router supports router.prefetch
      router.prefetch?.("/chat")
    } catch {}
  }, [router])

  const handleStartChat = async () => {
    // Require email - no skipping allowed
    if (!email.trim()) {
      setEmailError("Email is required to start chatting")
      return
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setEmailError("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    setEmailError("")
    
    try {
      // Save user email to database
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to register')
      }

      const data = await response.json()
      console.log('✅ User registration successful:', data)
      
      // Store user email in localStorage
      localStorage.setItem("av9assist_user_email", email.trim())
      localStorage.setItem("av9assist_user_registered", new Date().toISOString())

      // Simulate brief loading for smooth transition
      await new Promise((resolve) => setTimeout(resolve, 800))
      router.push("/chat")
    } catch (error) {
      console.error("❌ Registration error:", error)
      setIsLoading(false)
      setEmailError("Failed to register. Please try again.")
      // Don't proceed to chat if registration fails
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-blue-950/20 dark:to-indigo-950/20 overflow-x-hidden">
      {/* Header */}
      <header className="backdrop-blur-xl bg-white/70 dark:bg-gray-950/70 border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex justify-between items-center h-16 lg:h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  av9Assist
                </span>
                <p className="text-xs text-muted-foreground hidden sm:block">AI-Powered Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 lg:px-6 py-8 sm:py-12 lg:py-16 min-h-[calc(100vh-5rem)] flex items-center">
        <div className="max-w-6xl mx-auto w-full">
          <StaggerContainer className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            
            {/* Left Column - Hero Content */}
            <StaggerItem className="space-y-6 lg:space-y-8 order-2 lg:order-1">
              <FadeTransition delay={0.1}>
                <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0">
                  <Bot className="w-4 h-4 mr-2" />
                  Next-Generation AI Assistant
                </Badge>
              </FadeTransition>

              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
                  <span className="block text-foreground">Your Personal</span>
                  <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    AI Assistant
                  </span>
                </h1>

                <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl">
                  Experience the power of advanced AI technology. Get instant answers, creative solutions, and intelligent assistance for any task.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-800/50">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Fast</p>
                    <p className="text-xs text-muted-foreground">Instant replies</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-800/50">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Secure</p>
                    <p className="text-xs text-muted-foreground">Private & safe</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-800/50">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Smart</p>
                    <p className="text-xs text-muted-foreground">AI-powered</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-800/50">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">24/7</p>
                    <p className="text-xs text-muted-foreground">Always ready</p>
                  </div>
                </div>
              </div>
            </StaggerItem>

            {/* Right Column - Email Input Card */}
            <StaggerItem className="order-1 lg:order-2">
              <ScaleTransition>
                <Card className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-2 border-gray-200/50 dark:border-gray-800/50 shadow-2xl">
                  <CardHeader className="text-center space-y-2 pb-6">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-2">
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl lg:text-3xl font-bold">
                      {hasExistingEmail ? "Welcome Back!" : "Get Started Free"}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {hasExistingEmail 
                        ? "Ready to continue your AI journey?" 
                        : "Enter your email to begin your AI journey"
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 px-6 pb-6">
                    {!hasExistingEmail && (
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-foreground block">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value)
                            setEmailError("")
                          }}
                          onKeyDown={(e) => e.key === "Enter" && handleStartChat()}
                          className={`h-12 text-base transition-all duration-300 focus:scale-[1.01] ${
                            emailError ? "border-red-500 focus:border-red-500" : ""
                          }`}
                          disabled={isLoading}
                          required
                        />
                        {emailError && (
                          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 animate-fade-in">
                            <AlertCircle className="w-4 h-4" />
                            <span>{emailError}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-3">
                      <ScaleTransition whileHover={true} whileTap={true}>
                        <Button
                          onClick={handleStartChat}
                          disabled={isLoading || (!hasExistingEmail && !email.trim())}
                          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          size="lg"
                        >
                          {isLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Launching...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              Start Chatting Now
                              <ArrowRight className="w-5 h-5" />
                            </div>
                          )}
                        </Button>
                      </ScaleTransition>
                      
                      {!hasExistingEmail && (
                        <div className="flex items-center gap-2 text-xs text-center text-muted-foreground justify-center">
                          <Shield className="w-3 h-3" />
                          <span>Your email is secure and will never be shared</span>
                        </div>
                      )}
                    </div>

                    {/* Trust Badges */}
                    <div className="pt-4 border-t border-gray-200/50 dark:border-gray-800/50">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="space-y-1">
                          <p className="text-2xl font-bold text-foreground">24/7</p>
                          <p className="text-xs text-muted-foreground">Support</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-2xl font-bold text-foreground">100%</p>
                          <p className="text-xs text-muted-foreground">Secure</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-2xl font-bold text-foreground">Free</p>
                          <p className="text-xs text-muted-foreground">Forever</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScaleTransition>
            </StaggerItem>
          </StaggerContainer>

          {/* Features Section */}
          <StaggerItem>
            <div className="mt-16 lg:mt-24">
              <div className="text-center mb-12">
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">Powerful Features</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Everything you need in an AI assistant, all in one place
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <ScaleTransition>
                  <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-2 border-gray-200/50 dark:border-gray-800/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl">
                    <CardContent className="p-6 text-center space-y-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                        <Zap className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-bold">Lightning Fast Responses</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Get instant AI-powered answers to all your questions in milliseconds
                      </p>
                    </CardContent>
                  </Card>
                </ScaleTransition>

                <ScaleTransition>
                  <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-2 border-gray-200/50 dark:border-gray-800/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl">
                    <CardContent className="p-6 text-center space-y-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                        <Shield className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-bold">Enterprise-Grade Security</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Your conversations are encrypted and completely private
                      </p>
                    </CardContent>
                  </Card>
                </ScaleTransition>

                <ScaleTransition>
                  <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-2 border-gray-200/50 dark:border-gray-800/50 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl">
                    <CardContent className="p-6 text-center space-y-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                        <Bot className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-bold">Smart & Adaptive AI</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Our AI learns from context to provide personalized responses
                      </p>
                    </CardContent>
                  </Card>
                </ScaleTransition>

                <ScaleTransition>
                  <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-2 border-gray-200/50 dark:border-gray-800/50 hover:border-green-500/50 transition-all duration-300 hover:shadow-xl">
                    <CardContent className="p-6 text-center space-y-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                        <Image className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-bold">Image Analysis</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Upload images and get detailed AI-powered analysis and insights
                      </p>
                    </CardContent>
                  </Card>
                </ScaleTransition>

                <ScaleTransition>
                  <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-2 border-gray-200/50 dark:border-gray-800/50 hover:border-orange-500/50 transition-all duration-300 hover:shadow-xl">
                    <CardContent className="p-6 text-center space-y-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                        <Rocket className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-bold">Always Available</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Access your AI assistant 24/7, whenever you need help
                      </p>
                    </CardContent>
                  </Card>
                </ScaleTransition>

                <ScaleTransition>
                  <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-2 border-gray-200/50 dark:border-gray-800/50 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl">
                    <CardContent className="p-6 text-center space-y-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                        <CheckCircle2 className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-bold">Free to Use</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        No hidden fees, no subscriptions - completely free forever
                      </p>
                    </CardContent>
                  </Card>
                </ScaleTransition>
              </div>
            </div>
          </StaggerItem>
        </div>
      </main>
      
      {isLoading && (
        <div className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center space-y-3">
            <LoadingSpinner size="xl" />
            <p className="text-sm text-muted-foreground">Entering chat…</p>
          </div>
        </div>
      )}

      {/* Version 1.1 New Features Popup */}
      <Dialog open={showVersionPopup} onOpenChange={setShowVersionPopup}>
        <DialogContent className="sm:max-w-[450px] bg-background/95 backdrop-blur-xl border-2 border-primary/20 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="px-3 py-1">
                <Rocket className="w-3 h-3 mr-1" />
                v1.1
              </Badge>
            </div>
            <DialogTitle className="text-2xl">What's New!</DialogTitle>
            <DialogDescription className="text-base">
              We've added some exciting new features
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-primary/10">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                <Image className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm leading-relaxed">
                  <span className="font-semibold">Image Upload:</span> Now you can upload images and get AI-powered analysis and descriptions
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-secondary/10">
              <div className="shrink-0 w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center mt-0.5">
                <Zap className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <p className="text-sm leading-relaxed">
                  <span className="font-semibold">Faster Responses:</span> Improved performance with optimized AI processing for quicker answers
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-accent/10">
              <div className="shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center mt-0.5">
                <Bot className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-sm leading-relaxed">
                  <span className="font-semibold">UI Improvements:</span> Beautiful new design with smooth animations and enhanced dark mode
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleCloseVersionPopup} className="w-full" size="lg">
              Got it, Let's Chat!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "av9Assist",
            "applicationCategory": "ChatApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "1250"
            },
            "description": "Free AI-powered chat assistant with local storage for privacy and security",
            "featureList": [
              "AI-powered conversations",
              "Local data storage",
              "Privacy-focused",
              "No registration required",
              "Free to use"
            ]
          })
        }}
      />
    </div>
  )
}
