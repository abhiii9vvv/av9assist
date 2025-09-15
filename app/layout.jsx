import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { PageTransition } from "@/components/page-transition"
import { Suspense } from "react"
import { PageLoader } from "@/components/loading-spinner"
import { PerformanceMonitor } from "@/components/performance-monitor"
import "./globals.css"
import "highlight.js/styles/atom-one-dark.css"
import { Toaster } from "@/components/ui/toaster"

export const metadata = {
  title: "av9Assist - Your AI-powered Assistant",
  description: "Modern AI chat interface with sleek design and smooth animations",
  generator: "v0.app",
  keywords: ["AI", "assistant", "chat", "modern", "fast"],
  authors: [{ name: "av9Assist" }],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  metadataBase: new URL('https://av9assist.vercel.app'),
  openGraph: {
    title: "av9Assist - Your AI-powered Assistant",
    description: "Modern AI chat interface with sleek design and smooth animations",
    type: "website",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload critical resources */}
        <link
          rel="preload"
          href="/_next/static/css/app/layout.css"
          as="style"
        />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="dns-prefetch"
          href="https://vercel.com"
        />
        {/* Favicon preload */}
        <link rel="preload" href="/favicon.svg" as="image" type="image/svg+xml" />
        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'av9Assist',
              url: 'https://av9assist.vercel.app',
              logo: 'https://av9assist.vercel.app/favicon.svg',
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'av9Assist',
              url: 'https://av9assist.vercel.app',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://av9assist.vercel.app/?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased overflow-x-hidden`}>
        <Suspense fallback={<PageLoader />}>
          <ThemeProvider
            attribute="class"
            // Prefer a bright appearance by default
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange={false}
            storageKey="av9assist-theme"
          >
            <PageTransition>
              {children}
            </PageTransition>
          </ThemeProvider>
        </Suspense>
        {/* Global toast portal */}
        <Toaster />
        {/* Performance monitoring */}
        <PerformanceMonitor />
        <Analytics />
      </body>
    </html>
  )
}
