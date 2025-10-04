'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function UnsubscribePage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  
  const [status, setStatus] = useState('idle') // idle, loading, success, error
  const [message, setMessage] = useState('')
  const [preferences, setPreferences] = useState({
    daily: true,
    updates: true,
    engagement: true,
    tips: true
  })

  const handleUnsubscribe = async (type = 'all') => {
    if (!email) {
      setStatus('error')
      setMessage('No email address provided')
      return
    }

    setStatus('loading')

    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          type,
          preferences: type === 'custom' ? preferences : null
        })
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(type === 'all' 
          ? 'You have been successfully unsubscribed from all emails.' 
          : 'Your email preferences have been updated successfully.'
        )
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to update preferences')
      }
    } catch (error) {
      setStatus('error')
      setMessage('An error occurred. Please try again.')
    }
  }

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-6 w-6" />
              Invalid Request
            </CardTitle>
            <CardDescription>
              No email address provided. Please use the unsubscribe link from your email.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Successfully Updated
            </CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              We're sad to see you go, but we respect your choice. 💙
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              You can always come back and chat with us anytime at{' '}
              <a href="/chat" className="text-primary hover:underline">av9Assist Chat</a>
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Manage Email Preferences</CardTitle>
          <CardDescription>
            Update your email subscription for: <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'error' && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">{message}</p>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-foreground">Choose what you'd like to receive:</h3>
            
            <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
              <input
                type="checkbox"
                checked={preferences.daily}
                onChange={(e) => setPreferences({ ...preferences, daily: e.target.checked })}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-sm">Daily Motivation 🌅</div>
                <div className="text-xs text-muted-foreground">Daily quotes and reminders to keep you motivated</div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
              <input
                type="checkbox"
                checked={preferences.updates}
                onChange={(e) => setPreferences({ ...preferences, updates: e.target.checked })}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-sm">Product Updates ✨</div>
                <div className="text-xs text-muted-foreground">New features and improvements</div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
              <input
                type="checkbox"
                checked={preferences.engagement}
                onChange={(e) => setPreferences({ ...preferences, engagement: e.target.checked })}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-sm">We Miss You 💙</div>
                <div className="text-xs text-muted-foreground">Occasional reminders when you haven't visited</div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
              <input
                type="checkbox"
                checked={preferences.tips}
                onChange={(e) => setPreferences({ ...preferences, tips: e.target.checked })}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-sm">Tips & Tricks 💡</div>
                <div className="text-xs text-muted-foreground">Helpful tips to get the most out of av9Assist</div>
              </div>
            </label>
          </div>

          <div className="space-y-2 pt-4">
            <Button
              onClick={() => handleUnsubscribe('custom')}
              disabled={status === 'loading'}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Preferences'
              )}
            </Button>

            <Button
              onClick={() => handleUnsubscribe('all')}
              disabled={status === 'loading'}
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50"
            >
              Unsubscribe from All Emails
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-4">
            You'll stop receiving emails within 24 hours. You can still use av9Assist chat anytime!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
