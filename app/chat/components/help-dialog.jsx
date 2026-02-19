"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function HelpDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Help & Tips</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Getting Started</h3>
            <div className="space-y-3 text-sm">
              <p>
                Welcome to av9Assist! Here is how to make the most of your AI assistant:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Type your message in the input field at the bottom</li>
                <li>Press Enter or click the send button to send your message</li>
                <li>Use the formatting buttons to add <strong>bold</strong>, <em>italic</em>, or <code>code</code> text</li>
                <li>Your conversations are automatically saved and can be accessed from the History panel</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Keyboard Shortcuts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">General</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>New Chat</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+K</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>History</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+/</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Regenerate</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+R</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Clear Chat</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+L</kbd>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Formatting</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Bold</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+B</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Italic</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+I</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Code</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+`</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Features</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">Conversations</h4>
                  <p className="text-muted-foreground">Start new chats, browse history, and favorite important conversations.</p>
                </div>
                <div>
                  <h4 className="font-medium">Message Actions</h4>
                  <p className="text-muted-foreground">Reply to messages, provide feedback, regenerate responses, and copy text.</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">Quick Actions</h4>
                  <p className="text-muted-foreground">Use keyboard shortcuts for faster interaction and productivity.</p>
                </div>
                <div>
                  <h4 className="font-medium">Analytics</h4>
                  <p className="text-muted-foreground">Track your usage patterns and conversation insights.</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Tips</h3>
            <div className="space-y-2 text-sm">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-blue-800 dark:text-blue-200">
                  <strong>Pro tip:</strong> Use Shift+Enter for new lines in your messages. Press Enter alone to send.
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-green-800 dark:text-green-200">
                  <strong>Be specific:</strong> The more detailed your questions, the better the AI can help you.
                </p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-purple-800 dark:text-purple-200">
                  <strong>Iterate:</strong> If you do not like a response, use the regenerate button or provide feedback.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
