import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../../../store/authStore'
import { deriveWsUrl } from '../ws'
import type { Message } from '../types'

interface TypingState {
  [conversationId: string]: { userName: string; at: number }
}

export interface ChatSocketCallbacks {
  onNewMessage: (msg: Message) => void
  onTyping: (convId: string, userName: string) => void
  onPresence: (userId: string, online: boolean) => void
  onMembership: () => void
}

export function useChatSocket(callbacks: ChatSocketCallbacks) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [connected, setConnected] = useState(false)
  const [typing, setTyping] = useState<TypingState>({})
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set())
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const attemptsRef = useRef(0)
  const closedByUs = useRef(false)
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  const handleMessage = useCallback((msg: Message) => {
    callbacksRef.current.onNewMessage(msg)
  }, [])

  useEffect(() => {
    if (!accessToken) return
    closedByUs.current = false

    const connect = () => {
      const url = deriveWsUrl(`/ws/chat/?token=${encodeURIComponent(accessToken)}`)
      const socket = new WebSocket(url)
      socketRef.current = socket

      socket.onopen = () => {
        setConnected(true)
        attemptsRef.current = 0
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string)
          if (data.event === 'message') {
            handleMessage(data.message as Message)
          } else if (data.event === 'typing') {
            setTyping((prev) => ({
              ...prev,
              [data.conversation]: { userName: data.user_name, at: Date.now() },
            }))
            callbacksRef.current.onTyping(data.conversation as string, data.user_name as string)
          } else if (data.event === 'presence') {
            setOnlineUserIds((prev) => {
              const next = new Set(prev)
              if (data.online) next.add(String(data.user_id))
              else next.delete(String(data.user_id))
              return next
            })
            callbacksRef.current.onPresence(String(data.user_id), Boolean(data.online))
          } else if (data.event === 'membership') {
            callbacksRef.current.onMembership()
          }
        } catch {
          /* ignore malformed frames */
        }
      }

      socket.onclose = () => {
        setConnected(false)
        socketRef.current = null
        if (closedByUs.current) return
        attemptsRef.current += 1
        const delay = Math.min(1000 * 2 ** attemptsRef.current, 15_000)
        reconnectRef.current = setTimeout(connect, delay)
      }

      socket.onerror = () => socket.close()
    }

    connect()

    return () => {
      closedByUs.current = true
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [accessToken, handleMessage])

  // Expire stale typing indicators after ~4s
  useEffect(() => {
    const interval = setInterval(() => {
      setTyping((prev) => {
        const now = Date.now()
        const next: TypingState = {}
        for (const [conv, state] of Object.entries(prev)) {
          if (now - state.at < 4000) next[conv] = state
        }
        return Object.keys(next).length === Object.keys(prev).length ? prev : next
      })
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  const sendTyping = useCallback((conversationId: string) => {
    const socket = socketRef.current
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: 'typing', conversation: conversationId }))
    }
  }, [])

  return { connected, typing, onlineUserIds, sendTyping }
}
