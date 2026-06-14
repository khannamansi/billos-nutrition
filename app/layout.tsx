import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Footer from '../components/Footer'
import ErrorBoundary from '../components/ErrorBoundary'
import { UserProvider } from '../lib/UserContext'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Billo's Nutrition",
  description: 'AI-powered meal planning and nutrition tracking',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ scrollBehavior: 'smooth' }}>
      <body className="min-h-screen flex flex-col"
        style={{ background: 'linear-gradient(135deg, #0f4c5c 0%, #0a3340 100%)' }}>
        <UserProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </UserProvider>
        <Footer />
      </body>
    </html>
  )
}
