"use client"

import { Button } from "@/components/ui/button"
import { Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

const icons = {
  light: <Sun className="size-4" />,
  dark: <Moon className="size-4" />,
  system: <Monitor className="size-4" />,
}

const labels = {
  light: "浅色",
  dark: "深色",
  system: "系统",
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  function cycle() {
    const order: Array<"light" | "dark" | "system"> = ["light", "dark", "system"]
    const idx = order.indexOf(theme)
    setTheme(order[(idx + 1) % order.length])
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={cycle}
      title={`当前：${labels[theme]}模式`}
    >
      {icons[theme]}
    </Button>
  )
}
