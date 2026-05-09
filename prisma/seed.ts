import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"

const adapter = new PrismaLibSql({ url: "file:./dev.db" })
const prisma = new PrismaClient({ adapter })

// 四级核心词汇（100个代表性词汇）
const CET4_WORDS = [
  "abandon", "ability", "abroad", "absence", "absolute", "absorb", "abstract",
  "abundant", "academic", "accelerate", "accept", "access", "accompany",
  "accomplish", "account", "accumulate", "accurate", "achieve", "acknowledge",
  "acquire", "adapt", "adequate", "adjust", "administration", "admire",
  "adopt", "advance", "advantage", "advertise", "affair", "affect",
  "afford", "aggressive", "agreement", "agriculture", "alcohol", "alternative",
  "amaze", "ambition", "amount", "analyze", "ancestor", "anniversary",
  "announce", "annual", "anxiety", "apparent", "appeal", "appetite",
  "appliance", "application", "appoint", "appreciate", "approach", "appropriate",
  "approve", "arise", "arrange", "artificial", "aspect", "assemble",
  "assess", "assign", "assist", "associate", "assume", "atmosphere",
  "attach", "attain", "attempt", "attend", "attitude", "attract",
  "authority", "automatic", "available", "avenue", "average", "avoid",
  "balance", "bankrupt", "bargain", "barrier", "battery", "behalf",
  "behave", "beneath", "benefit", "billion", "biology", "blanket",
  "border", "bother", "boundary", "budget", "burden", "campus",
  "cancel", "capable", "capacity", "capture"
]

// 考研核心词汇（100个代表性词汇）
const POSTGRAD_WORDS = [
  "abide", "abolish", "absurd", "accommodate", "accordance", "accountable",
  "acquaint", "activate", "adhere", "adjacent", "administer", "adolescent",
  "advent", "adverse", "advocate", "aesthetic", "affiliate", "affirm",
  "aggravate", "aggregate", "agony", "alienate", "allege", "alleviate",
  "allocate", "alloy", "alteration", "ambiguous", "amend", "ample",
  "analogy", "anonymous", "apparatus", "appraisal", "apt", "arbitrary",
  "articulate", "ascertain", "aspire", "assault", "assert", "asset",
  "assimilate", "attribute", "audit", "authentic", "autonomy", "avail",
  "avert", "barren", "beforehand", "bewilder", "bias", "bibliography",
  "bizarre", "blaze", "blossom", "blunder", "blunt", "boast",
  "boom", "boycott", "breach", "breakdown", "breed", "brilliant",
  "brisk", "brittle", "bruise", "bubble", "bulk", "bureaucracy",
  "calorie", "candidate", "canteen", "caption", "cardinal", "catastrophe",
  "category", "cater", "caution", "census", "certify", "chronic",
  "circulate", "cite", "civilization", "clarity", "clash", "classic",
  "clause", "climax", "cling", "cognitive", "coherent", "coincide",
  "collaborate", "collapse", "collide", "commemorate"
]

async function main() {
  console.log("开始导入词库...")

  // 清理旧数据
  await prisma.wordbookWord.deleteMany()
  await prisma.wordProgress.deleteMany()
  await prisma.studyLog.deleteMany()
  await prisma.wordbook.deleteMany()
  await prisma.word.deleteMany()

  // 创建四级词库
  const cet4Book = await prisma.wordbook.create({
    data: {
      name: "大学英语四级",
      description: "CET-4 核心词汇，适合四级备考",
      isPreset: true,
    },
  })
  console.log(`创建词库：${cet4Book.name}`)

  for (const w of CET4_WORDS) {
    const word = await prisma.word.upsert({
      where: { word: w },
      update: {},
      create: { word: w },
    })
    await prisma.wordbookWord.create({
      data: {
        wordbookId: cet4Book.id,
        wordId: word.id,
      },
    })
  }
  console.log(`  └ 导入 ${CET4_WORDS.length} 个单词`)

  // 创建考研词库
  const postgradBook = await prisma.wordbook.create({
    data: {
      name: "考研英语",
      description: "考研英语核心词汇，适合考研备考",
      isPreset: true,
    },
  })
  console.log(`创建词库：${postgradBook.name}`)

  for (const w of POSTGRAD_WORDS) {
    const word = await prisma.word.upsert({
      where: { word: w },
      update: {},
      create: { word: w },
    })
    await prisma.wordbookWord.create({
      data: {
        wordbookId: postgradBook.id,
        wordId: word.id,
      },
    })
  }
  console.log(`  └ 导入 ${POSTGRAD_WORDS.length} 个单词`)

  // 重叠的单词（四级和考研都有）已通过 upsert 处理
  console.log("\n词库导入完成！")
  console.log(`  - ${cet4Book.name}: ${CET4_WORDS.length} 词`)
  console.log(`  - ${postgradBook.name}: ${POSTGRAD_WORDS.length} 词`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
