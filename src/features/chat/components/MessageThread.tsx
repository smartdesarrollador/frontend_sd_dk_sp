import { useEffect, useMemo, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { dayLabel } from '../utils'
import type { ConvertTarget, Message } from '../types'

interface MessageThreadProps {
  messages: Message[]
  isLoading: boolean
  typingUser?: string | null
  onReply: (message: Message) => void
  onConvert: (message: Message, target: ConvertTarget) => void
}

interface DayGroup {
  key: string
  label: string
  items: Message[]
}

export function MessageThread({ messages, isLoading, typingUser, onReply, onConvert }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  const groups = useMemo<DayGroup[]>(() => {
    const result: DayGroup[] = []
    for (const message of messages) {
      const key = new Date(message.created_at).toDateString()
      const last = result[result.length - 1]
      if (last && last.key === key) {
        last.items.push(message)
      } else {
        result.push({ key, label: dayLabel(message.created_at), items: [message] })
      }
    }
    return result
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'auto' })
  }, [messages.length])

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'} animate-pulse`}
          >
            <div className="h-8 w-32 bg-white/10 rounded-2xl" />
          </div>
        ))}
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-xs">
        No hay mensajes aún. ¡Envía el primero!
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
      {groups.map((group) => (
        <div key={group.key} className="space-y-1.5">
          <div className="flex justify-center">
            <span className="px-2.5 py-0.5 text-[10px] text-gray-500 bg-white/5 rounded-full">
              {group.label}
            </span>
          </div>
          {group.items.map((message, idx) => (
            <MessageBubble
              key={message.id}
              message={message}
              showSender={idx === 0 || group.items[idx - 1].sender.id !== message.sender.id}
              onReply={onReply}
              onConvert={onConvert}
            />
          ))}
        </div>
      ))}
      {typingUser && (
        <p className="text-[10px] text-gray-500 italic px-1">{typingUser} está escribiendo…</p>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
