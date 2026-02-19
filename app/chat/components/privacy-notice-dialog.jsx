"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Database, Lock, MessageSquare, Shield, Sparkles } from "lucide-react"

export function PrivacyNoticeDialog({ show, onOpenChange, onAccept, isStarting }) {
  return (
    <Dialog open={show} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-2 border-primary/20 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Privacy & Data Safety
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="flex items-start gap-3 p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-primary/10">
              <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">Your privacy matters.</strong> All your conversations and data are stored locally in your browser.
              </span>
            </p>
            <p className="flex items-start gap-3 p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-primary/10">
              <Database className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">Local storage only.</strong> We do not have access to your messages or personal information.
              </span>
            </p>
            <p className="flex items-start gap-3 p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-primary/10">
              <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">Complete control.</strong> You can clear your data anytime from your browser settings.
              </span>
            </p>
            <p className="flex items-start gap-3 p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-primary/10">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">Secure & private.</strong> Your conversations stay on your device and are never shared with us.
              </span>
            </p>
          </div>
          <div className="pt-2">
            <Button
              onClick={onAccept}
              className="w-full relative overflow-hidden group"
              size="lg"
              disabled={isStarting}
            >
              {isStarting ? (
                <span>Starting...</span>
              ) : (
                <>
                  <span className="relative z-10">Got it, Start Chatting</span>
                  <Sparkles className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
