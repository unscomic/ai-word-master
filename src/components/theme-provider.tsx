"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type Theme = "light" | "dark" | "system"

interface ThemeContextValue {
  theme: Theme
  resolved: "light" | "dark"
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolved: "light",
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")
  const [resolved, setResolved] = useState<"light" | "dark">("light")

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null
    if (stored) {
      setThemeState(stored)
    }
  }, [])

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    function resolve() {
      if (theme === "system") {
        const isDark = media.matches
        setResolved(isDark ? "dark" : "light")
        document.documentElement.classList.toggle("dark", isDark)
      } else {
        setResolved(theme)
        document.documentElement.classList.toggle("dark", theme === "dark")
      }
    }
    resolve()
    media.addEventListener("change", resolve)
    return () => media.removeEventListener("change", resolve)
  }, [theme])

  function setTheme(t: Theme) {
    setThemeState(t)
    localStorage.setItem("theme", t)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
