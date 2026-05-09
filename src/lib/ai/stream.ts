import Anthropic from "@anthropic-ai/sdk"
import OpenAI from "openai"
import { type AIProvider, CLAUDE_MODEL, DEEPSEEK_MODEL, DEEPSEEK_BASE_URL, anthropic } from "./client"

export interface StreamOptions {
  provider?: AIProvider
  apiKey?: string
  maxTokens?: number
}

/**
 * 流式 AI 响应 — 返回 ReadableStream，每个 chunk 是文本片段
 */
export function streamAIResponse(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  options?: StreamOptions,
): ReadableStream<Uint8Array> {
  const provider = options?.provider || "claude"
  const apiKey = options?.apiKey
  const maxTokens = options?.maxTokens ?? 800

  return new ReadableStream({
    async start(controller) {
      try {
        if (provider === "deepseek") {
          await streamDeepSeek(systemPrompt, messages, apiKey, maxTokens, controller)
        } else {
          await streamClaude(systemPrompt, messages, apiKey, maxTokens, controller)
        }
        controller.close()
      } catch (error) {
        console.error("Stream error:", error)
        const errMsg = error instanceof Error ? error.message : "Unknown error"
        const data = JSON.stringify({ error: errMsg })
        controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`))
        controller.close()
      }
    },
  })
}

async function streamClaude(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  apiKey: string | undefined,
  maxTokens: number,
  controller: ReadableStreamDefaultController<Uint8Array>,
) {
  const client = apiKey ? new Anthropic({ apiKey }) : anthropic
  if (!client) throw new Error("请先在设置中配置 AI API Key")

  const stream = client.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  })

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      const data = JSON.stringify({ text: event.delta.text })
      controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`))
    }
  }

  controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`))
}

async function streamDeepSeek(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  apiKey: string | undefined,
  maxTokens: number,
  controller: ReadableStreamDefaultController<Uint8Array>,
) {
  const key = apiKey || process.env.DEEPSEEK_API_KEY
  if (!key) throw new Error("请先在设置中配置 DeepSeek API Key")

  const client = new OpenAI({ apiKey: key, baseURL: DEEPSEEK_BASE_URL })

  const dm = messages.map((m) => ({
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
  }))
  dm.unshift({ role: "system", content: systemPrompt })

  const stream = await client.chat.completions.create({
    model: DEEPSEEK_MODEL,
    max_tokens: maxTokens,
    messages: dm,
    stream: true,
  })

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content
    if (text) {
      const data = JSON.stringify({ text })
      controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`))
    }
  }

  controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`))
}
