import * as React from 'react'
import { cn } from '@/lib/utils'

export function Switch({ checked = false, onCheckedChange, disabled = false, className, ...props }) {
  const handleClick = (e) => {
    e.preventDefault()
    if (disabled) return
    if (typeof onCheckedChange === 'function') onCheckedChange(!checked)
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      onClick={handleClick}
      className={cn(
        'relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        checked ? 'bg-primary' : 'bg-input/60',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform',
          checked ? 'translate-x-4' : 'translate-x-1',
        )}
      />
    </button>
  )}

export default Switch
