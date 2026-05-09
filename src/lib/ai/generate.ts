import { prisma } from "@/lib/db/prisma"
import { generateAIResponse } from "./client"
import { buildWordLearningPrompt } from "./prompts"

export interface WordContent {
  meaning: { cn: string; en: string }
  phonetic: string
  partOfSpeech: string
  examples: Array<{ en: string; cn: string }>
  rootAnalysis: {
    prefix: string | null
    root: string | null
    suffix: string | null
  }
  memoryTip: string
  synonyms: string[]
  collocations: string[]
}

/**
 * 获取单词的 AI 学习内容
 * 优先从数据库缓存读取，没有则调用 AI 生成并缓存
 */
export async function getWordContent(
  wordId: string,
  word: string,
  examType?: string | null,
): Promise<WordContent | null> {
  // 1. 先查缓存
  const existing = await prisma.word.findUnique({
    where: { id: wordId },
    select: { aiContent: true, phonetic: true },
  })

  if (existing?.aiContent) {
    try {
      return JSON.parse(existing.aiContent) as WordContent
    } catch {
      // 缓存数据损坏，重新生成
    }
  }

  // 2. 调用 AI 生成
  try {
    const prompt = buildWordLearningPrompt(word, examType)
    const response = await generateAIResponse(prompt, word)
    const content = parseAIResponse(response)

    // 3. 缓存到数据库
    await prisma.word.update({
      where: { id: wordId },
      data: {
        aiContent: JSON.stringify(content),
        phonetic: content.phonetic || existing?.phonetic,
      },
    })

    return content
  } catch (error) {
    console.error(`Failed to generate content for "${word}":`, error)
    return null
  }
}

/**
 * 解析 AI 返回的 JSON
 */
export function parseAIResponse(text: string): WordContent {
  // 尝试直接解析
  try {
    return JSON.parse(text) as WordContent
  } catch {
    // 尝试从 markdown 代码块中提取 JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as WordContent
    }
    throw new Error("Failed to parse AI response as JSON")
  }
}

/**
 * 批量预生成所有未缓存的单词内容
 */
export async function preGenerateWordContents(
  wordIds: string[],
  batchSize = 5,
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0

  for (let i = 0; i < wordIds.length; i += batchSize) {
    const batch = wordIds.slice(i, i + batchSize)

    const results = await Promise.allSettled(
      batch.map(async (wordId) => {
        const word = await prisma.word.findUnique({
          where: { id: wordId },
          select: { id: true, word: true, aiContent: true },
        })
        if (!word || word.aiContent) return // 已缓存，跳过
        await getWordContent(word.id, word.word)
      }),
    )

    results.forEach((r) => {
      if (r.status === "fulfilled") success++
      else failed++
    })

    // 批次间短暂延迟，避免 API 限流
    if (i + batchSize < wordIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  return { success, failed }
}
