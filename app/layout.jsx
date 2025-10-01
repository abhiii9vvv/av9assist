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
  title: {
    default: "av9Assist - AI-Powered Chat Assistant | Free AI Chatbot",
    template: "%s | av9Assist"
  },
  description: "Experience the future of AI conversation with av9Assist. Free, secure, and privacy-focused AI chat assistant. All data stored locally. No registration required. Powered by advanced AI technology.",
  generator: "Next.js",
  applicationName: "av9Assist",
  keywords: [
    "AI chat",
    "AI assistant",
    "chatbot",
    "artificial intelligence",
    "free AI",
    "chat interface",
    "AI conversation",
    "local storage",
    "privacy-focused AI",
    "secure chat",
    "AI technology",
    "virtual assistant",
    "conversational AI",
    "smart assistant",
    "AI chatbot free"
  ],
  authors: [{ name: "av9Assist Team", url: "https://av9assist.vercel.app" }],
  creator: "av9Assist",
  publisher: "av9Assist",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    shortcut: "/favicon.svg",
    apple: [
      { url: "/favicon.svg", sizes: "180x180", type: "image/svg+xml" }
    ],
  },
  manifest: "/manifest.json",
  metadataBase: new URL('https://av9assist.vercel.app'),
  alternates: {
    canonical: "https://av9assist.vercel.app",
  },
  openGraph: {
    title: "av9Assist - AI-Powered Chat Assistant | Free AI Chatbot",
    description: "Experience the future of AI conversation with av9Assist. Free, secure, and privacy-focused AI chat assistant. All data stored locally.",
    url: "https://av9assist.vercel.app",
    siteName: "av9Assist",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/placeholder-logo.svg",
        width: 1200,
        height: 630,
        alt: "av9Assist AI Chat Assistant"
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "av9Assist - AI-Powered Chat Assistant",
    description: "Free, secure, and privacy-focused AI chat assistant. All data stored locally.",
    images: ["/placeholder-logo.svg"],
    creator: "@av9assist",
  },
  category: "Technology",
  classification: "AI & Machine Learning",
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
        {process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? (
          <meta
            name="google-site-verification"
            content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION}
          />
        ) : null}
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased overflow-x-hidden`}>
        <Suspense fallback={<PageLoader />}>
          <ThemeProvider>
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
