import { describe, it, expect } from "vitest"
import { parseAIResponse } from "./generate"

describe("parseAIResponse", () => {
  it("应正确解析标准 JSON", () => {
    const json = JSON.stringify({
      meaning: { cn: "放弃", en: "to give up" },
      phonetic: "/əˈbændən/",
      partOfSpeech: "v.",
      examples: [{ en: "He abandoned the plan.", cn: "他放弃了计划。" }],
      rootAnalysis: { prefix: null, root: null, suffix: null },
      memoryTip: "a-band-on：一个乐队上台了——观众全部放弃了",
      synonyms: ["give up", "quit"],
      collocations: ["abandon hope", "abandon a project"],
    })
    const result = parseAIResponse(json)
    expect(result.meaning.cn).toBe("放弃")
    expect(result.phonetic).toBe("/əˈbændən/")
  })

  it("应从 markdown 代码块中提取 JSON", () => {
    const md = '```json\n{"meaning":{"cn":"测试","en":"test"},"phonetic":"/test/","partOfSpeech":"n.","examples":[{"en":"This is a test.","cn":"这是一个测试。"}],"rootAnalysis":{"prefix":null,"root":"test","suffix":null},"memoryTip":"测试记忆","synonyms":["exam"],"collocations":["take a test"]}\n```'
    const result = parseAIResponse(md)
    expect(result.meaning.cn).toBe("测试")
    expect(result.meaning.en).toBe("test")
  })

  it("应解析纯文本中的 JSON 对象", () => {
    const text = 'Here is the result: {"meaning":{"cn":"你好","en":"hello"},"phonetic":"/həˈloʊ/","partOfSpeech":"int.","examples":[{"en":"Hello world!","cn":"你好世界！"}],"rootAnalysis":{"prefix":null,"root":null,"suffix":null},"memoryTip":"哈喽~","synonyms":["hi"],"collocations":["say hello"]}'
    const result = parseAIResponse(text)
    expect(result.meaning.cn).toBe("你好")
  })

  it("无效 JSON 应抛出错误", () => {
    expect(() => parseAIResponse("not valid json")).toThrow()
  })

  it("完整字段解析", () => {
    const json = JSON.stringify({
      meaning: { cn: "丰富的", en: "plentiful" },
      phonetic: "/əˈbʌndənt/",
      partOfSpeech: "adj.",
      examples: [
        { en: "Food is abundant here.", cn: "这里食物很丰富。" },
        { en: "She has abundant energy.", cn: "她精力充沛。" },
      ],
      rootAnalysis: { prefix: null, root: "abund", suffix: "-ant" },
      memoryTip: "a-bun-dant：一个包子放在蛋上——太丰富了",
      synonyms: ["plentiful", "ample"],
      collocations: ["abundant resources", "abundant evidence"],
    })
    const result = parseAIResponse(json)
    expect(result.meaning.cn).toBe("丰富的")
    expect(result.meaning.en).toBe("plentiful")
    expect(result.partOfSpeech).toBe("adj.")
    expect(result.examples).toHaveLength(2)
    expect(result.synonyms).toContain("plentiful")
    expect(result.collocations).toHaveLength(2)
  })
})
