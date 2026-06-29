import { TYPE_ICONS } from '../types'
import type { SearchGroup } from '../types'
import { ResultItem } from './ResultItem'

interface Props {
  group: SearchGroup
  query: string
}

export function ResultGroup({ group, query }: Props) {
  const Icon = TYPE_ICONS[group.type]
  return (
    <section className="overflow-hidden rounded-lg border border-white/10">
      <header className="flex items-center gap-2 px-3 py-2 bg-white/5 border-b border-white/10">
        <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <h2 className="text-[11px] font-semibold text-gray-300 flex-1 truncate">{group.label}</h2>
        <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-white/10 text-gray-400">
          {group.count}
        </span>
      </header>
      <div className="p-1">
        {group.results.map((item) => (
          <ResultItem key={`${item.type}-${item.id}`} item={item} query={query} />
        ))}
      </div>
    </section>
  )
}
