import { ChevronLeft, ChevronRight } from "lucide-react"

interface Props {
  page: number
  perPage: number
  total: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, perPage, total, onPageChange }: Props) {
  if (total === 0) return null
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  if (totalPages <= 1) return null

  return (
    <div className="shrink-0 flex items-center justify-between border-t border-white/10 px-3 py-1.5">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
        className="rounded p-1 text-gray-500 hover:text-gray-200 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors"
      >
        <ChevronLeft size={13} />
      </button>

      <span className="text-[10px] text-gray-500">
        Pág. {page}/{totalPages} · {total}
      </span>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Página siguiente"
        className="rounded p-1 text-gray-500 hover:text-gray-200 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors"
      >
        <ChevronRight size={13} />
      </button>
    </div>
  )
}
