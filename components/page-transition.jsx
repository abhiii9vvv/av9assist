"use client"

import { motion } from "framer-motion"
import { usePathname } from "next/navigation"

export function PageTransition({ children }) {
  const pathname = usePathname()
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
      className="w-full"
    >
      {children}
    </motion.div>
  )
}

// Staggered container for animating child elements
export function StaggerContainer({ children, className = "", delay = 0.1 }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: delay,
        delayChildren: 0.1,
      },
    },
  }

  return (
    <motion.div className={className} variants={containerVariants} initial="hidden" animate="visible">
      {children}
    </motion.div>
  )
}

// Individual stagger item
export function StaggerItem({ children, className = "" }) {
  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  }

  return (
    <motion.div
      className={className}
      variants={itemVariants}
    >
      {children}
    </motion.div>
  )
}

// Smooth fade transition
export function FadeTransition({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ 
        duration: 0.3, 
        delay,
        ease: "easeInOut" 
      }}
    >
      {children}
    </motion.div>
  )
}

// Scale transition for buttons and interactive elements
export function ScaleTransition({ children, className = "", whileHover = true, whileTap = true }) {
  const hoverProps = whileHover ? { whileHover: { scale: 1.02 } } : {}
  const tapProps = whileTap ? { whileTap: { scale: 0.98 } } : {}

  return (
    <motion.div
      className={className}
      {...hoverProps}
      {...tapProps}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.div>
  )
}