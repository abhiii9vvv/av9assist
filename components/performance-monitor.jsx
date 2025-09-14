'use client'

import { useEffect, useRef } from 'react'

export function PerformanceMonitor() {
  const reportedRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined' || reportedRef.current) return

    // Report Core Web Vitals
    const reportWebVitals = (metric) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${metric.name}:`, metric.value, metric.rating)
      }
      
      // Send to analytics (replace with your analytics service)
      if (typeof window.gtag !== 'undefined') {
        window.gtag('event', metric.name, {
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          event_category: 'Web Vitals',
          event_label: metric.id,
          non_interaction: true,
        })
      }
    }

    // Dynamic import of web-vitals to avoid increasing bundle size
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(reportWebVitals)
      getFID(reportWebVitals)
      getFCP(reportWebVitals)
      getLCP(reportWebVitals)
      getTTFB(reportWebVitals)
      reportedRef.current = true
    }).catch(err => {
      console.warn('Failed to load web-vitals:', err)
    })

    // Report resource timing
    const reportResourceTiming = () => {
      if (!window.performance || !window.performance.getEntriesByType) return

      const resources = window.performance.getEntriesByType('resource')
      const slowResources = resources.filter(resource => resource.duration > 1000)
      
      if (slowResources.length > 0 && process.env.NODE_ENV === 'development') {
        console.warn('[Performance] Slow resources detected:', slowResources)
      }
    }

    // Monitor memory usage (Chrome only)
    const reportMemoryUsage = () => {
      if ('memory' in window.performance) {
        const memory = window.performance.memory
        if (process.env.NODE_ENV === 'development') {
          console.log('[Performance] Memory usage:', {
            used: `${Math.round(memory.usedJSHeapSize / 1048576)} MB`,
            total: `${Math.round(memory.totalJSHeapSize / 1048576)} MB`,
            limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)} MB`
          })
        }
      }
    }

    // Report on page load
    setTimeout(() => {
      reportResourceTiming()
      reportMemoryUsage()
    }, 2000)

    // Monitor page visibility changes for performance impact
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        reportMemoryUsage()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return null // This component doesn't render anything
}

// Hook for monitoring component render performance
export function useRenderTime(componentName) {
  const startTime = useRef(performance.now())
  
  useEffect(() => {
    const endTime = performance.now()
    const renderTime = endTime - startTime.current
    
    if (process.env.NODE_ENV === 'development' && renderTime > 50) {
      console.warn(`[Performance] Slow render detected for ${componentName}: ${renderTime.toFixed(2)}ms`)
    }
  })
}