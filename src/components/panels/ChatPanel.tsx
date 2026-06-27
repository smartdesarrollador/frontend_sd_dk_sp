import { useState, useCallback, useRef, useEffect } from 'react'
import { ArrowLeft, LogOut, Wifi, WifiOff } from 'lucide-react'

import { ConversationList } from '../../features/chat/components/ConversationList'
import { MessageThread } from '../../features/chat/components/MessageThread'
import { MessageComposer } from '../../features/chat/components/MessageComposer'
import { NewChatView } from '../../features/chat/components/NewChatView'
import { ConnectionsView } from '../../features/chat/components/ConnectionsView'

import { useConversations } from '../../features/chat/hooks/useConversations'
import { useMessages } from '../../features/chat/hooks/useMessages'
import { useSendMessage } from '../../features/chat/hooks/useSendMessage'
import { useSelfConversation } from '../../features/chat/hooks/useSelfConversation'
import { useMarkRead } from '../../features/chat/hooks/useMarkRead'
import { useConvertMessage } from '../../features/chat/hooks/useConvertMessage'
import { useLeaveConversation } from '../../features/chat/hooks/useLeaveConversation'
import { useChatSocket } from '../../features/chat/hooks/useChatSocket'

import type { ConversationDetail, ConvertTarget, Message } from '../../features/chat/types'

type ChatView = 'list' | 'thread' | 'new-chat' | 'connections'

export default function ChatPanel() {
  const [view, setView] = useState<ChatView>('list')
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [typingUser, setTypingUser] = useState<string | null>(null)

  // Stable refs so socket callbacks never go stale
  const activeConvIdRef = useRef<string | null>(null)
  activeConvIdRef.current = activeConvId

  // wsConnected state drives polling interval — starts false, updated by socket
  const [wsConnected, setWsConnected] = useState(false)

  // Data hooks
  const { conversations, loading: convsLoading, refetch: refetchConversations } =
    useConversations(wsConnected)

  const { messages, loading: msgsLoading, refetch: refetchMessages, appendMessage } =
    useMessages(activeConvId, wsConnected)

  // Keep latest callbacks in refs for the socket
  const refetchConversationsRef = useRef(refetchConversations)
  refetchConversationsRef.current = refetchConversations
  const appendMessageRef = useRef(appendMessage)
  appendMessageRef.current = appendMessage

  const { connected, sendTyping } = useChatSocket({
    onNewMessage: useCallback((msg: Message) => {
      appendMessageRef.current(msg)
      refetchConversationsRef.current()
    }, []),
    onTyping: useCallback((convId: string, userName: string) => {
      if (convId === activeConvIdRef.current) {
        setTypingUser(userName)
        setTimeout(() => setTypingUser(null), 4000)
      }
    }, []),
    onPresence: useCallback(() => {}, []),
    onMembership: useCallback(() => {
      refetchConversationsRef.current()
    }, []),
  })

  // Sync socket connected state to drive polling intervals
  useEffect(() => { setWsConnected(connected) }, [connected])

  const { send, sending } = useSendMessage(useCallback((msg: Message) => {
    appendMessageRef.current(msg)
    refetchConversationsRef.current()
  }, []))

  const { markRead } = useMarkRead(refetchConversations)
  const { convert } = useConvertMessage()
  const { leave, loading: leaving } = useLeaveConversation(() => {
    setView('list')
    setActiveConvId(null)
    refetchConversations()
  })

  const { openSelf } = useSelfConversation((conv: ConversationDetail) => {
    setActiveConvId(conv.id)
    setView('thread')
    markRead(conv.id)
  })

  // Navigation handlers
  const handleSelectConversation = (id: string) => {
    setActiveConvId(id)
    setView('thread')
    setReplyTo(null)
    markRead(id)
  }

  const handleBack = () => {
    setView('list')
    setActiveConvId(null)
    setReplyTo(null)
  }

  const handleSend = (content: string, file: File | null) => {
    if (!activeConvId) return
    send({
      conversation: activeConvId,
      content,
      file,
      reply_to: replyTo?.id,
    })
    setReplyTo(null)
  }

  const handleConvert = async (message: Message, target: ConvertTarget) => {
    await convert(message.id, { target })
  }

  const handleNewChatCreated = (conv: ConversationDetail) => {
    setActiveConvId(conv.id)
    setView('thread')
    refetchConversations()
  }

  const activeConversation = conversations.find((c) => c.id === activeConvId) ?? null

  // ── Views ──────────────────────────────────────────────────────────────────

  if (view === 'new-chat') {
    return (
      <div className="flex h-full flex-col">
        <NewChatView onBack={() => setView('list')} onCreate={handleNewChatCreated} />
      </div>
    )
  }

  if (view === 'connections') {
    return (
      <div className="flex h-full flex-col">
        <ConnectionsView onBack={() => setView('list')} />
      </div>
    )
  }

  if (view === 'thread' && activeConvId) {
    return (
      <div className="flex h-full flex-col">
        {/* Thread header */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10 flex-shrink-0">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Volver"
            className="p-1 rounded-md text-gray-400 hover:bg-white/10 hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-200 truncate">
              {activeConversation?.display_name ?? '…'}
            </p>
            {activeConversation?.type === 'group' && (
              <p className="text-[10px] text-gray-500">
                {activeConversation.member_count} miembros
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {connected
              ? <Wifi className="w-3 h-3 text-green-400 opacity-60" aria-label="Conectado" />
              : <WifiOff className="w-3 h-3 text-gray-600" aria-label="Desconectado" />
            }
            {activeConversation?.type !== 'self' && (
              <button
                type="button"
                onClick={() => { if (!leaving) leave(activeConvId) }}
                aria-label="Salir de la conversación"
                disabled={leaving}
                className="p-1 rounded-md text-gray-500 hover:bg-red-500/20 hover:text-red-400 disabled:opacity-40 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <MessageThread
          messages={messages}
          isLoading={msgsLoading}
          typingUser={typingUser}
          onReply={setReplyTo}
          onConvert={handleConvert}
        />

        {!connected && (
          <button
            type="button"
            onClick={refetchMessages}
            className="mx-3 mb-1 py-1 text-[10px] text-gray-500 hover:text-gray-300 text-center transition-colors"
          >
            Actualizar mensajes
          </button>
        )}

        <MessageComposer
          replyTo={replyTo}
          onClearReply={() => setReplyTo(null)}
          onSend={handleSend}
          onTyping={() => sendTyping(activeConvId)}
          isSending={sending}
        />
      </div>
    )
  }

  // Default: conversation list
  return (
    <div className="flex h-full flex-col">
      <ConversationList
        conversations={conversations}
        activeId={activeConvId}
        isLoading={convsLoading}
        onSelect={handleSelectConversation}
        onNewChat={() => setView('new-chat')}
        onOpenConnections={() => setView('connections')}
        onOpenSelfChat={openSelf}
      />
    </div>
  )
}
