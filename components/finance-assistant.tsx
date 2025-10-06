"use client"

import { useState } from "react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bot, Send, User, Sparkles, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const EXAMPLE_QUESTIONS = [
  "How can I improve my savings rate?",
  "What's a good budget for eating out?",
  "How do I start investing with little money?",
  "What are some ways to reduce my monthly expenses?",
  "How much should I have in my emergency fund?",
]

export function FinanceAssistant() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "welcome-message",
        content:
          "👋 Hello! I'm your MA$ARI-AI financial assistant. I can help with budgeting advice, saving tips, and answering your financial questions. How can I assist you today?",
        role: "assistant",
      },
    ],
    onError: (error) => {
      console.error("Chat error:", error)
      setErrorMessage(error.message || "There was an error connecting to the AI assistant. Please try again later.")
    },
    body: {
      model: "openchat/openchat-3.5-0106"
    }
  })

  const handleExampleClick = (question: string) => {
    // Create a synthetic event that matches the expected type
    const syntheticEvent = {
      target: { value: question }
    } as React.ChangeEvent<HTMLInputElement>
    handleInputChange(syntheticEvent)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    
    if (!input.trim()) return

    try {
      await handleSubmit(e)
    } catch (error) {
      console.error("Form submission error:", error)
      setErrorMessage("Failed to send message. Please try again.")
    }
  }

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
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

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

            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUESTIONS.map((question) => (
                <Button
                  key={question}
                  variant="outline"
                  size="sm"
                  onClick={() => handleExampleClick(question)}
                  disabled={isLoading}
                type="button"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleFormSubmit} className="flex w-full gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
            placeholder="Ask me anything about your finances..."
              disabled={isLoading}
            type="text"
            />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Thinking...</span>
              </div>
            ) : (
              <Send className="h-4 w-4" />
            )}
            </Button>
          </form>
      </CardFooter>
    </Card>
  )
}
