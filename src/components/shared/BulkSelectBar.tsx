import { Share2, X } from "lucide-react"

interface Props {
  count: number
  onShare: () => void
  onCancel: () => void
}

export function BulkSelectBar({ count, onShare, onCancel }: Props) {
  return (
    <div className="shrink-0 flex items-center justify-between border-b border-white/10 bg-blue-500/10 px-3 py-1.5">
      <span className="text-xs font-medium text-blue-300">
        {count} sel.
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={onCancel}
          className="rounded p-1 text-gray-400 hover:text-gray-200 hover:bg-white/10 transition-colors"
          title="Cancelar selección"
        >
          <X size={14} />
        </button>
        <button
          onClick={onShare}
          disabled={count === 0}
          className="flex items-center gap-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1 text-xs font-medium text-white transition-colors"
          title="Compartir seleccionados"
        >
          <Share2 size={12} />
          Compartir
        </button>
      </div>
    </div>
  )
}
