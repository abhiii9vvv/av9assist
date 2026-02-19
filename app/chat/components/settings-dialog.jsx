"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Image as ImageIcon, Settings, Sparkles } from "lucide-react"

export function SettingsDialog({ open, onOpenChange, selectedProvider, onChangeProvider }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Chat Settings
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <label className="text-sm font-medium">AI Provider</label>
            </div>
            <select
              value={selectedProvider}
              onChange={(e) => onChangeProvider(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border bg-background"
            >
              <option value="auto">Auto (Fastest Response)</option>
              <option value="gemini">Google Gemini (Vision Capable)</option>
              <option value="sambanova">SambaNova (Fast & Free)</option>
              <option value="openrouter">OpenRouter (Various Models)</option>
            </select>
            <p className="text-xs text-muted-foreground">
              {selectedProvider === "auto" && "Automatically selects the fastest available provider"}
              {selectedProvider === "gemini" && "Advanced AI with image understanding capabilities"}
              {selectedProvider === "sambanova" && "High-speed responses with excellent quality"}
              {selectedProvider === "openrouter" && "Access to multiple AI models"}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <label className="text-sm font-medium">Available Features</label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-1">
                  <ImageIcon className="w-3 h-3 text-purple-600" />
                  <span className="text-xs font-medium text-purple-800 dark:text-purple-200">Image Upload</span>
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-300">Analyze your images</p>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-3 h-3 text-orange-600" />
                  <span className="text-xs font-medium text-orange-800 dark:text-orange-200">Smart Chat</span>
                </div>
                <p className="text-xs text-orange-700 dark:text-orange-300">Context-aware AI</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
            <p className="text-xs text-muted-foreground">
              <strong>Pro tip:</strong> Use Auto mode for the best experience. The system will automatically choose the fastest provider based on availability and your request type.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
