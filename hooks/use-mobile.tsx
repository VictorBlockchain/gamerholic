"use client"

import { useState, useEffect, useCallback } from "react"

export function useMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)

  // Use useCallback to memoize the function
  const checkMobile = useCallback(() => {
    setIsMobile(window.innerWidth < breakpoint)
  }, [breakpoint])

  useEffect(() => {
    // Check if window is defined (to avoid SSR issues)
    if (typeof window === "undefined") return

    // Initial check
    checkMobile()

    // Debounce resize event to prevent excessive calls
    let timeoutId: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(checkMobile, 200)
    }

    // Add resize listener
    window.addEventListener("resize", handleResize)

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(timeoutId)
    }
  }, [checkMobile])

  return isMobile
}

