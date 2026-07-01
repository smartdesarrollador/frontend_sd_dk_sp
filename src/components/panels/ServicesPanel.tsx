import { useState, useEffect } from "react"
import { ExternalLink, Sparkles, AlertCircle } from "lucide-react"
import { useAuthStore } from "../../store/authStore"
import { openExternal } from "../../lib/openExternal"
import { apiFetch } from "../../lib/apiFetch"

// ─── Constants ────────────────────────────────────────────────────────────────
const DIGISIDER_URL = "https://digisider.com"

// ─── Types ────────────────────────────────────────────────────────────────────
interface CatalogItem {
  id: string
  name: string
  short_description: string
  image_url: string | null
  icon_color: string
  badge_text: string
  link_url: string
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
function useCatalogItems() {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    apiFetch("/api/v1/public/catalog/?app=desktop")
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json() as Promise<CatalogItem[]>
      })
      .then(setItems)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return { items, loading, error }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ServiceCard({ item, isPaidPlan }: { item: CatalogItem; isPaidPlan: boolean }) {
  const ctaLabel = isPaidPlan ? "Más información" : "Quiero esto"

  return (
    <div className="rounded-xl bg-white/5 p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="shrink-0 w-10 h-10 rounded-lg object-cover"
          />
        ) : (
          <div
            className="shrink-0 w-10 h-10 rounded-lg"
            style={{ backgroundColor: item.icon_color || "#6366f1" }}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-gray-100">{item.name}</p>
            {item.badge_text && (
              <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-amber-500/20 text-amber-400 rounded">
                {item.badge_text}
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-gray-400">{item.short_description}</p>
        </div>
      </div>
      {item.link_url && (
        <button
          onClick={() => openExternal(item.link_url)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-[11px] font-medium text-gray-300 transition-colors hover:bg-white/10 hover:border-white/20 hover:text-white"
        >
          {ctaLabel}
          <ExternalLink size={11} />
        </button>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ServicesPanel() {
  const tenant = useAuthStore((s) => s.tenant)
  const plan = tenant?.plan ?? "free"
  const isPaidPlan = plan !== "free"
  const { items, loading, error } = useCatalogItems()

  return (
    <div className="flex h-full flex-col">

      {/* ── Header ── */}
      <header className="shrink-0 border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-white/90">Servicios Digitales</h2>
        <p className="mt-0.5 text-[10px] text-gray-500">
          {isPaidPlan
            ? "Servicios profesionales para potenciar tu organización"
            : "Hacé crecer tu negocio online"}
        </p>
      </header>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">

        {/* Intro banner — solo plan free */}
        {!isPaidPlan && (
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-purple-900/30 to-blue-900/20 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={13} className="text-purple-400" />
              <p className="text-xs font-semibold text-gray-200">¿Listo para el siguiente nivel?</p>
            </div>
            <p className="text-[10px] leading-relaxed text-gray-500">
              Combiná tu cuenta con servicios profesionales diseñados para hacer crecer tu negocio online.
            </p>
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-white/5 p-4 animate-pulse flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-28 bg-white/10 rounded" />
                    <div className="h-2.5 w-full bg-white/5 rounded" />
                    <div className="h-2.5 w-3/4 bg-white/5 rounded" />
                  </div>
                </div>
                <div className="h-8 w-full bg-white/5 rounded-lg" />
              </div>
            ))}
          </>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-10 text-white/40">
            <AlertCircle size={28} className="mb-2 opacity-50" />
            <p className="text-xs">No se pudieron cargar los servicios</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-white/40">
            <p className="text-xs">Sin servicios disponibles</p>
          </div>
        )}

        {/* Cards dinámicas */}
        {!loading && !error && items.map((item) => (
          <ServiceCard key={item.id} item={item} isPaidPlan={isPaidPlan} />
        ))}

        {/* Footer link */}
        <div className="mt-1 flex flex-col items-center gap-1.5 pb-1">
          <p className="text-[10px] text-gray-700">¿Querés saber más?</p>
          <button
            onClick={() => openExternal(DIGISIDER_URL)}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] text-gray-600 transition-colors hover:bg-white/5 hover:text-gray-400"
          >
            <ExternalLink size={11} />
            Visitá digisider.com
          </button>
        </div>

      </div>
    </div>
  )
}
