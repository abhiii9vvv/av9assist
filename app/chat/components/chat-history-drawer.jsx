"use client"

import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { MessageSquare, Search, Star, Trash2 } from "lucide-react"

export function ChatHistoryDrawer({
  open,
  onOpenChange,
  conversations,
  filteredConversations,
  isInitialLoading,
  showOnlyFavorites,
  onToggleFavorites,
  searchQuery,
  onSearchChange,
  onOpenConversation,
  onDeleteConversation,
  onToggleFavorite,
  onPromptPreset,
  isFavorite,
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] bg-gradient-to-b from-background via-card/80 to-background">
        <DrawerHeader className="border-b bg-gradient-to-r from-card/90 via-card to-card/90 backdrop-blur-sm shadow-sm">
          <DrawerTitle className="text-lg font-bold">History</DrawerTitle>
          {conversations.length > 0 && (
            <div className="px-1 space-y-2">
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full"
              />
              <Button
                variant={showOnlyFavorites ? "default" : "outline"}
                size="sm"
                onClick={onToggleFavorites}
                className="w-full"
              >
                <Star className="w-4 h-4 mr-2" />
                {showOnlyFavorites ? "Show All" : "Show Favorites"}
              </Button>
            </div>
          )}
        </DrawerHeader>
        <div className="px-4 pb-2 overflow-y-auto bg-gradient-to-b from-card/20 via-card/10 to-transparent">
          {isInitialLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <p className="text-sm text-muted-foreground">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            conversations.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Welcome to av9Assist!</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Start a conversation with our AI assistant. Ask questions, get help with tasks, or explore creative ideas.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPromptPreset("Hello! Can you help me get started?")}
                    className="text-xs"
                  >
                    Say Hello
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPromptPreset("What can you help me with?")}
                    className="text-xs"
                  >
                    What can you do?
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPromptPreset("Tell me a fun fact")}
                    className="text-xs"
                  >
                    Fun Fact
                  </Button>
                </div>
              </div>
            ) : showOnlyFavorites ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 mx-auto bg-yellow-500/10 rounded-full flex items-center justify-center">
                  <Star className="w-8 h-8 text-yellow-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">No favorite conversations</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Star conversations you want to keep track of. They will appear here for quick access.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleFavorites}
                  className="text-xs"
                >
                  Show All Conversations
                </Button>
              </div>
            ) : searchQuery ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">No conversations found</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Try adjusting your search terms or filters to find what you are looking for.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onSearchChange("")
                    if (showOnlyFavorites) {
                      onToggleFavorites()
                    }
                  }}
                  className="text-xs"
                >
                  Clear Search
                </Button>
              </div>
            ) : null
          ) : (
            <ul className="space-y-3">
              {filteredConversations.map((c) => (
                <li key={c.id} className="group bg-gradient-to-br from-card via-card/95 to-card/90 hover:from-card hover:via-card hover:to-card/95 border border-border rounded-xl p-4 transition-all duration-200 hover:shadow-xl hover:shadow-primary/5 hover:scale-[1.02] backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      className="text-left flex-1 min-w-0 hover:opacity-80 transition-opacity"
                      onClick={() => onOpenConversation(c.id)}
                    >
                      <div className="font-bold line-clamp-1 text-sm mb-1.5 text-foreground group-hover:text-primary transition-colors">{c.title || "Conversation"}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{new Date(c.updatedAt).toLocaleString()}</span>
                      </div>
                    </button>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onToggleFavorite(c.id)}
                        title="Toggle favorite"
                        className={`h-9 w-9 rounded-lg ${isFavorite(c.id) ? "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10" : "text-muted-foreground hover:text-foreground hover:bg-accent"} transition-all`}
                      >
                        <Star className={`w-4 h-4 ${isFavorite(c.id) ? "fill-current" : ""}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteConversation(c.id)}
                        title="Delete"
                        className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DrawerFooter className="border-t bg-gradient-to-r from-card/60 via-card/80 to-card/60 backdrop-blur-sm">
          <DrawerClose asChild>
            <Button variant="secondary" className="w-full font-semibold">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
