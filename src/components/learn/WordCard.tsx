"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Volume2, ChevronDown, ChevronUp } from "lucide-react"
import type { WordContent } from "@/lib/ai/generate"

interface WordCardProps {
  word: string
  phonetic?: string | null
  content?: WordContent | null
  loading?: boolean
}

export function WordCard({ word, phonetic, content, loading }: WordCardProps) {
  const [expanded, setExpanded] = useState({
    meaning: true,
    examples: true,
    root: false,
    memory: false,
    extra: false,
  })

  function toggle(section: keyof typeof expanded) {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  function speak(text: string) {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "en-US"
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6 space-y-4">
        {/* 单词 + 发音 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{word}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg text-muted-foreground font-mono">
                {content?.phonetic || phonetic || ""}
              </span>
              {content?.partOfSpeech && (
                <Badge variant="secondary">{content.partOfSpeech}</Badge>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="size-12 rounded-full"
            onClick={() => speak(word)}
          >
            <Volume2 className="size-5" />
          </Button>
        </div>

        <Separator />

        {/* 释义 */}
        {content?.meaning && (
          <Section
            title="释义"
            expanded={expanded.meaning}
            onToggle={() => toggle("meaning")}
          >
            <p className="text-base text-foreground/90">{content.meaning.cn}</p>
            <p className="text-sm text-muted-foreground italic">
              {content.meaning.en}
            </p>
          </Section>
        )}

        {/* 例句 */}
        {content?.examples && content.examples.length > 0 && (
          <Section
            title={`例句 (${content.examples.length})`}
            expanded={expanded.examples}
            onToggle={() => toggle("examples")}
          >
            <ul className="space-y-3">
              {content.examples.map((ex, i) => (
                <li key={i} className="space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="text-base">{ex.en}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0 mt-0.5"
                      onClick={() => speak(ex.en)}
                    >
                      <Volume2 className="size-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{ex.cn}</p>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* 词根词缀 */}
        {content?.rootAnalysis && Object.values(content.rootAnalysis).some(Boolean) && (
          <Section
            title="词根拆解"
            expanded={expanded.root}
            onToggle={() => toggle("root")}
          >
            <div className="flex flex-wrap gap-3">
              {content.rootAnalysis.prefix && (
                <Badge variant="outline" className="text-sm px-3 py-1">
                  前缀: {content.rootAnalysis.prefix}
                </Badge>
              )}
              {content.rootAnalysis.root && (
                <Badge variant="outline" className="text-sm px-3 py-1">
                  词根: {content.rootAnalysis.root}
                </Badge>
              )}
              {content.rootAnalysis.suffix && (
                <Badge variant="outline" className="text-sm px-3 py-1">
                  后缀: {content.rootAnalysis.suffix}
                </Badge>
              )}
            </div>
          </Section>
        )}

        {/* 记忆口诀 */}
        {content?.memoryTip && (
          <Section
            title="记忆口诀"
            expanded={expanded.memory}
            onToggle={() => toggle("memory")}
          >
            <p className="text-base leading-relaxed">{content.memoryTip}</p>
          </Section>
        )}

        {/* 同义词 + 搭配 */}
        {(content?.synonyms?.length || content?.collocations?.length) && (
          <Section
            title="更多信息"
            expanded={expanded.extra}
            onToggle={() => toggle("extra")}
          >
            {content.synonyms && content.synonyms.length > 0 && (
              <div className="mb-2">
                <span className="text-sm font-medium">同义词：</span>
                {content.synonyms.map((s, i) => (
                  <Badge key={i} variant="secondary" className="mr-1 mb-1">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
            {content.collocations && content.collocations.length > 0 && (
              <div>
                <span className="text-sm font-medium">常见搭配：</span>
                {content.collocations.map((c, i) => (
                  <Badge key={i} variant="outline" className="mr-1 mb-1">
                    {c}
                  </Badge>
                ))}
              </div>
            )}
          </Section>
        )}
      </CardContent>
    </Card>
  )
}

function Section({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        {expanded ? (
          <ChevronUp className="size-4" />
        ) : (
          <ChevronDown className="size-4" />
        )}
        {title}
      </button>
      {expanded && <div>{children}</div>}
    </div>
  )
}
