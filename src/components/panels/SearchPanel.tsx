import { useState } from 'react'
import { Search, SearchX, X } from 'lucide-react'
import { useDebouncedValue } from '../../features/search/hooks/useDebouncedValue'
import { useGlobalSearch, MIN_QUERY_LEN } from '../../features/search/hooks/useGlobalSearch'
import { ResultGroup } from '../../features/search/components/ResultGroup'
import { ALL_TYPES, TYPE_LABELS, EMPTY_FILTERS } from '../../features/search/types'
import type { SearchFiltersState, SearchResultType } from '../../features/search/types'

export default function SearchPanel() {
  const [query, setQuery]     = useState('')
  const [filters, setFilters] = useState<SearchFiltersState>(EMPTY_FILTERS)

  const debouncedQuery = useDebouncedValue(query, 300)
  const { data, isLoading, isError } = useGlobalSearch(debouncedQuery, filters)

  const trimmed    = debouncedQuery.trim()
  const tooShort   = trimmed.length > 0 && trimmed.length < MIN_QUERY_LEN
  const hasResults = (data?.total ?? 0) > 0
  const showEmpty  = trimmed.length >= MIN_QUERY_LEN && !isLoading && !isError && !hasResults

  function toggleType(type: SearchResultType) {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }))
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header + input */}
      <div className="px-3 pt-3 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-gray-200">Buscar</span>
        </div>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en todo…"
            autoFocus
            className="w-full rounded-md bg-white/5 border border-white/10 px-2.5 py-1.5 pr-7 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/25 transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Filtros de tipo — chips scrollables horizontalmente */}
      <div className="px-3 py-2 border-b border-white/10">
        <div className="flex gap-1 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {ALL_TYPES.map((type) => {
            const active = filters.types.includes(type)
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                  active
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-white/5 text-gray-500 border border-white/10 hover:bg-white/10 hover:text-gray-400'
                }`}
              >
                {TYPE_LABELS[type]}
              </button>
            )
          })}
        </div>
        {filters.types.length > 0 && (
          <button
            type="button"
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="mt-1.5 text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Área de resultados */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {/* Hint inicial */}
        {trimmed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-600">
            <Search className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs">Escribe para buscar en notas,<br />tareas, contactos y más.</p>
          </div>
        )}

        {/* Muy corto */}
        {tooShort && (
          <p className="text-[11px] text-gray-600 text-center pt-2">
            Escribe al menos {MIN_QUERY_LEN} caracteres.
          </p>
        )}

        {/* Skeleton */}
        {isLoading && trimmed.length >= MIN_QUERY_LEN && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-lg border border-white/10 overflow-hidden animate-pulse">
                <div className="h-7 bg-white/5" />
                <div className="p-2 space-y-1.5">
                  <div className="h-3 rounded bg-white/10 w-3/4" />
                  <div className="h-2.5 rounded bg-white/5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <p className="text-[11px] text-red-400 text-center pt-2">
            Error al buscar. Intenta de nuevo.
          </p>
        )}

        {/* Sin resultados */}
        {showEmpty && (
          <div className="flex flex-col items-center justify-center py-10 text-center text-gray-600">
            <SearchX className="w-7 h-7 mb-2 opacity-40" />
            <p className="text-xs">
              Sin resultados para{' '}
              <span className="font-medium text-gray-500">«{trimmed}»</span>
            </p>
          </div>
        )}

        {/* Resultados */}
        {hasResults && !isLoading && (
          <>
            <p className="text-[10px] text-gray-600">
              {data!.total} resultado{data!.total !== 1 ? 's' : ''}
            </p>
            {data!.groups.map((group) => (
              <ResultGroup key={group.type} group={group} query={trimmed} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
