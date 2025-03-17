import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Quote } from "lucide-react"

interface TestimonialCardProps {
  quote: string
  author: {
    name: string
    title?: string
    avatar?: string
    avatarFallback: string
  }
  className?: string
}

export function TestimonialCard({ quote, author, className }: TestimonialCardProps) {
  return (
    <Card className={cn("bg-gradient-to-br from-[#111] to-black border-[#333] rounded-3xl overflow-hidden", className)}>
      <CardContent className="p-6 relative">
        <Quote className="absolute top-6 right-6 w-8 h-8 text-[#333] opacity-50" />

        <p className="text-gray-300 mb-6 relative z-10">"{quote}"</p>

        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-[#333]">
            {author.avatar && <AvatarImage src={author.avatar} alt={author.name} />}
            <AvatarFallback className="bg-[#222]">{author.avatarFallback}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{author.name}</p>
            {author.title && <p className="text-sm text-gray-400">{author.title}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

