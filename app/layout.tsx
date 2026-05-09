import type { Metadata } from "next"
import "./globals.css"

// IMPORTANT: Import the wrapper you just created, not 'next-themes' directly
import { ThemeProvider } from "@/components/ThemeProvider"

export const metadata: Metadata = {
  title: "Chain Builder",
  description: "Prompt Chain Management",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // suppressHydrationWarning is required here for next-themes!
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased selection:bg-blue-500 selection:text-white">
        
        {/* Use your new Client Component Provider here */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>

      </body>
    </html>
  )
}