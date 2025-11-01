import React, { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown } from 'lucide-react'

interface StyledExplainerProps {
  title: string
  description: string
  icon: React.ReactNode
  bullets: string[]
  trigger: React.ReactElement
}

const StyledExplainer: React.FC<StyledExplainerProps> = ({
  title,
  description,
  icon,
  bullets,
  trigger,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Close the tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={tooltipRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div className="animate-fade-in absolute bottom-full left-1/2 z-50 mb-2 w-80 -translate-x-1/2 transform">
          {/* Tooltip Arrow */}
          <div className="absolute top-full left-1/2 -mt-2 -translate-x-1/2">
            <div className="h-0 w-0 border-t-[8px] border-r-[8px] border-l-[8px] border-t-slate-800 border-r-transparent border-l-transparent"></div>
          </div>

          {/* Tooltip Content */}
          <div className="overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-900/95 via-purple-900/20 to-slate-900/95 p-6 shadow-2xl backdrop-blur-md">
            {/* Header */}
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25">
                {icon}
              </div>
              <h3 className="text-lg font-bold text-white">{title}</h3>
            </div>

            {/* Description */}
            <p className="mb-4 text-sm text-gray-300">{description}</p>

            {/* Bullets */}
            <ul className="space-y-2">
              {bullets.map((bullet, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm text-gray-200">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

// Add this to your global CSS file for the animation
// <style jsx>{`
//   @keyframes fade-in {
//     from {
//       opacity: 0;
//       transform: translate(-50%, -10px);
//     }
//     to {
//       opacity: 1;
//       transform: translate(-50%, 0);
//     }
//   }
//   .animate-fade-in {
//     animation: fade-in 0.2s ease-out;
//   }
// `}</style>

export default StyledExplainer
