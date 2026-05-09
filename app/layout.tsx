import { ThemeProvider } from 'next-themes'
import './globals.css'
import ThemeToggle from '@/components/ThemeToggle'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-gray-100 transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="flex justify-between items-center p-6 border-b dark:border-slate-800 backdrop-blur-md bg-white/50 dark:bg-slate-900/50 sticky top-0 z-50">
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
              HumorChain Admin
            </h1>
            <ThemeToggle />
          </header>
          <main className="p-6 max-w-5xl mx-auto">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
