"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Send, Users, Smile, Paperclip } from "lucide-react"
import { ButtonPressEffect } from "@/components/ui/micro-interactions"
import { cn } from "@/lib/utils"

interface ChatUser {
  name: string
  avatar?: string
}

interface ChatMessage {
  id: string
  user: ChatUser
  text: string
  timestamp: string
}

interface MobileChatRoomProps {
  channelName: string
  messages: ChatMessage[]
  className?: string
  onSendMessage?: (message: string) => void
}

export function MobileChatRoom({ channelName, messages, className, onSendMessage }: MobileChatRoomProps) {
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleSendMessage = () => {
    if (newMessage.trim() && onSendMessage) {
      onSendMessage(newMessage)
      setNewMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <Card className={cn("bg-gradient-to-br from-[#111] to-black border-[#333] rounded-xl overflow-hidden", className)}>
      <CardHeader className="p-3 border-b border-[#222] flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{channelName}</CardTitle>
          <Badge className="bg-[#00FFA9] text-black text-xs">LIVE</Badge>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
          <Users className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <div className="h-64 overflow-y-auto p-3 space-y-3">
          {messages.map((message) => (
            <div key={message.id} className="flex gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={message.user.avatar || "/placeholder.svg"} alt={message.user.name} />
                <AvatarFallback className="bg-[#222] text-xs">{message.user.name.charAt(0)}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{message.user.name}</span>
                  <span className="text-xs text-gray-400">{message.timestamp}</span>
                </div>
                <p className="text-sm text-gray-200">{message.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t border-[#222] flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
            <Paperclip className="h-4 w-4" />
          </Button>

          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-black/50 border-[#333] focus:border-[#00FFA9] rounded-full text-sm h-9"
          />

          <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
            <Smile className="h-4 w-4" />
          </Button>

          <ButtonPressEffect>
            <Button
              size="sm"
              className="h-8 w-8 rounded-full p-0 bg-[#00FFA9] hover:bg-[#00D48F] text-black"
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </ButtonPressEffect>
        </div>
      </CardContent>
    </Card>
  )
}

