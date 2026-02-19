"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function AnalyticsDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Usage Analytics</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {(() => {
            try {
              const analytics = JSON.parse(localStorage.getItem("av9assist_analytics") || "[]")
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
  )
}
