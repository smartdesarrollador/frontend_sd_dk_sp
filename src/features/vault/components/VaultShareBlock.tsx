import { useEffect, useState } from "react"
import { X, Trash2, Loader2, AlertCircle, Share2 } from "lucide-react"
import { fetchTeamDirectory, type TeamMember } from "../../../lib/sharing"
import {
  fetchVaultItemShares,
  shareVaultItem,
  revokeVaultShare,
  type VaultShareRecord,
} from "../../../lib/vaultSharing"

interface Props {
  itemId: string
  itemTitle: string
  onClose: () => void
}

const inputCls =
  "w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/25 transition-colors"

export function VaultShareBlock({ itemId, itemTitle, onClose }: Props) {
  const [teammates, setTeammates] = useState<TeamMember[]>([])
  const [shares, setShares] = useState<VaultShareRecord[]>([])
  const [loadingShares, setLoadingShares] = useState(true)
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTeamDirectory().then(setTeammates).catch(() => setTeammates([]))
  }, [])

  useEffect(() => {
    setLoadingShares(true)
    fetchVaultItemShares(itemId)
      .then(setShares)
      .catch(() => setShares([]))
      .finally(() => setLoadingShares(false))
  }, [itemId])

  async function handleRevoke(shareId: string) {
    try {
      await revokeVaultShare(itemId, shareId)
      setShares((prev) => prev.filter((s) => s.id !== shareId))
    } catch {
      // silent — the row simply stays; user can retry
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return

    setError(null)
    setSubmitting(true)
    try {
      const share = await shareVaultItem(itemId, trimmed)
      setShares((prev) => [...prev.filter((s) => s.id !== share.id), share])
      setEmail("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo compartir. Verifica el email.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="shrink-0 border-b border-white/10 px-3 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 truncate">
          <Share2 size={11} className="shrink-0" />
          <span className="truncate">Compartir: {itemTitle}</span>
        </p>
        <button
          onClick={onClose}
          className="shrink-0 rounded p-1 text-gray-500 hover:text-gray-200 hover:bg-white/10 transition-colors"
          title="Cerrar"
        >
          <X size={13} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertCircle size={11} className="shrink-0" />
            {error}
          </p>
        )}

        {teammates.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) setEmail(e.target.value)
            }}
            className={inputCls + " cursor-pointer"}
          >
            <option value="" className="bg-gray-900">Elegir del equipo…</option>
            {teammates.map((m) => (
              <option key={m.id} value={m.email} className="bg-gray-900">
                {m.name} ({m.email})
              </option>
            ))}
          </select>
        )}

        <div className="flex gap-1.5">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            required
            className={inputCls + " flex-1"}
          />
          <button
            type="submit"
            disabled={submitting || !email.trim()}
            className="shrink-0 flex items-center justify-center gap-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-medium text-white transition-colors"
          >
            {submitting && <Loader2 size={12} className="animate-spin" />}
            Compartir
          </button>
        </div>
      </form>

      <div className="pt-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-600 mb-1">
          Con acceso
        </p>
        {loadingShares ? (
          <p className="text-xs text-gray-600 italic">Cargando…</p>
        ) : shares.length === 0 ? (
          <p className="text-xs text-gray-600 italic">Nadie tiene acceso aún.</p>
        ) : (
          <div className="space-y-1">
            {shares.map((share) => (
              <div
                key={share.id}
                className="flex items-center justify-between rounded bg-white/5 px-2 py-1"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs text-gray-200">{share.shared_with_name}</p>
                  <p className="truncate text-[10px] text-gray-500">{share.shared_with_email}</p>
                </div>
                <button
                  onClick={() => handleRevoke(share.id)}
                  className="shrink-0 rounded p-1 text-gray-500 hover:text-red-300 hover:bg-red-500/20 transition-colors"
                  title={`Revocar acceso de ${share.shared_with_name}`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
