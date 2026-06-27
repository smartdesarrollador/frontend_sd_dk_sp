import { Avatar } from './Avatar'
import { relativeTime } from '../utils'
import type { Conversation } from '../types'

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onSelect: (id: string) => void
}

export function ConversationItem({ conversation, isActive, onSelect }: ConversationItemProps) {
  const { display_avatar, display_name, last_message, unread_count } = conversation
  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${
        isActive ? 'bg-white/10' : 'hover:bg-white/5'
      }`}
    >
      <Avatar
        name={display_avatar.name}
        color={display_avatar.color}
        isGroup={display_avatar.type === 'group'}
        isSelf={display_avatar.type === 'self'}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className="font-medium text-xs text-gray-200 truncate">{display_name}</p>
          {last_message && (
            <span className="text-[10px] text-gray-500 flex-shrink-0">
              {relativeTime(last_message.created_at)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-1">
          <p className="text-[11px] text-gray-500 truncate">
            {last_message ? last_message.content || 'Mensaje eliminado' : 'Sin mensajes aún'}
          </p>
          {unread_count > 0 && (
            <span className="flex-shrink-0 min-w-[1.1rem] h-[1.1rem] px-1 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
