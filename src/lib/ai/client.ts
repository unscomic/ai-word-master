import Anthropic from "@anthropic-ai/sdk"
import OpenAI from "openai"

export type AIProvider = "claude" | "deepseek"

const CLAUDE_MODEL = "claude-sonnet-4-6"
const DEEPSEEK_MODEL = "deepseek-chat"
const DEEPSEEK_BASE_URL = "https://api.deepseek.com"

// 服务端 API Key（fallback）
const serverAnthropicKey = process.env.ANTHROPIC_API_KEY

// 服务端 Anthropic 客户端
export const anthropic = serverAnthropicKey
  ? new Anthropic({ apiKey: serverAnthropicKey })
  : null

/**
 * 通用 AI 响应生成
 * 优先使用用户自己的 API Key，否则用服务端的
 */
export async function generateAIResponse(
  systemPrompt: string,
  userMessage: string,
  options?: {
    maxTokens?: number
    provider?: AIProvider
    apiKey?: string
  },
): Promise<string> {
  const provider = options?.provider || "claude"
  const apiKey = options?.apiKey
  const maxTokens = options?.maxTokens ?? 1500

  if (provider === "deepseek") {
    return deepseekResponse(systemPrompt, userMessage, apiKey, maxTokens)
  }
  return claudeResponse(systemPrompt, userMessage, apiKey, maxTokens)
}

async function claudeResponse(
  systemPrompt: string,
  userMessage: string,
  apiKey?: string,
  maxTokens = 1500,
): Promise<string> {
  const client = apiKey
    ? new Anthropic({ apiKey })
    : anthropic
  if (!client) throw new Error("未配置 AI API Key，请在设置中添加")

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  })

  const block = response.content[0]
  if (block.type !== "text") {
    throw new Error("Unexpected AI response type: " + block.type)
  }
  return block.text
}

async function deepseekResponse(
  systemPrompt: string,
  userMessage: string,
  apiKey?: string,
  maxTokens = 1500,
): Promise<string> {
  const key = apiKey || process.env.DEEPSEEK_API_KEY
  if (!key) throw new Error("未配置 DeepSeek API Key，请在设置中添加")

  const client = new OpenAI({ apiKey: key, baseURL: DEEPSEEK_BASE_URL })

  const response = await client.chat.completions.create({
    model: DEEPSEEK_MODEL,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error("Empty DeepSeek response")
  return content
}

export { CLAUDE_MODEL, DEEPSEEK_MODEL, DEEPSEEK_BASE_URL }
