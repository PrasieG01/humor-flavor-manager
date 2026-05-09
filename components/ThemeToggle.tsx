'use client'
import { useTheme } from 'next-themes'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div className="flex gap-2 bg-gray-200 dark:bg-slate-800 p-1 rounded-full">
      <button onClick={() => setTheme('light')} className={`p-2 rounded-full ${theme === 'light' ? 'bg-white text-black shadow' : 'text-gray-500'}`}><Sun size={18} /></button>
      <button onClick={() => setTheme('system')} className={`p-2 rounded-full ${theme === 'system' ? 'bg-white dark:bg-slate-700 text-black dark:text-white shadow' : 'text-gray-500'}`}><Monitor size={18} /></button>
      <button onClick={() => setTheme('dark')} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-slate-700 text-white shadow' : 'text-gray-500'}`}><Moon size={18} /></button>
    </div>
  )
}