import OpenAI from "openai"

const FINANCE_SYSTEM_PROMPT = `
You are a helpful financial assistant for MA$ARI-AI, a personal finance management application.
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

If asked about specific transactions or data you don't have access to, explain that you can only see summary information and suggest they check the relevant section of the MA$ARI-AI app.
`

export async function POST(req: Request) {
  try {
    // Check if OpenRouter API key is configured
    const apiKey = process.env.OPENROUTER_API_KEY
    const apiBase = process.env.OPENROUTER_API_BASE || "https://openrouter.ai/api/v1"
    if (!apiKey) {
      console.error("OpenRouter API key is not configured")
      return new Response(
        JSON.stringify({
          error: "OpenRouter API key is not configured. Please add your API key to the environment variables.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        },
      )
    }

    // Parse the request body
    const body = await req.json().catch(() => null)
    if (!body || !body.messages) {
      return new Response(JSON.stringify({ error: "Invalid request. Messages are required." }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      })
    }

    const { messages } = body

    // Get the current port from the request URL
    const url = new URL(req.url)
    const port = url.port || "3000"
    const origin = `${url.protocol}//${url.hostname}:${port}`

    // Prepare the payload for OpenRouter
    const payload = {
      model: "openchat/openchat-3.5-0106", // Free model
      messages: [
        {
          role: "system",
          content: FINANCE_SYSTEM_PROMPT,
        },
        ...messages,
      ],
      stream: false,
    }

    // Call OpenRouter API
    const response = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": origin,
        "X-Title": "MA$ARI-AI Assistant"
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error("OpenRouter API error:", error)
      return new Response(
        JSON.stringify({
          error: error.error?.message || error.error || "There was a problem with the AI service. Please try again later.",
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        },
      )
    }

    const data = await response.json()
    if (!data.choices?.[0]?.message?.content) {
      console.error("Invalid response from OpenRouter:", data)
      return new Response(
        JSON.stringify({
          error: "Received invalid response from AI service. Please try again.",
        }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        },
      )
    }

    const aiMessage = data.choices[0].message.content

    return new Response(
      JSON.stringify({
        content: aiMessage,
        role: "assistant",
      }),
      {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      },
    )
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
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      },
    )
  }
}
