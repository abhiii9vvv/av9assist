"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function KeyboardShortcutsDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2">
            <span className="text-sm">Focus input</span>
            <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+K</kbd>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm">Show history</span>
            <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+/</kbd>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm">Regenerate last response</span>
            <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+R</kbd>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm">Clear chat</span>
            <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+L</kbd>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm">Send message</span>
            <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm">New line</span>
            <kbd className="px-2 py-1 bg-muted rounded text-xs">Shift+Enter</kbd>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
