'use client'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // This ensures the component waits for the browser to load before checking the theme
  // (Prevents annoying flashing errors in Next.js)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a blank box of the same size while loading so the UI doesn't jump
    return <div className="w-8 h-8 p-2"></div>
  }

  // resolvedTheme checks if the system is dark, even if the user hasn't clicked anything yet
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="p-2 border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}