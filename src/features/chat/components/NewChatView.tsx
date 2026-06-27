import { useState, useMemo } from 'react'
import { ArrowLeft, Search, Users, Check } from 'lucide-react'
import { Avatar } from './Avatar'
import { useChatUsers } from '../hooks/useChatUsers'
import { useConnections } from '../hooks/useConnections'
import { useCreateConversation } from '../hooks/useCreateConversation'
import type { ChatUser, ConversationDetail } from '../types'

interface NewChatViewProps {
  onBack: () => void
  onCreate: (conv: ConversationDetail) => void
}

export function NewChatView({ onBack, onCreate }: NewChatViewProps) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ChatUser[]>([])
  const [isGroup, setIsGroup] = useState(false)
  const [groupName, setGroupName] = useState('')

  const { users } = useChatUsers(true)
  const { connections } = useConnections(true)
  const { create, loading } = useCreateConversation(onCreate)

  // Merge tenant users + accepted cross-tenant connections, deduplicated
  const candidates = useMemo<ChatUser[]>(() => {
    const map = new Map<string, ChatUser>()
    for (const u of users) map.set(u.id, u)
    for (const c of connections.accepted) {
      if (!map.has(c.other_user.id)) map.set(c.other_user.id, c.other_user)
    }
    return [...map.values()]
  }, [users, connections.accepted])

  const filtered = candidates.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()),
  )

  const toggle = (user: ChatUser) => {
    setSelected((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user],
    )
    if (selected.length === 0) setIsGroup(false)
  }

  const canCreate = selected.length > 0 && (!isGroup || groupName.trim())

  const handleCreate = () => {
    if (!canCreate || loading) return
    const type = selected.length > 1 || isGroup ? 'group' : 'direct'
    create({
      type,
      member_ids: selected.map((u) => u.id),
      ...(type === 'group' ? { name: groupName.trim() } : {}),
    })
  }

  const forceGroup = selected.length > 1

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10 flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver"
          className="p-1 rounded-md text-gray-400 hover:bg-white/10 hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-gray-200">Nuevo chat</span>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-white/10 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email"
            className="w-full pl-7 pr-2 py-1.5 text-xs rounded-md bg-white/5 border border-white/10 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
            autoFocus
          />
        </div>
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-white/10 flex-shrink-0">
          {selected.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => toggle(u)}
              className="flex items-center gap-1 px-2 py-0.5 bg-blue-600/30 border border-blue-500/40 rounded-full text-[10px] text-blue-300 hover:bg-blue-600/50 transition-colors"
            >
              {u.name.split(' ')[0]}
              <span className="text-blue-400">×</span>
            </button>
          ))}
        </div>
      )}

      {/* Group name (when multiple selected or forced) */}
      {(forceGroup || isGroup) && (
        <div className="px-3 py-2 border-b border-white/10 flex-shrink-0">
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Nombre del grupo"
            className="w-full px-2.5 py-1.5 text-xs rounded-md bg-white/5 border border-white/10 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>
      )}

      {/* User list */}
      <div className="flex-1 overflow-y-auto py-1 px-1 space-y-0.5">
        {filtered.length === 0 ? (
          <p className="text-center text-[11px] text-gray-500 py-8">Sin resultados</p>
        ) : (
          filtered.map((user) => {
            const isSelected = selected.some((u) => u.id === user.id)
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => toggle(user)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                  isSelected ? 'bg-blue-600/20 border border-blue-500/30' : 'hover:bg-white/5'
                }`}
              >
                <Avatar name={user.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-200 truncate">{user.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
              </button>
            )
          })
        )}
      </div>

      {/* Footer actions */}
      <div className="px-3 py-2.5 border-t border-white/10 flex-shrink-0 space-y-2">
        {selected.length === 1 && !forceGroup && (
          <button
            type="button"
            onClick={() => setIsGroup((v) => !v)}
            className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-200 transition-colors"
          >
            <Users className="w-3 h-3" />
            {isGroup ? 'Cancelar grupo' : 'Crear como grupo'}
          </button>
        )}
        <button
          type="button"
          onClick={handleCreate}
          disabled={!canCreate || loading}
          className="w-full py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          {loading ? 'Creando…' : 'Crear conversación'}
        </button>
      </div>
    </div>
  )
}
