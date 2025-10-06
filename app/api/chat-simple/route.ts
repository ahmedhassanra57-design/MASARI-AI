import { OpenAIStream, StreamingTextResponse } from "ai"
import OpenAI from "openai"

const FINANCE_SYSTEM_PROMPT = `
You are a helpful financial assistant for MasaryAI, a personal finance management application.
Your goal is to help users with their financial questions, provide budgeting advice, and offer insights on saving money.

You have access to the following information about the user's finances (but don't reveal these exact numbers unless asked):
- Current balance: $5,231.89
- Monthly income: $3,452.00
- Monthly expenses: $2,042.00
- Savings rate: 40.8%
- Top expense categories: Housing ($1,200), Food ($350), Utilities ($180)

When providing advice:
- Be specific and actionable
- Consider the user's current financial situation
- Suggest practical ways to improve their finances
- Explain financial concepts in simple terms
- Be encouraging and positive

If asked about specific transactions or data you don't have access to, explain that you can only see summary information and suggest they check the relevant section of the MasaryAI app.
`

// This is a simpler implementation using the OpenAI client directly
export async function POST(req: Request) {
  try {
    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "OpenAI API key is not configured. Please add your API key to the environment variables.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    // Create OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    })

    // Parse the request body
    const { messages } = await req.json()

    // Create the completion
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: FINANCE_SYSTEM_PROMPT,
        },
        ...messages,
      ],
      stream: true,
    })

    // Convert the response to a readable stream
    const stream = OpenAIStream(response)

    // Return a StreamingTextResponse, which sets the correct headers
    return new StreamingTextResponse(stream)
  } catch (error) {
    console.error("Error in chat API:", error)
    return new Response(
      JSON.stringify({
        error: "There was a problem with the chat service. Please try again later.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
