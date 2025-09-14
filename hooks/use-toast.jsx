"use client"

import { useState, useEffect } from "react"

let toasts = []
let listeners = []

function notify() {
  listeners.forEach((fn) => fn({ toasts: [...toasts] }))
}

export function useToast() {
  const [state, setState] = useState({ toasts })
  useEffect(() => {
    listeners.push(setState)
    return () => {
      listeners = listeners.filter((fn) => fn !== setState)
    }
  }, [])
  return {
    toasts: state.toasts,
    toast: (toast) => {
      const id = Date.now().toString()
      toasts = [{ id, ...toast }]
      notify()
      return { id }
    },
    dismiss: (id) => {
      toasts = toasts.filter((t) => t.id !== id)
      notify()
    },
  }
}