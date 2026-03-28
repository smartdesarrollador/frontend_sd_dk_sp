import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Lock, Bookmark, AlertCircle,
  Search, X, ChevronDown, ChevronRight, RefreshCw,
  Plus, Loader2, Pencil, Trash2, Check,
  Globe, Tag, ExternalLink,
} from "lucide-react"
import { useAuthStore } from "../../store/authStore"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface BookmarkCollection {
  id: string
  name: string
  color: string
}

interface BookmarkItem {
  id: string
  url: string
  title: string
  description: string
  tags: string[]
  favicon_url: string
  collection: string | null          // UUID
  collection_name: string | null     // read-only derived
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

function CollectionBadge({ name, color }: { name: string; color: string }) {
  return (
    <span className="flex items-center gap-1 shrink-0">
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color || "#6b7280" }}
      />
      <span className="text-[10px] text-gray-400 truncate max-w-[80px]">{name}</span>
    </span>
  )
}

// ---------------------------------------------------------------------------
// BookmarkItem
// ---------------------------------------------------------------------------
function BookmarkItemRow({
  bookmark,
  collections,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: {
  bookmark: BookmarkItem
  collections: BookmarkCollection[]
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [faviconError, setFaviconError]   = useState(false)

  const collection = collections.find((c) => c.id === bookmark.collection) ?? null
  const domain     = getDomain(bookmark.url)

  function stop(e: React.MouseEvent) { e.stopPropagation() }

  function handleOpenUrl(e: React.MouseEvent) {
    stop(e)
    window.open(bookmark.url, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="rounded-md overflow-hidden">
      {/* Main row */}
      <div
        className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 cursor-pointer group"
        onClick={onToggleExpand}
      >
        {/* Chevron */}
        <span className="shrink-0 text-gray-600 group-hover:text-gray-400 transition-colors">
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>

        {/* Favicon */}
        <div className="shrink-0 h-5 w-5 flex items-center justify-center">
          {bookmark.favicon_url && !faviconError ? (
            <img
              src={bookmark.favicon_url}
              alt=""
              className="h-4 w-4 rounded-sm object-contain"
              onError={() => setFaviconError(true)}
            />
          ) : (
            <Globe size={13} className="text-gray-600" />
          )}
        </div>

        {/* Title + domain */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-100">{bookmark.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="truncate text-xs text-gray-500 flex-1">{domain}</p>
            {collection && (
              <CollectionBadge name={collection.name} color={collection.color} />
            )}
          </div>
        </div>

        {/* Actions */}
        {confirmDelete ? (
          <div className="flex items-center gap-1 shrink-0" onClick={stop}>
            <span className="text-[10px] text-red-400 mr-0.5">¿Eliminar?</span>
            <button
              onClick={(e) => { stop(e); setConfirmDelete(false); onDelete() }}
              className="rounded p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
              title="Confirmar"
            >
              <Check size={13} />
            </button>
            <button
              onClick={(e) => { stop(e); setConfirmDelete(false) }}
              className="rounded p-1 text-gray-500 hover:text-gray-300 hover:bg-white/10 transition-colors"
              title="Cancelar"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleOpenUrl}
              className="rounded p-1 text-gray-500 hover:text-green-300 hover:bg-green-500/20 transition-colors"
              title="Abrir URL"
            >
              <ExternalLink size={13} />
            </button>
            <button
              onClick={(e) => { stop(e); onEdit() }}
              className="rounded p-1 text-gray-500 hover:text-blue-300 hover:bg-blue-500/20 transition-colors"
              title="Editar bookmark"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={(e) => { stop(e); setConfirmDelete(true) }}
              className="rounded p-1 text-gray-500 hover:text-red-300 hover:bg-red-500/20 transition-colors"
              title="Eliminar bookmark"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-3 pb-2">
          <div className="rounded bg-black/30 border border-white/10 p-2 space-y-2 text-xs">
            {/* Full URL */}
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={stop}
              className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors truncate"
            >
              <ExternalLink size={10} className="shrink-0" />
              <span className="truncate">{bookmark.url}</span>
            </a>

            {/* Description */}
            {bookmark.description && (
              <p className="text-gray-400 leading-relaxed border-t border-white/10 pt-1.5">
                {bookmark.description}
              </p>
            )}

            {/* Tags */}
            {bookmark.tags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap border-t border-white/10 pt-1.5">
                <Tag size={10} className="text-gray-600 shrink-0" />
                {bookmark.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-gray-400"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function BookmarksSkeleton() {
  return (
    <div className="flex flex-col gap-1 px-3 py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 py-2 animate-pulse">
          <div className="h-5 w-5 shrink-0 rounded bg-white/10" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-3/4 rounded bg-white/10" />
            <div className="h-2.5 w-1/2 rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// BookmarkForm — create (POST) and edit (PATCH)
// ---------------------------------------------------------------------------
const EMPTY_FORM = {
  url:         "",
  title:       "",
  description: "",
  collection:  "",
  tags:        "",
  favicon_url: "",
}

function bookmarkToForm(b: BookmarkItem) {
  return {
    url:         b.url,
    title:       b.title,
    description: b.description ?? "",
    collection:  b.collection ?? "",
    tags:        b.tags?.join(", ") ?? "",
    favicon_url: b.favicon_url ?? "",
  }
}

function BookmarkForm({
  editBookmark,
  collections,
  onCancel,
  onSaved,
  accessToken,
  tenantSlug,
}: {
  editBookmark: BookmarkItem | null
  collections: BookmarkCollection[]
  onCancel: () => void
  onSaved: (bookmark: BookmarkItem, isEdit: boolean) => void
  accessToken: string
  tenantSlug: string
}) {
  const isEdit = editBookmark !== null
  const [form, setForm]                 = useState(isEdit ? bookmarkToForm(editBookmark!) : EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError]       = useState<string | null>(null)

  function setField<K extends keyof typeof EMPTY_FORM>(field: K, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.url.trim() || !form.title.trim()) return

    setIsSubmitting(true)
    setFormError(null)

    const apiBase = import.meta.env.VITE_API_URL ?? "http://rbac.local.test"
    const url     = isEdit
      ? `${apiBase}/api/v1/app/bookmarks/${editBookmark!.id}/`
      : `${apiBase}/api/v1/app/bookmarks/`

    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    try {
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          Authorization:   `Bearer ${accessToken}`,
          "X-Tenant-Slug": tenantSlug,
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({
          url:         form.url.trim(),
          title:       form.title.trim(),
          description: form.description.trim(),
          collection:  form.collection || null,
          tags,
          favicon_url: form.favicon_url.trim() || "",
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const msg =
          body?.detail ??
          body?.url?.[0] ??
          body?.title?.[0] ??
          `HTTP ${res.status}`
        throw new Error(msg)
      }

      const saved: BookmarkItem = await res.json()
      onSaved(saved, isEdit)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar bookmark")
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = form.url.trim() && form.title.trim() && !isSubmitting

  const inputCls =
    "w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/25 transition-colors"

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 border-b border-white/10 px-3 py-3 space-y-2"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {isEdit ? "Editar bookmark" : "Nuevo bookmark"}
      </p>

      {/* URL */}
      <input
        type="url"
        value={form.url}
        onChange={(e) => setField("url", e.target.value)}
        placeholder="https://ejemplo.com *"
        required
        className={inputCls + " font-mono"}
        autoFocus
      />

      {/* Title */}
      <input
        type="text"
        value={form.title}
        onChange={(e) => setField("title", e.target.value)}
        placeholder="Título *"
        maxLength={255}
        required
        className={inputCls}
      />

      {/* Collection */}
      <select
        value={form.collection}
        onChange={(e) => setField("collection", e.target.value)}
        className={inputCls + " cursor-pointer"}
      >
        <option value="" className="bg-gray-900">Sin colección</option>
        {collections.map((c) => (
          <option key={c.id} value={c.id} className="bg-gray-900">
            {c.name}
          </option>
        ))}
      </select>

      {/* Description */}
      <textarea
        value={form.description}
        onChange={(e) => setField("description", e.target.value)}
        placeholder="Descripción (opcional)"
        rows={2}
        className={inputCls + " resize-none"}
      />

      {/* Tags */}
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
          {isEdit ? "Guardar cambios" : "Guardar bookmark"}
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
// BookmarksPanel
// ---------------------------------------------------------------------------
export default function BookmarksPanel() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const accessToken     = useAuthStore((s) => s.accessToken)
  const tenantSlug      = useAuthStore((s) => s.tenant?.slug)

  const [bookmarks, setBookmarks]   = useState<BookmarkItem[]>([])
  const [collections, setCollections] = useState<BookmarkCollection[]>([])
  const [isLoading, setIsLoading]   = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [search, setSearch]         = useState("")
  const [activeCollection, setActiveCollection] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  // undefined = closed | null = new | BookmarkItem = edit
  const [formTarget, setFormTarget] = useState<BookmarkItem | null | undefined>(undefined)

  const showForm = formTarget !== undefined
  const apiBase  = import.meta.env.VITE_API_URL ?? "http://rbac.local.test"

  const fetchCollections = useCallback(async () => {
    if (!accessToken || !tenantSlug) return
    try {
      const res = await fetch(`${apiBase}/api/v1/app/bookmarks/collections/`, {
        headers: {
          Authorization:   `Bearer ${accessToken}`,
          "X-Tenant-Slug": tenantSlug,
        },
      })
      if (!res.ok) return
      const data = await res.json()
      setCollections(data.collections ?? data.results ?? [])
    } catch {
      // silent — collections are optional UI enhancement
    }
  }, [accessToken, tenantSlug, apiBase])

  const fetchBookmarks = useCallback(async () => {
    if (!accessToken || !tenantSlug) {
      console.warn("[BookmarksPanel] fetchBookmarks called without accessToken or tenantSlug")
      return
    }
    setIsLoading(true)
    setError(null)

    console.log("[BookmarksPanel] fetching →", `${apiBase}/api/v1/app/bookmarks/`)

    try {
      const res = await fetch(`${apiBase}/api/v1/app/bookmarks/`, {
        headers: {
          Authorization:   `Bearer ${accessToken}`,
          "X-Tenant-Slug": tenantSlug,
        },
      })
      console.log("[BookmarksPanel] response status:", res.status, res.statusText)

      if (!res.ok) {
        const body = await res.text().catch(() => "(sin body)")
        console.error("[BookmarksPanel] HTTP error body:", body)
        throw new Error(`HTTP ${res.status} ${res.statusText}`)
      }

      const data = await res.json()
      const list: BookmarkItem[] = data.bookmarks ?? data.results ?? []
      console.log("[BookmarksPanel] bookmarks count:", list.length)
      setBookmarks(list)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cargar bookmarks"
      console.error("[BookmarksPanel] fetch error:", err)
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, tenantSlug, apiBase])

  useEffect(() => {
    if (isAuthenticated) {
      fetchCollections()
      fetchBookmarks()
    } else {
      setBookmarks([])
      setCollections([])
      setError(null)
      setFormTarget(undefined)
    }
  }, [isAuthenticated, fetchCollections, fetchBookmarks])

  function handleSaved(bookmark: BookmarkItem, isEdit: boolean) {
    if (isEdit) {
      setBookmarks((prev) => prev.map((b) => (b.id === bookmark.id ? bookmark : b)))
    } else {
      setBookmarks((prev) => [bookmark, ...prev])
    }
    setFormTarget(undefined)
  }

  async function handleDelete(id: string) {
    if (!accessToken || !tenantSlug) return
    try {
      const res = await fetch(`${apiBase}/api/v1/app/bookmarks/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization:   `Bearer ${accessToken}`,
          "X-Tenant-Slug": tenantSlug,
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setBookmarks((prev) => prev.filter((b) => b.id !== id))
      if (expandedId === id) setExpandedId(null)
    } catch (err) {
      console.error("[BookmarksPanel] delete error:", err)
    }
  }

  function toggleFormOrClose() {
    setFormTarget((prev) => (prev !== undefined ? undefined : null))
  }

  // Collections present in the current bookmark list
  const presentCollections = useMemo(() => {
    const ids = new Set(bookmarks.map((b) => b.collection).filter(Boolean))
    return collections.filter((c) => ids.has(c.id))
  }, [bookmarks, collections])

  // Filtered list
  const filtered = useMemo(() => {
    let list = bookmarks
    if (activeCollection) {
      list = list.filter((b) => b.collection === activeCollection)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q) ||
          b.tags?.some((t) => t.toLowerCase().includes(q))
      )
    }
    return list
  }, [bookmarks, activeCollection, search])

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <Lock size={32} className="text-gray-600" />
        <p className="text-sm text-gray-400">Inicia sesión para ver tus bookmarks</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-100">Bookmarks</h2>
          <div className="flex items-center gap-1">
            {!isLoading && !error && bookmarks.length > 0 && (
              <span className="text-xs text-gray-500 mr-1">{filtered.length}</span>
            )}
            <button
              onClick={toggleFormOrClose}
              className={`rounded p-1 transition-colors ${
                showForm && formTarget === null
                  ? "text-blue-400 bg-blue-500/20 hover:bg-blue-500/30"
                  : "text-gray-500 hover:text-gray-200 hover:bg-white/10"
              }`}
              title={showForm ? "Cancelar" : "Nuevo bookmark"}
            >
              {showForm && formTarget === null ? <X size={13} /> : <Plus size={13} />}
            </button>
            <button
              onClick={fetchBookmarks}
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
        <BookmarkForm
          editBookmark={formTarget ?? null}
          collections={collections}
          accessToken={accessToken}
          tenantSlug={tenantSlug}
          onCancel={() => setFormTarget(undefined)}
          onSaved={handleSaved}
        />
      )}

      {/* Search + collection filter pills */}
      {!isLoading && !error && bookmarks.length > 0 && (
        <div className="shrink-0 border-b border-white/10 px-3 py-2 space-y-2">
          <div className="relative flex items-center">
            <Search size={12} className="absolute left-2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar bookmarks…"
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

          {presentCollections.length >= 2 && (
            <div className="flex flex-wrap gap-1">
              {presentCollections.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCollection((prev) => (prev === c.id ? null : c.id))}
                  className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                    activeCollection === c.id
                      ? "bg-white/10 text-gray-200 ring-1 ring-white/20"
                      : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
                  }`}
                >
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: c.color || "#6b7280" }}
                  />
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isLoading && <BookmarksSkeleton />}

      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <AlertCircle size={28} className="text-red-400" />
          <p className="text-sm text-gray-400">{error}</p>
          <p className="text-[10px] text-gray-600 font-mono break-all">
            {apiBase}/api/v1/app/bookmarks/
          </p>
          <button
            onClick={fetchBookmarks}
            className="rounded-md bg-white/10 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/20 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !error && bookmarks.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <Bookmark size={32} className="text-gray-600" />
          <p className="text-sm text-gray-400">No tienes bookmarks aún</p>
          <button
            onClick={() => setFormTarget(null)}
            className="rounded-md bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 text-xs text-blue-300 hover:bg-blue-600/30 transition-colors"
          >
            Crear primer bookmark
          </button>
        </div>
      )}

      {!isLoading && !error && bookmarks.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-8 text-center">
          <Search size={24} className="text-gray-600" />
          <p className="text-sm text-gray-400">Sin resultados</p>
        </div>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.map((bookmark) => (
            <BookmarkItemRow
              key={bookmark.id}
              bookmark={bookmark}
              collections={collections}
              isExpanded={expandedId === bookmark.id}
              onToggleExpand={() => toggleExpand(bookmark.id)}
              onEdit={() => { setExpandedId(null); setFormTarget(bookmark) }}
              onDelete={() => handleDelete(bookmark.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
