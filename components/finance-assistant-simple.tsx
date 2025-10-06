"use client"

import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bot, Send, User, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

// This is an alternative implementation using the useChat hook from ai/react
// It's simpler but has less custom styling and features

export function FinanceAssistantSimple() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "welcome-message",
        content:
          "👋 Hello! I'm your MA$ARI-AI financial assistant. I can help with budgeting advice, saving tips, and answering your financial questions. How can I assist you today?",
        role: "assistant",
      },
    ],
  })

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Financial AI Assistant
        </CardTitle>
        <CardDescription>Ask me anything about personal finance, budgeting, or your financial goals.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <ScrollArea className="h-[500px] pr-4">
            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex w-max max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                    message.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  <div className="flex items-center gap-2">
                    {message.role === "assistant" ? (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI" />
                        <AvatarFallback>
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              placeholder="Ask a financial question..."
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between text-xs text-muted-foreground">
        <p>Powered by AI</p>
        <p>Your data is kept private and secure</p>
      </CardFooter>
    </Card>
  )
}
