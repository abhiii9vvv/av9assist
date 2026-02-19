"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { StaggerContainer, StaggerItem, FadeTransition, ScaleTransition } from "@/components/page-transition"
import { ChatMessage } from "@/components/chat-message"
import { TypingIndicator } from "@/components/typing-indicator"

export function ChatMessageList({
  isConversationLoading,
  messages,
  editingMessageId,
  editingContent,
  onEditContentChange,
  onSaveEdit,
  onCancelEdit,
  onRegenerate,
  onEdit,
  isTyping,
  isSending,
  messagesEndRef,
}) {
  return (
    <main className="flex-1 min-h-0 overflow-hidden" role="main" aria-label="Chat messages" id="main-content">
      <div className="h-full container mx-auto px-1 sm:px-2 py-1 sm:py-2 max-w-6xl pb-20 sm:pb-24">
        <div
          id="chat-scroll-area"
          className="h-full space-y-2 sm:space-y-3 pb-2 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
          role="log"
          aria-label="Chat conversation"
          aria-live="polite"
          aria-atomic="false"
        >
          <div className="space-y-2 sm:space-y-3">
            <StaggerContainer>
              {isConversationLoading ? (
                <div className="flex items-center justify-center min-h-[200px]">
                  <p className="text-sm text-muted-foreground">Loading conversation...</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  if (editingMessageId === message.id) {
                    return (
                      <StaggerItem key={message.id}>
                        <FadeTransition className="flex gap-1 sm:gap-2 flex-row-reverse px-0 sm:px-0">
                          <div className="flex flex-col gap-2 min-w-0 items-end max-w-[96%] xs:max-w-[92%] sm:max-w-[90%] md:max-w-[86%] lg:max-w-[82%] xl:max-w-[78%]">
                            <ScaleTransition>
                              <Card className="px-3 sm:px-5 py-3 sm:py-4 border-0 shadow-xl bg-primary text-primary-foreground rounded-2xl rounded-br-md min-w-0 w-fit">
                                <Textarea
                                  value={editingContent}
                                  onChange={(e) => onEditContentChange(e.target.value)}
                                  className="min-h-[60px] bg-transparent border-none text-primary-foreground placeholder:text-primary-foreground/50 resize-none text-sm sm:text-base transition-all duration-300 focus:scale-105"
                                  placeholder="Edit your message..."
                                  autoFocus
                                />
                                <div className="flex gap-2 sm:gap-3 mt-3">
                                  <ScaleTransition>
                                    <Button
                                      size="sm"
                                      onClick={onSaveEdit}
                                      disabled={!editingContent.trim()}
                                      className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-medium transition-all duration-300"
                                    >
                                      Save Changes
                                    </Button>
                                  </ScaleTransition>
                                  <ScaleTransition>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={onCancelEdit}
                                      className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 transition-all duration-300"
                                    >
                                      Cancel
                                    </Button>
                                  </ScaleTransition>
                                </div>
                              </Card>
                            </ScaleTransition>
                          </div>
                        </FadeTransition>
                      </StaggerItem>
                    )
                  }

                  return (
                    <StaggerItem key={message.id}>
                      <FadeTransition>
                        <ChatMessage
                          message={message}
                          onRegenerate={onRegenerate}
                          onEdit={onEdit}
                          isLast={message.sender === "ai" && index === messages.length - 1}
                          isTyping={isTyping && message.sender === "ai" && index === messages.length - 1}
                          showTimestamp={true}
                          showActions={true}
                          status={
                            message.sender === "user" && index === messages.length - 1 && isSending ? "sending" :
                            message.sender === "ai" && index === messages.length - 1 && isTyping ? "generating" :
                            null
                          }
                        />
                      </FadeTransition>
                    </StaggerItem>
                  )
                })
              )}
            </StaggerContainer>
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </main>
  )
}
