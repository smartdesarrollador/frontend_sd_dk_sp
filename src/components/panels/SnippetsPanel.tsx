import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Lock, Clipboard, Check, Code2, AlertCircle,
  Search, X, ChevronDown, ChevronRight, RefreshCw,
  Plus, Loader2, Pencil, Trash2,
} from "lucide-react"
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

const LANGUAGES = [
  "javascript", "typescript", "python", "bash", "sql",
  "html", "css", "json", "yaml", "dockerfile",
  "go", "rust", "java", "other",
] as const

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

// ---------------------------------------------------------------------------
// SnippetItem
// ---------------------------------------------------------------------------
function SnippetItem({
  snippet,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: {
  snippet: Snippet
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [copied, setCopied]         = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(snippet.code || snippet.title).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleEditClick(e: React.MouseEvent) {
    e.stopPropagation()
    onEdit()
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation()
    setConfirmDelete(true)
  }

  function handleConfirmDelete(e: React.MouseEvent) {
    e.stopPropagation()
    setConfirmDelete(false)
    onDelete()
  }

  function handleCancelDelete(e: React.MouseEvent) {
    e.stopPropagation()
    setConfirmDelete(false)
  }

  return (
    <div className="rounded-md overflow-hidden">
      <div
        className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 cursor-pointer group"
        onClick={onToggleExpand}
      >
        <span className="shrink-0 text-gray-600 group-hover:text-gray-400 transition-colors">
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>

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

        {/* Action buttons — visible on hover */}
        {confirmDelete ? (
          /* Inline delete confirmation */
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <span className="text-[10px] text-red-400 mr-0.5">¿Eliminar?</span>
            <button
              onClick={handleConfirmDelete}
              className="rounded p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
              title="Confirmar eliminación"
            >
              <Check size={13} />
            </button>
            <button
              onClick={handleCancelDelete}
              className="rounded p-1 text-gray-500 hover:text-gray-300 hover:bg-white/10 transition-colors"
              title="Cancelar"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="rounded p-1 text-gray-500 hover:text-gray-200 hover:bg-white/10 transition-colors"
              title="Copiar código"
            >
              {copied ? (
                <Check size={13} className="text-green-400" />
              ) : (
                <Clipboard size={13} />
              )}
            </button>
            <button
              onClick={handleEditClick}
              className="rounded p-1 text-gray-500 hover:text-blue-300 hover:bg-blue-500/20 transition-colors"
              title="Editar snippet"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={handleDeleteClick}
              className="rounded p-1 text-gray-500 hover:text-red-300 hover:bg-red-500/20 transition-colors"
              title="Eliminar snippet"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {isExpanded && snippet.code && (
        <div className="px-3 pb-2">
          <pre className="max-h-48 overflow-y-auto rounded bg-black/40 border border-white/10 p-2 text-[11px] font-mono text-gray-300 whitespace-pre-wrap break-all">
            <code>{snippet.code}</code>
          </pre>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// SnippetForm — shared for create (POST) and edit (PATCH)
// ---------------------------------------------------------------------------
const EMPTY_FORM = { title: "", language: "other", code: "", description: "", tags: "" }

function snippetToForm(s: Snippet) {
  return {
    title: s.title,
    language: s.language,
    code: s.code,
    description: s.description ?? "",
    tags: s.tags?.join(", ") ?? "",
  }
}

function SnippetForm({
  editSnippet,
  onCancel,
  onSaved,
  accessToken,
  tenantSlug,
}: {
  editSnippet: Snippet | null
  onCancel: () => void
  onSaved: (snippet: Snippet, isEdit: boolean) => void
  accessToken: string
  tenantSlug: string
}) {
  const isEdit = editSnippet !== null
  const [form, setForm]                 = useState(isEdit ? snippetToForm(editSnippet!) : EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError]       = useState<string | null>(null)

  function setField(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.code.trim()) return

    setIsSubmitting(true)
    setFormError(null)

    const apiBase = import.meta.env.VITE_API_URL ?? "http://rbac.local.test"
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    const url = isEdit
      ? `${apiBase}/api/v1/app/snippets/${editSnippet!.id}/`
      : `${apiBase}/api/v1/app/snippets/`

    try {
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Tenant-Slug": tenantSlug,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title.trim(),
          code: form.code.trim(),
          language: form.language,
          description: form.description.trim(),
          tags,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const msg = body?.detail ?? body?.title?.[0] ?? body?.code?.[0] ?? `HTTP ${res.status}`
        throw new Error(msg)
      }

      const saved: Snippet = await res.json()
      onSaved(saved, isEdit)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar snippet")
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = form.title.trim() && form.code.trim() && !isSubmitting

  const inputCls =
    "w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/25 transition-colors"

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 border-b border-white/10 px-3 py-3 space-y-2"
    >
      {/* Form title indicator */}
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {isEdit ? "Editar snippet" : "Nuevo snippet"}
      </p>

      <input
        type="text"
        value={form.title}
        onChange={(e) => setField("title", e.target.value)}
        placeholder="Título del snippet *"
        maxLength={255}
        required
        className={inputCls}
        autoFocus
      />

      <select
        value={form.language}
        onChange={(e) => setField("language", e.target.value)}
        className={inputCls + " cursor-pointer"}
      >
        {LANGUAGES.map((l) => (
          <option key={l} value={l} className="bg-gray-900">
            {l}
          </option>
        ))}
      </select>

      <textarea
        value={form.code}
        onChange={(e) => setField("code", e.target.value)}
        placeholder="// código aquí *"
        rows={4}
        required
        className={inputCls + " font-mono resize-none"}
      />

      <input
        type="text"
        value={form.description}
        onChange={(e) => setField("description", e.target.value)}
        placeholder="Descripción (opcional)"
        className={inputCls}
      />

      <input
        type="text"
        value={form.tags}
        onChange={(e) => setField("tags", e.target.value)}
        placeholder="tag1, tag2 (opcional)"
        className={inputCls}
      />

      {formError && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle size={11} />
          {formError}
        </p>
      )}

      <div className="flex gap-2 pt-0.5">
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex-1 flex items-center justify-center gap-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-medium text-white transition-colors"
        >
          {isSubmitting && <Loader2 size={12} className="animate-spin" />}
          {isEdit ? "Guardar cambios" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 px-3 py-1.5 text-xs text-gray-300 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// SnippetsPanel
// ---------------------------------------------------------------------------
export default function SnippetsPanel() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const accessToken     = useAuthStore((s) => s.accessToken)
  const tenantSlug      = useAuthStore((s) => s.tenant?.slug)

  const [snippets, setSnippets]     = useState<Snippet[]>([])
  const [isLoading, setIsLoading]   = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [search, setSearch]         = useState("")
  const [activeLang, setActiveLang] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  // null = closed, undefined = new, Snippet = edit mode
  const [formTarget, setFormTarget] = useState<Snippet | null | undefined>(undefined)

  const showForm = formTarget !== undefined

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
          "X-Tenant-Slug": tenantSlug,
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
      setFormTarget(undefined)
    }
  }, [isAuthenticated, fetchSnippets])

  function handleSaved(snippet: Snippet, isEdit: boolean) {
    if (isEdit) {
      setSnippets((prev) => prev.map((s) => (s.id === snippet.id ? snippet : s)))
    } else {
      setSnippets((prev) => [snippet, ...prev])
    }
    setFormTarget(undefined)
  }

  async function handleDelete(id: string) {
    if (!accessToken || !tenantSlug) return
    const apiBase = import.meta.env.VITE_API_URL ?? "http://rbac.local.test"
    try {
      const res = await fetch(`${apiBase}/api/v1/app/snippets/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Tenant-Slug": tenantSlug,
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setSnippets((prev) => prev.filter((s) => s.id !== id))
      if (expandedId === id) setExpandedId(null)
    } catch (err) {
      console.error("[SnippetsPanel] delete error:", err)
    }
  }

  function openNewForm() {
    setFormTarget(null)
  }

  function openEditForm(snippet: Snippet) {
    setExpandedId(null)
    setFormTarget(snippet)
  }

  function closeForm() {
    setFormTarget(undefined)
  }

  function toggleFormOrClose() {
    if (showForm) {
      closeForm()
    } else {
      openNewForm()
    }
  }

  // Unique languages for filter pills
  const languages = useMemo(() => {
    return [...new Set(snippets.map((s) => s.language.toLowerCase()))].sort()
  }, [snippets])

  // Filtered list
  const filtered = useMemo(() => {
    let list = snippets
    if (activeLang) {
      list = list.filter((s) => s.language.toLowerCase() === activeLang)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.language.toLowerCase().includes(q) ||
          s.tags?.some((t) => t.toLowerCase().includes(q))
      )
    }
    return list
  }, [snippets, activeLang, search])

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

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
      {/* Header */}
      <header className="shrink-0 border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-100">Snippets</h2>
          <div className="flex items-center gap-1">
            {!isLoading && !error && (
              <span className="text-xs text-gray-500 mr-1">{filtered.length}</span>
            )}
            <button
              onClick={toggleFormOrClose}
              className={`rounded p-1 transition-colors ${
                showForm && formTarget === null
                  ? "text-blue-400 bg-blue-500/20 hover:bg-blue-500/30"
                  : "text-gray-500 hover:text-gray-200 hover:bg-white/10"
              }`}
              title={showForm ? "Cancelar" : "Nuevo snippet"}
            >
              {showForm && formTarget === null ? <X size={13} /> : <Plus size={13} />}
            </button>
            <button
              onClick={fetchSnippets}
              disabled={isLoading}
              className="rounded p-1 text-gray-500 hover:text-gray-200 hover:bg-white/10 transition-colors disabled:opacity-40"
              title="Actualizar"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </header>

      {/* Create / Edit form */}
      {showForm && accessToken && tenantSlug && (
        <SnippetForm
          editSnippet={formTarget ?? null}
          accessToken={accessToken}
          tenantSlug={tenantSlug}
          onCancel={closeForm}
          onSaved={handleSaved}
        />
      )}

      {/* Search + language filters */}
      {!isLoading && !error && snippets.length > 0 && (
        <div className="shrink-0 border-b border-white/10 px-3 py-2 space-y-2">
          <div className="relative flex items-center">
            <Search size={12} className="absolute left-2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar snippets…"
              className="w-full rounded bg-white/5 border border-white/10 pl-6 pr-6 py-1 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/20 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-1.5 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X size={11} />
              </button>
            )}
          </div>

          {languages.length >= 2 && (
            <div className="flex flex-wrap gap-1">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLang((prev) => (prev === lang ? null : lang))}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase transition-colors ${
                    activeLang === lang
                      ? langColor(lang) + " ring-1 ring-white/30"
                      : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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
          <button
            onClick={openNewForm}
            className="rounded-md bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 text-xs text-blue-300 hover:bg-blue-600/30 transition-colors"
          >
            Crear primer snippet
          </button>
        </div>
      )}

      {!isLoading && !error && snippets.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-8 text-center">
          <Search size={24} className="text-gray-600" />
          <p className="text-sm text-gray-400">Sin resultados</p>
        </div>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.map((snippet) => (
            <SnippetItem
              key={snippet.id}
              snippet={snippet}
              isExpanded={expandedId === snippet.id}
              onToggleExpand={() => toggleExpand(snippet.id)}
              onEdit={() => openEditForm(snippet)}
              onDelete={() => handleDelete(snippet.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
