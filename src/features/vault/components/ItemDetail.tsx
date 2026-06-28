import { useState, useEffect } from 'react'
import { ArrowLeft, Eye, EyeOff, Copy, Check, Pencil, Trash2, Loader2 } from 'lucide-react'
import { useVaultItemMutations } from '../hooks/useVaultItemMutations'
import ItemTypeBadge from './ItemTypeBadge'
import { VAULT_TYPES } from '../itemTypes'
import type { VaultItem, VaultItemRevealed } from '../types'

interface Props {
  item: VaultItem
  onBack: () => void
  onEdit: (revealed: VaultItemRevealed) => void
  onDeleted: () => void
  refetchItems: () => void
}

export default function ItemDetail({ item, onBack, onEdit, onDeleted, refetchItems }: Props) {
  const [revealed, setRevealed] = useState<VaultItemRevealed | null>(null)
  const [loading, setLoading] = useState(true)
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({})
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { reveal, remove } = useVaultItemMutations(refetchItems)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    reveal(item.id).then((data) => {
      if (mounted) { setRevealed(data); setLoading(false) }
    })
    return () => { mounted = false }
  }, [item.id, reveal])

  const handleCopy = (field: string, value: string) => {
    navigator.clipboard.writeText(value)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar este elemento de la bóveda?')) return
    setDeleting(true)
    const ok = await remove(item.id)
    if (ok) onDeleted()
    setDeleting(false)
  }

  const fields = VAULT_TYPES[item.item_type].fields

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <button onClick={onBack} className="rounded p-1 text-gray-400 hover:bg-white/5 hover:text-gray-200">
          <ArrowLeft size={15} />
        </button>
        <p className="flex-1 truncate text-sm font-semibold text-gray-200">{item.title}</p>
        <button
          onClick={() => revealed && onEdit(revealed)}
          disabled={!revealed}
          className="rounded p-1 text-gray-400 hover:bg-white/5 hover:text-gray-200 disabled:opacity-40"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded p-1 text-gray-400 hover:bg-white/5 hover:text-red-400 disabled:opacity-40"
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>

      {/* Badge */}
      <div className="border-b border-white/10 px-3 py-2">
        <ItemTypeBadge type={item.item_type} />
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-3 p-3">
            {fields.map((f) => (
              <div key={f.name} className="h-14 animate-pulse rounded-lg bg-white/5" />
            ))}
          </div>
        ) : !revealed ? (
          <div className="p-4 text-xs text-red-400">No se pudo obtener el elemento.</div>
        ) : (
          <div className="flex flex-col gap-1 p-3">
            {fields.map((f) => {
              const value = revealed.data[f.name] ?? ''
              const isVisible = visibleFields[f.name]
              return (
                <div key={f.name} className="rounded-lg border border-white/5 bg-[#1e1e2e] p-2.5">
                  <p className="mb-1 text-[10px] text-gray-500">{f.label}</p>
                  <div className="flex items-start gap-1.5">
                    <p className={`flex-1 break-all text-xs text-gray-200 ${f.textarea ? 'whitespace-pre-wrap' : ''}`}>
                      {f.secret && !isVisible
                        ? '•'.repeat(Math.min(value.length || 8, 16))
                        : value || <span className="text-gray-600">—</span>}
                    </p>
                    <div className="flex shrink-0 gap-1">
                      {f.secret && (
                        <button
                          onClick={() => setVisibleFields((v) => ({ ...v, [f.name]: !v[f.name] }))}
                          className="rounded p-0.5 text-gray-500 hover:text-gray-300"
                        >
                          {isVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      )}
                      {value && (
                        <button
                          onClick={() => handleCopy(f.name, value)}
                          className="rounded p-0.5 text-gray-500 hover:text-gray-300"
                        >
                          {copiedField === f.name ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
