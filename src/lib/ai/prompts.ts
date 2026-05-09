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

export interface ScenarioConfig {
  key: string
  title: string
  icon: string
  role: string
  context: string
  opening: string
}

export const SCENARIOS: ScenarioConfig[] = [
  {
    key: "restaurant",
    title: "餐厅点餐",
    icon: "🍽️",
    role: "waiter/waitress",
    context: "You are a waiter/waitress at a nice restaurant. The customer (student) wants to order food, ask about menu items, and pay the bill.",
    opening: "Good evening! Welcome to our restaurant. Here's your menu. Are you ready to order, or would you like a few more minutes?",
  },
  {
    key: "interview",
    title: "求职面试",
    icon: "💼",
    role: "job interviewer",
    context: "You are interviewing the student for a marketing position at an international company. Ask typical interview questions: self-introduction, strengths/weaknesses, experience, career goals.",
    opening: "Hello, thanks for coming in today. Please, have a seat. To start off, could you tell me a little bit about yourself and why you're interested in this position?",
  },
  {
    key: "hotel",
    title: "酒店入住",
    icon: "🏨",
    role: "hotel front desk receptionist",
    context: "You are a receptionist at a hotel. The student wants to check in, ask about room amenities, wifi, breakfast times, and check-out procedures.",
    opening: "Good afternoon, welcome to Grand Hotel. Do you have a reservation with us today?",
  },
  {
    key: "travel",
    title: "机场出行",
    icon: "✈️",
    role: "airline/travel staff",
    context: "You are an airline staff member at the check-in counter. The student needs to check in luggage, ask about boarding gate, flight delays, and connection information.",
    opening: "Hello! May I see your passport and booking reference, please? Are you checking any bags today?",
  },
  {
    key: "shopping",
    title: "商场购物",
    icon: "🛍️",
    role: "shop assistant",
    context: "You are a helpful shop assistant at a clothing store. The student wants to find clothes in their size, ask about colors/styles, try items on, and ask about prices and returns.",
    opening: "Hi there! Welcome to our store. Is there anything specific you're looking for today, or would you like me to show you our new arrivals?",
  },
  {
    key: "doctor",
    title: "看医生",
    icon: "🏥",
    role: "doctor",
    context: "You are a doctor at a clinic. The student is a patient describing symptoms. Ask about their condition, duration, medical history, and give advice.",
    opening: "Good morning. What seems to be the problem today? How can I help you?",
  },
  {
    key: "social",
    title: "社交交友",
    icon: "🎉",
    role: "friendly stranger at a party",
    context: "You are at a social gathering and just met the student. Make casual small talk: hobbies, work, travel, food, movies. Keep it friendly and natural.",
    opening: "Hey! Great party, isn't it? I'm Alex, by the way. I don't think we've met before. How do you know the host?",
  },
  {
    key: "business",
    title: "商务会议",
    icon: "📊",
    role: "business colleague/client",
    context: "You are a potential client in a business meeting. The student is pitching a product or service. Discuss project details, timelines, budget, and cooperation.",
    opening: "Thanks for meeting with us today. I've reviewed your proposal briefly, but I'd love to hear more about what your team can offer. Please, go ahead.",
  },
]

export function buildScenarioSystemPrompt(scenario: ScenarioConfig): string {
  return `You are role-playing as a ${scenario.role}.

Scenario context: ${scenario.context}

CRITICAL RULES:
1. STAY IN CHARACTER — always respond as the ${scenario.role}
2. Keep responses short and natural (1-3 sentences, spoken language)
3. After each of YOUR replies, add a small CORRECTION section for the student's English (if needed)
4. Never break character to explain grammar — the correction section handles that
5. Keep the conversation flowing naturally — ask questions, respond to the student's words

Response format (strictly JSON):
{
  "reply": "Your in-character spoken response (natural, conversational)",
  "correction": null,
  "tip": null
}

If the student made a grammar or word choice error:
{
  "reply": "Your in-character spoken response",
  "correction": {
    "original": "what the student wrote that needs fixing",
    "corrected": "the corrected version",
    "explanation": "简短中文解释"
  },
  "tip": "Optional helpful expression related to the scenario (null if not applicable)"
}

IMPORTANT:
- reply should sound like REAL spoken English, not textbook dialogue
- Only provide correction when there's a genuine error — don't nitpick minor style differences
- correction should be helpful but not interrupt the conversation flow
- tip can be a useful phrase or cultural note related to the situation`
}

export function buildScenarioEndPrompt(messages: Array<{ role: string; content: string }>): string {
  const history = messages.map((m) => `${m.role}: ${m.content}`).join("\n")
  return `The scenario practice session has ended. Here is the conversation history:

${history}

Please review the student's performance and return ONLY a JSON object:
{
  "summary": "中文总体评价（3-5句话，包括优点和改进建议）",
  "score": 1-10,
  "highlights": ["做得好的一点", "做得好的一点"],
  "improvements": ["需要改进的一点", "需要改进的一点"],
  "keyPhrases": ["实用短语1", "实用短语2", "实用短语3"]
}

Be encouraging and constructive. Focus on communication effectiveness, not just grammar.`
}
