"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Type, ZoomIn, ZoomOut } from "lucide-react"

interface AccessibilityMenuProps {
  className?: string
}

export function AccessibilityMenu({ className }: AccessibilityMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [fontSize, setFontSize] = useState(100)
  const [highContrast, setHighContrast] = useState(false)

  // Apply font size changes
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}%`
  }, [fontSize])

  // Apply high contrast mode
  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add("high-contrast")
    } else {
      document.documentElement.classList.remove("high-contrast")
    }
  }, [highContrast])

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      <div
        className={cn(
          "bg-black/80 backdrop-blur-md border border-[#333] rounded-lg p-4 transition-all",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none",
        )}
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Font Size</p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 rounded-full"
                onClick={() => setFontSize(Math.max(80, fontSize - 10))}
                aria-label="Decrease font size"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <div className="flex-1 text-center text-sm">{fontSize}%</div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 rounded-full"
                onClick={() => setFontSize(Math.min(150, fontSize + 10))}
                aria-label="Increase font size"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">High Contrast</p>
            <Button
              size="sm"
              variant={highContrast ? "default" : "outline"}
              className={cn("w-full", highContrast ? "bg-[#00FFA9] text-black" : "text-white")}
              onClick={() => setHighContrast(!highContrast)}
            >
              {highContrast ? "Enabled" : "Disabled"}
            </Button>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => {
              setFontSize(100)
              setHighContrast(false)
            }}
          >
            Reset All
          </Button>
        </div>
      </div>

      <Button
        className="h-12 w-12 rounded-full bg-[#00FFA9] text-black hover:bg-[#00D48F] shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Accessibility options"
      >
        <Type className="h-6 w-6" />
      </Button>
    </div>
  )
}

