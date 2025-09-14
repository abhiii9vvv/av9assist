'use client'

import { motion } from 'framer-motion'

export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex gap-3"
        >
          <div className="w-8 h-8 bg-muted animate-pulse rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export function MessageSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex gap-3 p-4"
    >
      <div className="w-8 h-8 bg-muted animate-pulse rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
        <div className="space-y-1">
          <div className="h-3 bg-muted animate-pulse rounded w-full" />
          <div className="h-3 bg-muted animate-pulse rounded w-4/5" />
          <div className="h-3 bg-muted animate-pulse rounded w-3/5" />
        </div>
      </div>
    </motion.div>
  )
}

export function HeaderSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-4 border-b"
    >
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 bg-muted animate-pulse rounded" />
        <div className="h-5 bg-muted animate-pulse rounded w-32" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-muted animate-pulse rounded-md" />
        <div className="w-8 h-8 bg-muted animate-pulse rounded-md" />
      </div>
    </motion.div>
  )
}

export function InputSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 border-t"
    >
      <div className="flex gap-2 items-end">
        <div className="flex-1 h-10 bg-muted animate-pulse rounded-lg" />
        <div className="w-10 h-10 bg-muted animate-pulse rounded-lg" />
      </div>
    </motion.div>
  )
}

export function ButtonSkeleton({ className = "w-20 h-9" }) {
  return (
    <div className={`bg-muted animate-pulse rounded-md ${className}`} />
  )
}

export function CardSkeleton({ className = "h-32" }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-muted animate-pulse rounded-lg ${className}`}
    />
  )
}

export function ListSkeleton({ items = 5 }) {
  return (
    <div className="space-y-2">
      {[...Array(items)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-3 p-2"
        >
          <div className="w-4 h-4 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded flex-1" />
        </motion.div>
      ))}
    </div>
  )
}