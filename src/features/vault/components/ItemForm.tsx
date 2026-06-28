import { useState } from 'react'
import { ArrowLeft, Eye, EyeOff, Copy, Check } from 'lucide-react'
import { useVaultItemMutations } from '../hooks/useVaultItemMutations'
import { VAULT_TYPES } from '../itemTypes'
import type { VaultItemType, VaultItemRevealed, VaultData } from '../types'

interface Props {
  initial?: VaultItemRevealed | null
  onBack: () => void
  onSaved: () => void
  refetchItems: () => void
}

const TYPE_OPTIONS: { value: VaultItemType; label: string }[] = [
  { value: 'login', label: 'Login' },
  { value: 'api_key', label: 'API Key' },
  { value: 'secure_note', label: 'Nota segura' },
  { value: 'card', label: 'Tarjeta' },
]

export default function ItemForm({ initial, onBack, onSaved, refetchItems }: Props) {
  const isEdit = Boolean(initial)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [type, setType] = useState<VaultItemType>(initial?.item_type ?? 'login')
  const [data, setData] = useState<VaultData>(initial?.data ?? {})
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({})
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { create, update } = useVaultItemMutations(refetchItems)

  const fields = VAULT_TYPES[type].fields

  const handleFieldChange = (name: string, value: string) => {
    setData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCopy = (name: string, value: string) => {
    navigator.clipboard.writeText(value)
    setCopiedField(name)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleSave = async () => {
    if (!title.trim()) { setError('El título es obligatorio.'); return }
    setSaving(true)
    setError(null)
    const ok = isEdit && initial
      ? await update(initial.id, { title, data })
      : await create({ title, item_type: type, data })
    setSaving(false)
    if (ok) onSaved()
    else setError('No se pudo guardar. Intenta de nuevo.')
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <button onClick={onBack} className="rounded p-1 text-gray-400 hover:bg-white/5 hover:text-gray-200">
          <ArrowLeft size={15} />
        </button>
        <p className="text-sm font-semibold text-gray-200">
          {isEdit ? 'Editar elemento' : 'Nuevo elemento'}
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-3">
          {/* Title */}
          <div>
            <label className="mb-1 block text-[10px] text-gray-500">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre del elemento"
              className="w-full rounded-lg border border-white/10 bg-[#1e1e2e] px-3 py-2 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500"
            />
          </div>

          {/* Type selector — disabled in edit */}
          {!isEdit && (
            <div>
              <label className="mb-1 block text-[10px] text-gray-500">Tipo</label>
              <select
                value={type}
                onChange={(e) => { setType(e.target.value as VaultItemType); setData({}) }}
                className="w-full rounded-lg border border-white/10 bg-[#1e1e2e] px-3 py-2 text-sm text-gray-200 outline-none focus:border-blue-500"
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Dynamic fields */}
          {fields.map((f) => {
            const value = data[f.name] ?? ''
            const isVisible = showSecret[f.name]
            return (
              <div key={f.name}>
                <label className="mb-1 block text-[10px] text-gray-500">{f.label}</label>
                <div className="relative">
                  {f.textarea ? (
                    <textarea
                      value={value}
                      onChange={(e) => handleFieldChange(f.name, e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-white/10 bg-[#1e1e2e] px-3 py-2 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500"
                    />
                  ) : (
                    <input
                      type={f.secret && !isVisible ? 'password' : 'text'}
                      value={value}
                      onChange={(e) => handleFieldChange(f.name, e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#1e1e2e] px-3 py-2 pr-16 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500"
                    />
                  )}
                  {f.secret && !f.textarea && (
                    <div className="absolute right-2 top-2 flex gap-1">
                      <button
                        type="button"
                        onClick={() => setShowSecret((v) => ({ ...v, [f.name]: !v[f.name] }))}
                        className="text-gray-500 hover:text-gray-300"
                      >
                        {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      {value && (
                        <button
                          type="button"
                          onClick={() => handleCopy(f.name, value)}
                          className="text-gray-500 hover:text-gray-300"
                        >
                          {copiedField === f.name ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 p-3">
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="flex-1 rounded-lg border border-white/10 py-2 text-xs text-gray-400 hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
