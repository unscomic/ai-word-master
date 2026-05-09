import Anthropic from "@anthropic-ai/sdk"

const apiKey = process.env.ANTHROPIC_API_KEY

// 如果没有 API Key，返回 null（之后用 mock 数据）
export const anthropic = apiKey
  ? new Anthropic({ apiKey })
  : null

export const AI_MODEL = "claude-sonnet-4-6"

export async function generateAIResponse(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 1500,
): Promise<string> {
  if (!anthropic) {
    throw new Error("ANTHROPIC_API_KEY not configured")
  }

  const response = await anthropic.messages.create({
    model: AI_MODEL,
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
