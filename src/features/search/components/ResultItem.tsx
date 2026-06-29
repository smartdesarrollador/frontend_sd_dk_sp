import { TYPE_ICONS } from '../types'
import type { SearchResultItem, SearchResultType } from '../types'
import type { PanelId } from '../../../types'
import { useNavigationStore } from '../../../store/navigationStore'

const TYPE_TO_PANEL: Partial<Record<SearchResultType, PanelId>> = {
  notes:     'notes',
  tasks:     'tasks',
  events:    'calendar',
  contacts:  'contacts',
  bookmarks: 'bookmarks',
  snippets:  'snippets',
  projects:  'projects',
  vault:     'vault',
  messages:  'chat',
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

interface Props {
  item: SearchResultItem
  query: string
}

export function ResultItem({ item, query }: Props) {
  const navigateTo = useNavigationStore((s) => s.navigateTo)
  const Icon = TYPE_ICONS[item.type]
  const targetPanel = TYPE_TO_PANEL[item.type]

  return (
    <button
      type="button"
      onClick={() => targetPanel && navigateTo(targetPanel)}
      className="w-full flex items-start gap-2 px-3 py-2 text-left rounded-lg hover:bg-white/10 transition-colors"
    >
      <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-500" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-200 truncate">
          {highlight(item.title, query)}
        </p>
        {item.snippet && (
          <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
            {highlight(item.snippet, query)}
          </p>
        )}
      </div>
    </button>
  )
}
