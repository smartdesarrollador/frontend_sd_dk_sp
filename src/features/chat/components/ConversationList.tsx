import { useState } from 'react'
import { Bookmark, Plus, Search, MessageSquare, Users2 } from 'lucide-react'
import { ConversationItem } from './ConversationItem'
import { MessageSearchResult } from './MessageSearchResult'
import { useDebouncedValue } from '../../search/hooks/useDebouncedValue'
import { useChatSearch, CHAT_SEARCH_MIN_LEN } from '../hooks/useChatSearch'
import type { Conversation } from '../types'

interface ConversationListProps {
  conversations: Conversation[]
  activeId: string | null
  isLoading: boolean
  onSelect: (id: string) => void
  onNewChat: () => void
  onOpenConnections: () => void
  onOpenSelfChat: () => void
}

export function ConversationList({
  conversations,
  activeId,
  isLoading,
  onSelect,
  onNewChat,
  onOpenConnections,
  onOpenSelfChat,
}: ConversationListProps) {
  const [search, setSearch] = useState('')

  const debouncedSearch = useDebouncedValue(search, 300)
  const isSearching = search.trim().length >= CHAT_SEARCH_MIN_LEN

  const { data: searchData, isFetching: searchLoading } = useChatSearch(debouncedSearch)
  const messageResults = searchData?.messages ?? []

  const selfConversation = conversations.find((c) => c.type === 'self') ?? null
  const selfActive = Boolean(selfConversation && selfConversation.id === activeId)

  const term = search.toLowerCase()
  const filtered = conversations.filter(
    (c) =>
      c.type !== 'self' &&
      c.display_name.toLowerCase().includes(term),
  )

  const noResults =
    isSearching && !searchLoading && filtered.length === 0 && messageResults.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10 flex-shrink-0">
        <span className="text-sm font-semibold text-gray-200">Chats</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenConnections}
            aria-label="Conexiones"
            className="p-1.5 rounded-md text-gray-400 hover:bg-white/10 hover:text-gray-200 transition-colors"
          >
            <Users2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onNewChat}
            aria-label="Nuevo chat"
            className="p-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-white/10 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar chats o mensajes"
            aria-label="Buscar chats o mensajes"
            className="w-full pl-7 pr-2 py-1.5 text-xs rounded-md bg-white/5 border border-white/10 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/8"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1 space-y-0.5 px-1">
        {isSearching ? (
          <>
            {/* Chats — name matches */}
            {filtered.length > 0 && (
              <>
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Chats
                </p>
                {filtered.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === activeId}
                    onSelect={onSelect}
                  />
                ))}
              </>
            )}

            {/* Mensajes — content matches del servidor */}
            {messageResults.length > 0 && (
              <>
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Mensajes
                </p>
                {messageResults.map((result) => (
                  <MessageSearchResult
                    key={result.message_id}
                    result={result}
                    query={debouncedSearch}
                    onSelect={onSelect}
                  />
                ))}
              </>
            )}

            {/* Loading mientras busca en el servidor */}
            {searchLoading && messageResults.length === 0 && (
              <p className="text-[11px] text-gray-600 text-center py-4">Buscando…</p>
            )}

            {/* Sin resultados */}
            {noResults && (
              <div className="flex flex-col items-center justify-center text-center py-8 px-3 text-gray-600">
                <MessageSquare className="w-7 h-7 mb-2 opacity-40" />
                <p className="text-xs">Sin resultados para «{search.trim()}»</p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Mensajes guardados (self-chat) */}
            <button
              type="button"
              onClick={onOpenSelfChat}
              aria-label="Mensajes guardados"
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${
                selfActive ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              <div
                className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white flex-shrink-0"
                aria-hidden="true"
              >
                <Bookmark className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-200 truncate">Mensajes guardados</p>
                <p className="text-[11px] text-gray-500 truncate">Guarda mensajes para ti</p>
              </div>
            </button>

            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 w-2/3 bg-white/10 rounded" />
                    <div className="h-2 w-1/2 bg-white/10 rounded" />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-8 px-3 text-gray-500">
                <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs">No hay conversaciones</p>
                <button
                  type="button"
                  onClick={onNewChat}
                  className="mt-1.5 text-xs text-blue-400 hover:text-blue-300"
                >
                  Iniciar un chat
                </button>
              </div>
            ) : (
              filtered.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={conversation.id === activeId}
                  onSelect={onSelect}
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}
