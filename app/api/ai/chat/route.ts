import { NextResponse } from "next/server"
import Groq from "groq-sdk"
import { z } from "zod"

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
})

const requestSchema = z.object({
  messages: z.array(messageSchema),
})

const SYSTEM_PROMPT = `You are a helpful and knowledgeable financial assistant. You help users with:
- Budgeting and expense tracking
- Financial planning and advice
- Investment strategies
- Debt management
- Saving tips and tricks
- Understanding financial terms and concepts

Always provide clear, actionable advice and explain financial concepts in simple terms. If you're unsure about something, acknowledge it and suggest consulting with a financial professional.

Current application context: The user is using Masari-AI Finance, a personal finance management application that helps track budgets, expenses, and financial goals.`

export async function POST(req: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return new NextResponse(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const body = await req.json()
    const { messages } = requestSchema.parse(body)

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        ],
        model: "llama3-70b-8192",
        temperature: 0.7,
        max_tokens: 4096,
        top_p: 1,
        stream: true,
      })

      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of completion) {
              const content = chunk.choices[0]?.delta?.content || ""
              if (content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
              }
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"))
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        },
      })

      return new NextResponse(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      })
    } catch (groqError: any) {
      console.error("Groq API Error:", groqError)
      return new NextResponse(
        JSON.stringify({ 
          error: groqError?.message || "Failed to get AI response"
        }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      )
    }
  } catch (error) {
    console.error("[CHAT_POST]", error)
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid request format" }),
        { 
          status: 422,
          headers: { "Content-Type": "application/json" }
        }
      )
    }
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
} 