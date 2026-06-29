import { Avatar } from './Avatar'
import { relativeTime } from '../utils'
import type { ChatMessageSearchResult } from '../types'

interface Props {
  result: ChatMessageSearchResult
  query: string
  onSelect: (conversationId: string) => void
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlight(text: string, query: string) {
  const q = query.trim()
  if (!q) return text
  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, 'ig'))
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark key={i} className="bg-yellow-500/30 text-yellow-200 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

export function MessageSearchResult({ result, query, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(result.conversation_id)}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-white/10 transition-colors"
    >
      <Avatar name={result.conversation_name} color="blue" size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-gray-200 truncate">
            {result.conversation_name}
          </p>
          <span className="text-[10px] text-gray-500 flex-shrink-0">
            {relativeTime(result.created_at)}
          </span>
        </div>
        <p className="text-[11px] text-gray-500 truncate mt-0.5">
          <span className="text-gray-600">{result.sender_name}: </span>
          {highlight(result.snippet, query)}
        </p>
      </div>
    </button>
  )
}
