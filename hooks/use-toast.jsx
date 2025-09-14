"use client"

import * as React from "react"

// Toast store compatible with Radix Toast and Toaster component
const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 4000

// In-memory state and subscribers
let memoryState = { toasts: [] }
const listeners = []

let idCounter = 0
const genId = () => String(++idCounter)

const timeouts = new Map()
function addToRemoveQueue(toastId) {
  if (timeouts.has(toastId)) return
  const timeout = setTimeout(() => {
    timeouts.delete(toastId)
    dispatch({ type: "REMOVE_TOAST", toastId })
  }, TOAST_REMOVE_DELAY)
  timeouts.set(toastId, timeout)
}

function reducer(state, action) {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t,
        ),
      }
    case "DISMISS_TOAST": {
      const { toastId } = action
      if (toastId) addToRemoveQueue(toastId)
      else state.toasts.forEach((t) => addToRemoveQueue(t.id))
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          toastId ? (t.id === toastId ? { ...t, open: false } : t) : { ...t, open: false },
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) return { ...state, toasts: [] }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
    default:
      return state
  }
}

function dispatch(action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((l) => l(memoryState))
}

export function toast(props) {
  const id = genId()
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })
  const update = (p) => dispatch({ type: "UPDATE_TOAST", toast: { ...p, id } })
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })
  return { id, dismiss, update }
}

export function useToast() {
  const [state, setState] = React.useState(memoryState)
  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const i = listeners.indexOf(setState)
      if (i > -1) listeners.splice(i, 1)
    }
  }, [])
  return {
    ...state,
    toast,
    dismiss: (toastId) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export default toast