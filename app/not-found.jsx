'use client'

import { Button } from '@/components/ui/button'
import { Home, Search, ArrowLeft, Compass, MapPin } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-20 w-8 h-8 rounded-full bg-primary/20 animate-float"></div>
        <div className="absolute top-40 right-32 w-6 h-6 rounded-full bg-blue-500/20 animate-float delay-500"></div>
        <div className="absolute bottom-32 left-40 w-10 h-10 rounded-full bg-purple-500/20 animate-float delay-1000"></div>
      </div>

      <div className="max-w-3xl w-full">
        {/* 404 Number */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="relative inline-block">
            <h1 className="text-[12rem] md:text-[16rem] font-black leading-none bg-gradient-to-br from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent animate-shimmer">
              404
            </h1>
            {/* Decorative elements around 404 */}
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
              <Compass className="w-24 h-24 text-primary/20 animate-spin-slow" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-6 animate-slide-up">
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Oops! Page Not Found
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Looks like you've ventured into the unknown! The page you're looking for seems to have vanished into the digital void. 🌌
            </p>
          </div>

          {/* Search Suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-8 max-w-2xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 hover:scale-105 transition-transform hover:border-primary/50 group">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Home className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">Go Home</h3>
                <p className="text-xs text-muted-foreground text-center">
                  Start fresh from homepage
                </p>
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 hover:scale-105 transition-transform hover:border-blue-500/50 group">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Search className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-semibold text-sm">Start Chatting</h3>
                <p className="text-xs text-muted-foreground text-center">
                  Try our AI assistant
                </p>
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 hover:scale-105 transition-transform hover:border-purple-500/50 group">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                  <MapPin className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="font-semibold text-sm">Explore</h3>
                <p className="text-xs text-muted-foreground text-center">
                  Discover our features
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/">
              <Button size="lg" className="gap-2 hover:scale-105 transition-transform shadow-lg">
                <Home className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
            <Link href="/chat">
              <Button variant="outline" size="lg" className="gap-2 hover:scale-105 transition-transform">
                <Search className="w-4 h-4" />
                Start Chatting
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="lg" 
              onClick={() => window.history.back()}
              className="gap-2 hover:scale-105 transition-transform"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          </div>

          {/* Fun Message */}
          <div className="pt-8">
            <p className="text-sm text-muted-foreground italic">
              "Not all who wander are lost... but you might be! 🗺️"
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(0) translateX(20px);
          }
          75% {
            transform: translateY(20px) translateX(10px);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-shimmer {
          background-size: 200% 200%;
          animation: shimmer 3s ease-in-out infinite;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out 0.2s both;
        }

        .animate-spin-slow {
          animation: spin 20s linear infinite;
        }

        .delay-500 {
          animation-delay: 0.5s;
        }

        .delay-700 {
          animation-delay: 0.7s;
        }

        .delay-1000 {
          animation-delay: 1s;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
