import { useState, useEffect, useCallback } from "react"
import { Lock, Clipboard, Check, Code2, AlertCircle } from "lucide-react"
import { useAuthStore } from "../../store/authStore"

interface Snippet {
  id: string
  title: string
  description: string
  code: string
  language: string
  tags: string[]
  created_at: string
}

const LANG_COLORS: Record<string, string> = {
  javascript: "bg-yellow-900/40 text-yellow-300",
  typescript: "bg-blue-900/40 text-blue-300",
  python:     "bg-green-900/40 text-green-300",
  bash:       "bg-gray-700/60 text-gray-200",
  sql:        "bg-orange-900/40 text-orange-300",
  html:       "bg-red-900/40 text-red-300",
  css:        "bg-purple-900/40 text-purple-300",
  json:       "bg-teal-900/40 text-teal-300",
  yaml:       "bg-teal-900/40 text-teal-300",
  dockerfile: "bg-sky-900/40 text-sky-300",
  go:         "bg-cyan-900/40 text-cyan-300",
  rust:       "bg-orange-900/40 text-orange-300",
  java:       "bg-red-900/40 text-red-300",
  other:      "bg-gray-700/60 text-gray-300",
}

function langColor(language: string): string {
  return LANG_COLORS[language.toLowerCase()] ?? LANG_COLORS.other
}

function SnippetItem({ snippet }: { snippet: Snippet }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    const text = snippet.description
      ? `${snippet.title}\n${snippet.description}`
      : snippet.title
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-md group">
      <span
        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase ${langColor(snippet.language)}`}
      >
        {snippet.language}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-100">{snippet.title}</p>
        {snippet.description && (
          <p className="truncate text-xs text-gray-400">{snippet.description}</p>
        )}
      </div>
      <button
        onClick={handleCopy}
        className="shrink-0 rounded p-1 text-gray-500 hover:text-gray-200 hover:bg-white/10 transition-colors"
        title="Copiar título y descripción"
      >
        {copied ? (
          <Check size={14} className="text-green-400" />
        ) : (
          <Clipboard size={14} />
        )}
      </button>
    </div>
  )
}

function SnippetsSkeleton() {
  return (
    <div className="flex flex-col gap-1 px-3 py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 py-2 animate-pulse">
          <div className="h-4 w-14 shrink-0 rounded bg-white/10" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-3/4 rounded bg-white/10" />
            <div className="h-2.5 w-1/2 rounded bg-white/10" />
          </div>
          <div className="h-5 w-5 shrink-0 rounded bg-white/10" />
        </div>
      ))}
    </div>
  )
}

export default function SnippetsPanel() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const accessToken     = useAuthStore((s) => s.accessToken)
  const tenantSlug      = useAuthStore((s) => s.tenant?.slug)

  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSnippets = useCallback(async () => {
    if (!accessToken || !tenantSlug) {
      console.warn("[SnippetsPanel] fetchSnippets called without accessToken or tenantSlug")
      return
    }
    setIsLoading(true)
    setError(null)

    const apiBase = import.meta.env.VITE_API_URL ?? "http://rbac.local.test"
    const url = `${apiBase}/api/v1/app/snippets/`
    console.log("[SnippetsPanel] fetching →", url)
    console.log("[SnippetsPanel] token (primeros 20 chars):", accessToken.slice(0, 20) + "…")

    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Tenant-Slug': tenantSlug,
        },
      })
      console.log("[SnippetsPanel] response status:", res.status, res.statusText)

      if (!res.ok) {
        const body = await res.text().catch(() => "(sin body)")
        console.error("[SnippetsPanel] HTTP error body:", body)
        throw new Error(`HTTP ${res.status} ${res.statusText}`)
      }

      const data = await res.json()
      console.log("[SnippetsPanel] data keys:", Object.keys(data))
      const list: Snippet[] = data.snippets ?? data.results ?? []
      console.log("[SnippetsPanel] snippets count:", list.length)
      setSnippets(list)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cargar snippets"
      console.error("[SnippetsPanel] fetch error:", err)
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, tenantSlug])

  useEffect(() => {
    console.log("[SnippetsPanel] isAuthenticated changed →", isAuthenticated)
    if (isAuthenticated) {
      fetchSnippets()
    } else {
      setSnippets([])
      setError(null)
    }
  }, [isAuthenticated, fetchSnippets])

  if (!isAuthenticated) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <Lock size={32} className="text-gray-600" />
        <p className="text-sm text-gray-400">Inicia sesión para ver tus snippets</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-100">Snippets</h2>
          {!isLoading && !error && (
            <span className="text-xs text-gray-500">{snippets.length}</span>
          )}
        </div>
      </header>

      {isLoading && <SnippetsSkeleton />}

      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <AlertCircle size={28} className="text-red-400" />
              <p className="text-sm text-gray-400">{error}</p>
          <p className="text-[10px] text-gray-600 font-mono break-all">
            {import.meta.env.VITE_API_URL ?? "http://rbac.local.test"}/api/v1/app/snippets/
          </p>
          <button
            onClick={fetchSnippets}
            className="rounded-md bg-white/10 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/20 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !error && snippets.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <Code2 size={32} className="text-gray-600" />
          <p className="text-sm text-gray-400">No tienes snippets aún</p>
        </div>
      )}

      {!isLoading && !error && snippets.length > 0 && (
        <div className="flex-1 overflow-y-auto p-2">
          {snippets.map((snippet) => (
            <SnippetItem key={snippet.id} snippet={snippet} />
          ))}
        </div>
      )}
    </div>
  )
}
