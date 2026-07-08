import { useEffect, useState } from "react"
import { X, Trash2, Loader2, AlertCircle, Share2 } from "lucide-react"
import {
  fetchTeamDirectory,
  fetchResourceShares,
  createShare,
  revokeShare,
  type ShareResourceType,
  type TeamMember,
  type ShareRecord,
} from "../../lib/sharing"

interface ShareResourceRef {
  id: string
  title: string
}

interface Props {
  resourceType: ShareResourceType
  resources: ShareResourceRef[]
  onClose: () => void
}

const inputCls =
  "w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/25 transition-colors"

export function ShareBlock({ resourceType, resources, onClose }: Props) {
  const isBulk = resources.length > 1
  const single = resources.length === 1 ? resources[0] : null

  const [teammates, setTeammates] = useState<TeamMember[]>([])
  const [shares, setShares] = useState<ShareRecord[]>([])
  const [loadingShares, setLoadingShares] = useState(!isBulk)
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bulkResult, setBulkResult] = useState<{ ok: number; failed: number; total: number } | null>(null)

  useEffect(() => {
    fetchTeamDirectory().then(setTeammates).catch(() => setTeammates([]))
  }, [])

  useEffect(() => {
    if (!single) return
    setLoadingShares(true)
    fetchResourceShares(resourceType, single.id)
      .then(setShares)
      .catch(() => setShares([]))
      .finally(() => setLoadingShares(false))
  }, [resourceType, single?.id])

  async function handleRevoke(shareId: string) {
    try {
      await revokeShare(shareId)
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
    setBulkResult(null)
    setSubmitting(true)

    try {
      if (!isBulk && single) {
        const share = await createShare(resourceType, single.id, trimmed)
        setShares((prev) => [...prev, share])
        setEmail("")
      } else {
        const results = await Promise.allSettled(
          resources.map((r) => createShare(resourceType, r.id, trimmed)),
        )
        const ok = results.filter((r) => r.status === "fulfilled").length
        const failed = results.length - ok
        setBulkResult({ ok, failed, total: results.length })
        if (failed === 0) setEmail("")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo compartir. Verifica el email.")
    } finally {
      setSubmitting(false)
    }
  }

  const title = isBulk ? `Compartir ${resources.length} elementos` : `Compartir: ${single?.title ?? ""}`

  return (
    <div className="shrink-0 border-b border-white/10 px-3 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 truncate">
          <Share2 size={11} className="shrink-0" />
          <span className="truncate">{title}</span>
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
        {bulkResult && (
          <p className={`text-xs ${bulkResult.failed === 0 ? "text-green-400" : "text-yellow-400"}`}>
            {bulkResult.failed === 0
              ? `${bulkResult.ok} de ${bulkResult.total} compartidos correctamente.`
              : `${bulkResult.ok} de ${bulkResult.total} — ${bulkResult.failed} falló${bulkResult.failed === 1 ? "" : "aron"}.`}
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

      {!isBulk && (
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
      )}
    </div>
  )
}
