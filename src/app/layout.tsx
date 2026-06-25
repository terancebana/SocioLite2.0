import "@/app/globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "SocioLite — Chat with your people",
  description: "A modern real-time messaging platform for events and communities",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full overflow-hidden" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html:
          `try{var t=localStorage.getItem('theme');` +
          `if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))` +
          `document.documentElement.classList.add('dark');}catch(e){}` }} />
      </head>
      <body className={`${inter.variable} font-sans h-full overflow-hidden antialiased`}>
        {children}
      </body>
    </html>
  )
}
