import type React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"

interface PopupMenuItem {
  label: string
  href: string
  icon: React.ReactNode
}

interface PopupMenuProps {
  items: PopupMenuItem[]
  isOpen: boolean
  onClose: () => void
  setActivePopup: React.Dispatch<React.SetStateAction<string | null>>
}

export function PopupMenu({ items, isOpen, onClose, setActivePopup }: PopupMenuProps) {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <motion.div
            key="popup"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-16 left-0 right-0 bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-md rounded-t-2xl p-4 z-50"
          >
            <div className="grid grid-cols-3 gap-4">
              {items.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  onClick={() => {
                    onClose()
                    setActivePopup(null)
                  }}
                >
                  <Button
                    variant="ghost"
                    className="w-full h-full flex flex-col items-center justify-center text-primary hover:text-primary-foreground hover:bg-primary/20 transition-colors"
                  >
                    {item.icon}
                    <span className="mt-2 text-xs">{item.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

