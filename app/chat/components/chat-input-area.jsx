"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { FadeTransition, ScaleTransition } from "@/components/page-transition"
import { cn } from "@/lib/utils"
import { Send, Image as ImageIcon, Wand2, Paperclip, X } from "lucide-react"

export function ChatInputArea({
  isMobileKeyboardVisible,
  isImageMode,
  imagePreview,
  onRemoveImage,
  onExitImageMode,
  showAttachMenu,
  onToggleAttachMenu,
  onUploadClick,
  onEnableImageMode,
  fileInputRef,
  onImageSelect,
  inputRef,
  inputValue,
  onInputChange,
  onKeyPress,
  onInputFocus,
  onInputBlur,
  inputError,
  canSend,
  isTyping,
  onSendMessage,
}) {
  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 border-t bg-card/95 backdrop-blur-sm z-30 pb-safe shadow-inner transition-all duration-200",
      isMobileKeyboardVisible && "pb-2"
    )}>
      <div className="container mx-auto px-1 sm:px-2 py-1 sm:py-2 max-w-6xl">
        <FadeTransition>
          <Card
            className={cn(
              "p-1 sm:p-2 bg-card/50 backdrop-blur-sm border border-border shadow-lg transition-all duration-200",
              isImageMode && "border-purple-500/60 shadow-[0_0_25px_-12px_rgba(168,85,247,0.9)]"
            )}
            role="region"
            aria-label="Message input area"
          >
            {imagePreview && (
              <div className="mb-2 relative inline-block">
                <div className="relative group">
                  <img
                    src={imagePreview}
                    alt="Selected"
                    className="max-h-32 rounded-lg border border-border shadow-md"
                  />
                  <Button
                    onClick={onRemoveImage}
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
            {isImageMode && (
              <div className="mb-2 flex items-center justify-between gap-2 rounded-md border border-purple-300 dark:border-purple-700 bg-purple-50/80 dark:bg-purple-950/20 px-3 py-2 text-sm">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-200">
                  <Wand2 className="w-4 h-4" />
                  <span>Create Image Mode — describe what you want to see.</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExitImageMode}
                >
                  <X className="w-3 h-3 mr-1" />
                  Exit
                </Button>
              </div>
            )}
            <div className="flex gap-1 sm:gap-2 items-end" role="group" aria-label="Message composition">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onImageSelect}
                className="hidden"
                aria-label="Upload image"
              />

              <div className="relative">
                <Button
                  onClick={onToggleAttachMenu}
                  variant="ghost"
                  size="icon"
                  className="min-w-[40px] min-h-[40px] rounded-full hover:bg-muted transition-colors shrink-0"
                  title="Attach or generate"
                  aria-label="Attach menu"
                >
                  <Paperclip className="w-5 h-5" />
                </Button>

                {showAttachMenu && (
                  <div className="absolute bottom-full left-0 mb-2 bg-card backdrop-blur-xl border-2 border-border rounded-xl shadow-2xl p-2 w-52 z-[100]">
                    <button
                      onClick={onUploadClick}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent/80 transition-colors text-left"
                    >
                      <ImageIcon className="w-5 h-5 text-blue-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">Upload image</p>
                      </div>
                    </button>
                    <div className="h-px bg-border my-1" />
                    <button
                      onClick={onEnableImageMode}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent/80 transition-colors text-left"
                    >
                      <Wand2 className="w-5 h-5 text-purple-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">Generate image</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <Textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={onInputChange}
                  onKeyDown={onKeyPress}
                  onFocus={onInputFocus}
                  onBlur={onInputBlur}
                  placeholder={isImageMode ? "Describe the image you would like me to create..." : "Type your message..."}
                  className={`min-h-[36px] sm:min-h-[40px] max-h-[100px] sm:max-h-[120px] resize-none border bg-background border-border focus-visible:ring-1 focus-visible:ring-primary text-sm sm:text-base shadow-none transition-colors duration-200 ${
                    inputError ? "border-red-500 focus-visible:ring-red-500" : ""
                  } ${
                    isImageMode && !inputError ? "border-purple-400 focus-visible:ring-purple-500" : ""
                  }`}
                  disabled={false}
                  aria-label={isImageMode ? "Describe the image you want me to create" : "Type your message"}
                  aria-describedby={inputError ? "input-error" : undefined}
                  id="message-input"
                />
                {inputError && (
                  <p id="input-error" className="text-xs text-red-500 mt-1" role="alert" aria-live="polite">{inputError}</p>
                )}
              </div>

              <ScaleTransition>
                <Button
                  onClick={onSendMessage}
                  disabled={!canSend || isTyping || !!inputError}
                  size="icon"
                  className={cn(
                    "min-w-[44px] min-h-[44px] transition-all duration-300 shrink-0",
                    canSend && !isTyping && !inputError && "animate-pulse hover:animate-none hover:scale-105 shadow-lg"
                  )}
                  aria-label={isImageMode ? "Generate image" : "Send message"}
                  aria-disabled={!canSend || isTyping || !!inputError}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </ScaleTransition>
            </div>
          </Card>
        </FadeTransition>
      </div>
    </div>
  )
}
