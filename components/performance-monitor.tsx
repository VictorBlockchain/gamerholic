"use client"

import { useEffect, useState } from "react"

interface PerformanceMonitorProps {
  componentName: string
}

export function PerformanceMonitor({ componentName }: PerformanceMonitorProps) {
  const [renderCount, setRenderCount] = useState(0)

  useEffect(() => {
    setRenderCount((prev) => prev + 1)
    console.log(`${componentName} rendered ${renderCount + 1} times`)
  }, [componentName, renderCount])

  // Only use in development
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return <div className="hidden">{/* Hidden performance monitor */}</div>
}

