import { describe, it, expect } from "vitest"
import { buildWordLearningPrompt, buildSentencePracticePrompt } from "./prompts"

describe("buildWordLearningPrompt", () => {
  it("应包含单词和考试类型信息", () => {
    const prompt = buildWordLearningPrompt("abandon", "cet4")
    expect(prompt).toContain("abandon")
    expect(prompt).toContain("大学英语四级")
  })

  it("考试类型为空时应使用通用英语", () => {
    const prompt = buildWordLearningPrompt("hello", null)
    expect(prompt).toContain("通用英语")
  })

  it("应包含 JSON 结构要求", () => {
    const prompt = buildWordLearningPrompt("test", "postgrad")
    expect(prompt).toContain("JSON")
    expect(prompt).toContain("meaning")
    expect(prompt).toContain("examples")
    expect(prompt).toContain("memoryTip")
    expect(prompt).toContain("rootAnalysis")
  })

  it("不同考试类型应生成不同标签", () => {
    const cet4 = buildWordLearningPrompt("test", "cet4")
    const ielts = buildWordLearningPrompt("test", "ielts")
    expect(cet4).toContain("大学英语四级")
    expect(ielts).toContain("雅思")
    expect(cet4).not.toEqual(ielts)
  })

  it("应在各考试类型中包含对应标签", () => {
    const labels: Record<string, string> = {
      cet4: "四级",
      cet6: "六级",
      postgrad: "考研",
      ielts: "雅思",
      toefl: "托福",
    }
    for (const [type, label] of Object.entries(labels)) {
      const prompt = buildWordLearningPrompt("word", type)
      expect(prompt).toContain(label)
    }
  })
})

describe("buildSentencePracticePrompt", () => {
  it("应包含单词、用户句子和释义", () => {
    const prompt = buildSentencePracticePrompt(
      "abandon",
      "I abandon my plan.",
      "放弃",
    )
    expect(prompt).toContain("abandon")
    expect(prompt).toContain("I abandon my plan.")
    expect(prompt).toContain("放弃")
  })

  it("应包含 JSON 返回格式要求", () => {
    const prompt = buildSentencePracticePrompt("test", "sentence", "释义")
    expect(prompt).toContain("JSON")
    expect(prompt).toContain("isCorrect")
    expect(prompt).toContain("corrections")
    expect(prompt).toContain("feedback")
  })
})
