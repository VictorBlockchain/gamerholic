'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { sanitizeChatMessage, safeDisplayText } from '@/lib/chat-safety'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { GamingButton } from '@/components/ui/gaming-button'
import { Send } from 'lucide-react'

type FilterColumn = 'chat_address' | 'challenge_address' | 'tournament_address'

export interface ChatBoxProps {
  address: string
  filterColumn?: FilterColumn
  isConnected?: boolean
  viewerAddress?: string
  heightClass?: string
  className?: string
}

export function ChatBox({
  address,
  filterColumn = 'chat_address',
  isConnected = false,
  viewerAddress,
  heightClass = 'h-96',
  className = '',
}: ChatBoxProps) {
  const [messages, setMessages] = useState<
    Array<{ id: number; sender_wallet: string; message: string; created_at: string }>
  >([])
  const [chatUsers, setChatUsers] = useState<
    Record<string, { username: string; avatar_url?: string }>
  >({})
  const [chatInput, setChatInput] = useState('')
  const [isSendingChat, setIsSendingChat] = useState(false)

  const addrParam = useMemo(() => String(address || '').toLowerCase(), [address])
  const isAddrValid = useMemo(
    () => !!addrParam && /^0x[a-fA-F0-9]{40}$/.test(addrParam),
    [addrParam],
  )

  // Initial load
  useEffect(() => {
    if (!isAddrValid) return
    const fetchChats = async () => {
      try {
        const { data, error } = await supabase
          .from('chats')
          .select('id, sender_wallet, message, created_at')
          .eq(filterColumn, addrParam)
          .order('created_at', { ascending: true })
        if (error) {
          console.warn('Failed to fetch chats:', error.message)
          return
        }
        const msgs = Array.isArray(data) ? data : []
        const safeMsgs = (msgs as any[])
          .map((m: any) => {
            const { sanitized, ok } = sanitizeChatMessage(m.message, { maxLength: 500 })
            return ok ? { ...m, message: sanitized } : null
          })
          .filter(Boolean)
        setMessages(safeMsgs as any)
        const senders = Array.from(
          new Set(msgs.map((m: any) => (m.sender_wallet || '').toLowerCase()).filter(Boolean)),
        )
        if (senders.length) {
          const { data: gamers } = await supabase
            .from('gamers')
            .select('wallet, username, avatar_url')
            .in('wallet', senders)
          const map: Record<string, { username: string; avatar_url?: string }> = {}
          ;(Array.isArray(gamers) ? gamers : []).forEach((g: any) => {
            const key = (g.wallet || '').toLowerCase()
            map[key] = {
              username: g.username || `gamer_${String(key).slice(2, 8)}`,
              avatar_url: g.avatar_url || undefined,
            }
          })
          setChatUsers(map)
        } else {
          setChatUsers({})
        }
      } catch (e) {
        console.warn('Unexpected error fetching chats:', e)
      }
    }
    void fetchChats()
  }, [addrParam, filterColumn, isAddrValid])

  // Realtime subscription
  useEffect(() => {
    if (!isAddrValid) return
    const channel = supabase
      .channel(`chats:${filterColumn}:${addrParam}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter: `${filterColumn}=eq.${addrParam}`,
        },
        (payload: any) => {
          const row = payload?.new
          if (!row) return
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev
            const { sanitized, ok } = sanitizeChatMessage(row.message, { maxLength: 500 })
            if (!ok) return prev
            return [
              ...prev,
              {
                id: row.id,
                sender_wallet: row.sender_wallet,
                message: sanitized,
                created_at: row.created_at,
              },
            ]
          })
          const sender = String(row.sender_wallet || '').toLowerCase()
          setTimeout(async () => {
            try {
              const exists = Boolean((chatUsers as any)[sender])
              if (exists) return
              const { data: gamer } = await supabase
                .from('gamers')
                .select('wallet, username, avatar_url')
                .eq('wallet', sender)
                .maybeSingle()
              setChatUsers((prev) => ({
                ...prev,
                [sender]: {
                  username: gamer?.username || `gamer_${sender.slice(2, 8)}`,
                  avatar_url: gamer?.avatar_url || undefined,
                },
              }))
            } catch (e) {
              // ignore enrichment errors
            }
          }, 0)
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [addrParam, filterColumn, isAddrValid, chatUsers])

  const sendChatMessage = async () => {
    if (isSendingChat) return
    const sender = String(viewerAddress || '').toLowerCase()
    if (!isConnected || !sender || !isAddrValid) return
    const { sanitized, ok } = sanitizeChatMessage(chatInput, { maxLength: 500 })
    if (!ok) return
    setIsSendingChat(true)
    try {
      const insertPayload: Record<string, any> = {
        sender_wallet: sender,
        message: sanitized,
        chat_address: addrParam, // legacy support
      }
      // Also set specific columns to support targeted filters
      if (filterColumn === 'tournament_address') insertPayload.tournament_address = addrParam
      if (filterColumn === 'challenge_address') insertPayload.challenge_address = addrParam

      const { data, error } = await supabase
        .from('chats')
        .insert(insertPayload)
        .select('id, sender_wallet, message, created_at')
        .single()
      if (error) {
        console.warn('Failed to send chat:', error.message)
        return
      }
      const msg = data as any
      setMessages((prev) => [...prev, { ...msg, message: sanitized }])
      setChatInput('')
      if (!chatUsers[sender]) {
        const { data: gamer } = await supabase
          .from('gamers')
          .select('wallet, username, avatar_url')
          .eq('wallet', sender)
          .maybeSingle()
        setChatUsers((prev) => ({
          ...prev,
          [sender]: {
            username: gamer?.username || `gamer_${sender.slice(2, 8)}`,
            avatar_url: gamer?.avatar_url || undefined,
          },
        }))
      }
    } catch (e) {
      console.warn('Unexpected error sending chat:', e)
    } finally {
      setIsSendingChat(false)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Messages */}
      <div className={`${heightClass} space-y-3 overflow-y-auto rounded-xl border border-gray-700 bg-gray-800/30 p-4`}>
        {!isAddrValid ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-400">No chat available for this address.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-400">No messages yet. Be the first to chat.</p>
          </div>
        ) : (
          messages.map((m) => {
            const sender = (m.sender_wallet || '').toLowerCase()
            const ui = chatUsers[sender]
            const username = ui?.username || `gamer_${sender.slice(2, 8)}`
            const avatarUrl = ui?.avatar_url
            return (
              <div key={m.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={username} />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-xs text-white">
                      {username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-medium text-amber-400">{username}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(m.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{safeDisplayText(m.message)}</p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder={isConnected ? 'Type your message...' : 'Connect wallet to chat'}
          disabled={!isConnected || !isAddrValid}
          className="flex-1 rounded-xl border border-gray-600 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 transition-all focus:border-amber-500 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <GamingButton
          variant="neon"
          size="sm"
          className="px-4"
          onClick={sendChatMessage}
          disabled={!isConnected || !isAddrValid || !chatInput.trim() || isSendingChat}
          title={!isConnected ? 'Connect wallet to chat' : undefined}
        >
          <Send className="h-4 w-4" />
        </GamingButton>
      </div>
    </div>
  )
}

export default ChatBox