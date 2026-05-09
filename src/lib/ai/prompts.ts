/**
 * AI Prompt 模板
 * 每个 prompt 返回结构化 JSON
 */

export function buildWordLearningPrompt(word: string, examType?: string | null): string {
  const examLabel = examType
    ? {
        cet4: "大学英语四级",
        cet6: "大学英语六级",
        postgrad: "考研英语",
        ielts: "雅思",
        toefl: "托福",
      }[examType] || "通用英语"
    : "通用英语"

  return `You are an expert English vocabulary tutor helping a Chinese student prepare for ${examLabel}.

Please generate a comprehensive learning card for the English word "${word}" in Chinese and English.

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "meaning": {
    "cn": "中文释义",
    "en": "English definition"
  },
  "phonetic": "音标（如 /əˈbændən/）",
  "partOfSpeech": "词性（如 v./n.）",
  "examples": [
    {
      "en": "English example sentence",
      "cn": "中文翻译"
    }
  ],
  "rootAnalysis": {
    "prefix": "前缀及含义（如无则为null）",
    "root": "词根及含义",
    "suffix": "后缀及含义（如无则为null）"
  },
  "memoryTip": "一条有趣、形象的中文记忆口诀，帮助学生记住这个单词",
  "synonyms": ["同义词1", "同义词2"],
  "collocations": ["常见搭配1", "常见搭配2"]
}

Requirements:
- meaning: Provide accurate Chinese and English definitions suitable for ${examLabel} level
- examples: Provide 3 diverse example sentences covering different contexts (daily/academic/business), each with Chinese translation
- rootAnalysis: If the word has no clear prefix/root/suffix, set those fields to null — do NOT fabricate them
- memoryTip: Make it vivid, humorous and MEMORABLE for Chinese speakers. Use associations, homophones (谐音), or funny imagery
- synonyms: 2-3 common synonyms at the ${examLabel} level
- collocations: 2-3 high-frequency phrases or collocations
- All Chinese text must be natural and idiomatic`
}

export function buildSentencePracticePrompt(
  word: string,
  userSentence: string,
  meaning: string,
): string {
  return `You are an English writing tutor. The student is practicing the word "${word}" (meaning: ${meaning}).

The student wrote: "${userSentence}"

Please evaluate the sentence and return ONLY a JSON object:
{
  "isCorrect": true/false,
  "score": 1-10,
  "corrections": [
    {
      "original": "original text (if error)",
      "corrected": "corrected version",
      "explanation": "中文解释错误原因"
    }
  ],
  "improvedVersion": "一个更地道的表达方式",
  "feedback": "总体中文评语和鼓励"
}

If there are no errors, corrections should be an empty array. improvedVersion should always provide a more natural alternative.`
}
