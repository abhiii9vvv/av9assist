'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home, Bug, Zap } from 'lucide-react'

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Error:', error)
  }, [error])

  const errorMessages = [
    "Oops! Something went wrong in the matrix... 🤖",
    "Houston, we have a problem! 🚀",
    "The hamsters powering our servers took a break! 🐹",
    "Our AI had a brief existential crisis... 🤔",
    "Error 404: Smooth sailing not found! ⛵",
    "The code gremlins struck again! 👾",
    "Whoopsie daisy! Something broke... 💥",
  ]

  const randomMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card/30 to-background p-4">
      <div className="max-w-2xl w-full">
        {/* Animated Error Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Pulsing circles */}
            <div className="absolute inset-0 animate-ping opacity-20">
              <div className="w-32 h-32 rounded-full bg-destructive"></div>
            </div>
            <div className="absolute inset-0 animate-pulse">
              <div className="w-32 h-32 rounded-full bg-destructive/30"></div>
            </div>
            {/* Main icon */}
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center animate-bounce shadow-2xl">
              <AlertTriangle className="w-16 h-16 text-destructive-foreground animate-pulse" />
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-yellow-500 animate-bounce delay-150"></div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-orange-500 animate-bounce delay-300"></div>
          </div>
        </div>

        {/* Error Content */}
        <div className="text-center space-y-6 animate-fade-in">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-destructive via-red-500 to-orange-500 bg-clip-text text-transparent animate-pulse">
              Something Went Wrong!
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground animate-slide-up">
              {randomMessage}
            </p>
          </div>

          {/* Error Details */}
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 text-left animate-slide-up delay-100">
            <div className="flex items-start gap-3">
              <Bug className="w-5 h-5 text-destructive mt-1 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <p className="text-sm font-semibold text-foreground">Error Details:</p>
                <p className="text-sm text-muted-foreground font-mono break-all">
                  {error.message || 'An unexpected error occurred'}
                </p>
              </div>
            </div>
          </div>

          {/* Helpful Tips */}
          <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/20 rounded-lg p-6 text-left animate-slide-up delay-200">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0 animate-pulse" />
              <div className="space-y-2 flex-1">
                <p className="text-sm font-semibold text-foreground">Quick Fixes:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Try refreshing the page</li>
                  <li>• Check your internet connection</li>
                  <li>• Clear your browser cache</li>
                  <li>• If the problem persists, try again later</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 animate-slide-up delay-300">
            <Button
              onClick={reset}
              size="lg"
              className="gap-2 hover:scale-105 transition-transform shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              size="lg"
              className="gap-2 hover:scale-105 transition-transform"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-destructive/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }

        .delay-100 {
          animation-delay: 0.1s;
        }

        .delay-150 {
          animation-delay: 0.15s;
        }

        .delay-200 {
          animation-delay: 0.2s;
        }

        .delay-300 {
          animation-delay: 0.3s;
        }

        .delay-500 {
          animation-delay: 0.5s;
        }
      `}</style>
    </div>
  )
}
