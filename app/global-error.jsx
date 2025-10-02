'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle, Home } from 'lucide-react'

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-950 to-black p-4">
          <div className="max-w-lg w-full text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative w-32 h-32 rounded-full bg-red-600 flex items-center justify-center animate-bounce shadow-2xl">
                <AlertTriangle className="w-16 h-16 text-white animate-pulse" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-white">Critical Error!</h1>
            <p className="text-xl text-red-200">Something went catastrophically wrong!</p>
            
            <div className="bg-red-900/50 backdrop-blur-sm border border-red-700 rounded-lg p-4">
              <p className="text-sm text-red-200 font-mono break-all">
                {error?.message || 'An unexpected critical error occurred'}
              </p>
            </div>

            <div className="flex gap-3 justify-center pt-4">
              <Button onClick={reset} size="lg" variant="destructive" className="gap-2">
                Try Again
              </Button>
              <Button onClick={() => window.location.href = '/'} size="lg" variant="outline" className="gap-2">
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
