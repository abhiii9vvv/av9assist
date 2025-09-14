import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { PageLoader, ComponentLoader } from './loading-spinner'

// Dynamic imports for heavy components
export const DynamicChatMessage = dynamic(
  () => import('./chat-message').then(mod => ({ default: mod.ChatMessage })),
  {
    loading: () => <ComponentLoader />,
    ssr: false
  }
)

export const DynamicTypingIndicator = dynamic(
  () => import('./typing-indicator').then(mod => ({ default: mod.TypingIndicator })),
  {
    loading: () => <div className="h-4 w-16 bg-muted animate-pulse rounded" />,
    ssr: false
  }
)

// Theme components with dynamic loading
export const DynamicThemeToggle = dynamic(
  () => import('./theme-toggle').then(mod => ({ default: mod.ThemeToggle })),
  {
    loading: () => <div className="w-9 h-9 bg-muted animate-pulse rounded-md" />,
    ssr: false
  }
)

// UI components that can be loaded dynamically
export const DynamicDialog = dynamic(
  () => import('./ui/dialog').then(mod => ({ default: mod.Dialog })),
  { ssr: false }
)

export const DynamicSheet = dynamic(
  () => import('./ui/sheet').then(mod => ({ default: mod.Sheet })),
  { ssr: false }
)

export const DynamicCommand = dynamic(
  () => import('./ui/command').then(mod => ({ default: mod.Command })),
  { ssr: false }
)

// Chart components (heavy libraries)
export const DynamicChart = dynamic(
  () => import('./ui/chart'),
  {
    loading: () => <div className="h-64 w-full bg-muted animate-pulse rounded-lg" />,
    ssr: false
  }
)

// Calendar component (date-fns is heavy)
export const DynamicCalendar = dynamic(
  () => import('./ui/calendar'),
  {
    loading: () => <div className="h-64 w-full bg-muted animate-pulse rounded-lg" />,
    ssr: false
  }
)

// Wrapper for any component that should be dynamically loaded
export function LazyComponent({ children, fallback = <ComponentLoader /> }) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  )
}

// Higher-order component for dynamic loading
export function withDynamicLoading(Component, loadingComponent = ComponentLoader) {
  return dynamic(() => Promise.resolve(Component), {
    loading: loadingComponent,
    ssr: false
  })
}