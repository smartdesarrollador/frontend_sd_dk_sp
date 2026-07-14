import { useState, useEffect, useRef } from 'react'
import { Plus, Lock, Search, ChevronRight } from 'lucide-react'
import { useVaultItems } from '../hooks/useVaultItems'
import ItemTypeBadge from './ItemTypeBadge'
import { VAULT_TYPES } from '../itemTypes'
import { useDebouncedValue } from '../../search/hooks/useDebouncedValue'
import Pagination from '../../../components/shared/Pagination'
import type { VaultItem, VaultItemType } from '../types'

interface Props {
  onSelect: (item: VaultItem) => void
  onNew: () => void
  onLock: () => void
}

const TYPE_FILTERS: { value: VaultItemType | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'login', label: 'Login' },
  { value: 'api_key', label: 'API Key' },
  { value: 'secure_note', label: 'Nota' },
  { value: 'card', label: 'Tarjeta' },
]

export default function ItemList({ onSelect, onNew, onLock }: Props) {
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 350)
  const [typeFilter, setTypeFilter] = useState<VaultItemType | ''>('')
  const [page, setPage] = useState(1)
  const listRef = useRef<HTMLDivElement>(null)

  const { items, pagination, loading } = useVaultItems({ search: debouncedSearch, item_type: typeFilter, page })

  const hasActiveFilters = Boolean(typeFilter || debouncedSearch.trim())

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [typeFilter, debouncedSearch])

  // Reset scroll position when the page changes
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 })
  }, [page])

  // Fallback if the current page becomes empty (e.g. deleted the last item on it)
  useEffect(() => {
    if (!loading && pagination.total > 0 && items.length === 0 && page > 1) {
      setPage(1)
    }
  }, [loading, pagination.total, items, page])

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="text-sm font-semibold text-gray-200">
          Bóveda {pagination.total > 0 && <span className="text-xs text-gray-500">({pagination.total})</span>}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onNew}
            className="rounded p-1 text-gray-400 hover:bg-white/5 hover:text-gray-200"
            title="Nuevo elemento"
          >
            <Plus size={15} />
          </button>
          <button
            onClick={onLock}
            className="rounded p-1 text-gray-400 hover:bg-white/5 hover:text-gray-200"
            title="Bloquear"
          >
            <Lock size={15} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="border-b border-white/10 px-3 py-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-2 text-gray-500" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar…"
            className="w-full rounded-lg border border-white/10 bg-[#1e1e2e] py-1.5 pl-7 pr-3 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Type filter pills */}
      <div className="flex gap-1 overflow-x-auto border-b border-white/10 px-3 py-2 scrollbar-none">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
              typeFilter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div ref={listRef} className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-2 p-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-white/5" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
            <p className="text-xs text-gray-500">
              {hasActiveFilters ? 'Sin resultados.' : 'No hay elementos en la bóveda.'}
            </p>
            {!hasActiveFilters && (
              <button onClick={onNew} className="text-xs text-blue-400 hover:underline">
                Agregar primer elemento
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {items.map((item) => {
              const Icon = VAULT_TYPES[item.item_type].icon
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onSelect(item)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5"
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${VAULT_TYPES[item.item_type].color}`}>
                      <Icon size={13} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-gray-200">{item.title}</p>
                      <ItemTypeBadge type={item.item_type} />
                    </div>
                    <ChevronRight size={13} className="shrink-0 text-gray-600" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <Pagination
        page={pagination.page}
        perPage={pagination.per_page}
        total={pagination.total}
        onPageChange={setPage}
      />
    </div>
  )
}
