import { useState, useCallback } from 'react'
import { apiFetch } from '../../../lib/apiFetch'
import type { Message } from '../types'

interface SendVariables {
  conversation: string
  content?: string
  reply_to?: string
  file?: File | null
}

export function useSendMessage(onSuccess?: (msg: Message) => void) {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = useCallback(async (vars: SendVariables) => {
    if (sending) return
    setSending(true)
    setError(null)
    try {
      let res: Response
      if (vars.file) {
        const form = new FormData()
        form.append('conversation', vars.conversation)
        if (vars.content) form.append('content', vars.content)
        if (vars.reply_to) form.append('reply_to', vars.reply_to)
        form.append('file', vars.file)
        res = await apiFetch('/api/v1/app/chat/messages/', { method: 'POST', body: form })
      } else {
        res = await apiFetch('/api/v1/app/chat/messages/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation: vars.conversation,
            content: vars.content ?? '',
            ...(vars.reply_to ? { reply_to: vars.reply_to } : {}),
          }),
        })
      }
      if (!res.ok) {
        // Surfacear el mensaje del backend (p.ej. 402: cuota de almacenamiento llena).
        let msg = 'Error enviando mensaje'
        try {
          const body = await res.json() as { error?: { message?: string } }
          if (body?.error?.message) msg = body.error.message
        } catch { /* respuesta sin cuerpo JSON */ }
        setError(msg)
        return
      }
      const msg = await res.json() as Message
      onSuccess?.(msg)
    } catch {
      setError('Error de red')
    } finally {
      setSending(false)
    }
  }, [sending, onSuccess])

  return { send, sending, error }
}
