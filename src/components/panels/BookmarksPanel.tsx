import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  Lock, Bookmark, AlertCircle,
  Search, X, ChevronDown, ChevronRight, RefreshCw,
  Plus, Loader2, Pencil, Trash2, Check,
  Globe, Tag, ExternalLink, Clipboard, Copy, FolderOpen,
} from "lucide-react"
import { useAuthStore } from "../../store/authStore"
import { apiFetch } from "../../lib/apiFetch"
import { openExternal } from "../../lib/openExternal"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface BookmarkCollection {
  id: string
  name: string
  color: string
  bookmarks_count: number
}

interface BookmarkItem {
  id: string
  url: string
  title: string
  description: string
  tags: string[]
  favicon_url: string
  collection: BookmarkCollection | null
  created_at: string
  updated_at: string
}

const COLLECTION_COLOR_PRESETS = [
  "#2563eb", "#16a34a", "#dc2626", "#9333ea",
  "#d97706", "#0891b2", "#db2777", "#65a30d",
]

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

function getFaviconSrc(bookmark: BookmarkItem): string {
  if (bookmark.favicon_url) return bookmark.favicon_url
  try {
    const { hostname } = new URL(bookmark.url)
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
  } catch {
    return ""
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
// BookmarkItemRow
// ---------------------------------------------------------------------------
function BookmarkItemRow({
  bookmark,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: {
  bookmark: BookmarkItem
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copied, setCopied]               = useState(false)
  const [faviconSrc]                      = useState(() => getFaviconSrc(bookmark))
  const [faviconFailed, setFaviconFailed] = useState(!faviconSrc)

  const collection = bookmark.collection
  const domain     = getDomain(bookmark.url)

  function stop(e: React.MouseEvent) { e.stopPropagation() }

  function handleOpenUrl(e: React.MouseEvent) {
    stop(e)
    openExternal(bookmark.url)
  }

  async function handleCopyUrl(e: React.MouseEvent) {
    stop(e)
    await navigator.clipboard.writeText(bookmark.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
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
          {!faviconFailed && faviconSrc ? (
            <img
              src={faviconSrc}
              alt=""
              className="h-4 w-4 rounded-sm object-contain"
              onError={() => setFaviconFailed(true)}
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
              onClick={handleCopyUrl}
              className={`rounded p-1 transition-colors ${
                copied
                  ? "text-green-400"
                  : "text-gray-500 hover:text-teal-300 hover:bg-teal-500/20"
              }`}
              title={copied ? "¡Copiado!" : "Copiar URL"}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
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
            <button
              onClick={(e) => { stop(e); openExternal(bookmark.url) }}
              className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors truncate w-full text-left"
            >
              <ExternalLink size={10} className="shrink-0" />
              <span className="truncate">{bookmark.url}</span>
            </button>

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
    collection:  b.collection?.id ?? "",
    tags:        b.tags?.join(", ") ?? "",
    favicon_url: b.favicon_url ?? "",
  }
}

function BookmarkForm({
  editBookmark,
  collections,
  initialUrl,
  onCancel,
  onSaved,
  tagSuggestions,
}: {
  editBookmark: BookmarkItem | null
  collections: BookmarkCollection[]
  initialUrl?: string
  onCancel: () => void
  onSaved: (bookmark: BookmarkItem, isEdit: boolean) => void
  tagSuggestions: string[]
}) {
  const isEdit = editBookmark !== null
  const [form, setForm]                 = useState(
    isEdit ? bookmarkToForm(editBookmark!) : { ...EMPTY_FORM, url: initialUrl ?? "" }
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError]       = useState<string | null>(null)
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const tagFieldRef = useRef<HTMLDivElement>(null)

  function setField<K extends keyof typeof EMPTY_FORM>(field: K, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Autocomplete: suggestions for the tag segment currently being typed
  // (text after the last comma), excluding tags already present.
  const typedTags = form.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
  const currentSegment = form.tags.split(",").pop()?.trim() ?? ""
  const tagMatches = tagSuggestions.filter((t) => {
    if (typedTags.includes(t.toLowerCase())) return false
    if (!currentSegment) return true
    return t.toLowerCase().includes(currentSegment.toLowerCase())
  })

  function selectTagSuggestion(tag: string) {
    const segments = form.tags.split(",").map((s) => s.trim()).filter(Boolean)
    if (currentSegment) segments.pop()
    segments.push(tag)
    setField("tags", segments.join(", ") + ", ")
    setTagDropdownOpen(false)
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (tagFieldRef.current && !tagFieldRef.current.contains(e.target as Node)) {
        setTagDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.url.trim() || !form.title.trim()) return

    setIsSubmitting(true)
    setFormError(null)

    const path = isEdit
      ? `/api/v1/app/bookmarks/${editBookmark!.id}/`
      : `/api/v1/app/bookmarks/`

    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    try {
      const res = await apiFetch(path, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
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
      <div ref={tagFieldRef} className="relative">
        <input
          type="text"
          value={form.tags}
          onChange={(e) => setField("tags", e.target.value)}
          onFocus={() => setTagDropdownOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setTagDropdownOpen(false)
          }}
          placeholder="tag1, tag2 (opcional)"
          className={inputCls}
          autoComplete="off"
        />
        {tagDropdownOpen && tagMatches.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full max-h-32 overflow-y-auto rounded bg-gray-900 border border-white/10 shadow-lg">
            {tagMatches.map((tag) => (
              <li key={tag}>
                <button
                  type="button"
                  onClick={() => selectTagSuggestion(tag)}
                  className="w-full text-left px-2 py-1 text-xs text-gray-300 hover:bg-white/10 transition-colors"
                >
                  #{tag}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

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
// CollectionManager — inline "gestionar colecciones" section (create/delete),
// same pattern as CategoryManager in NotesPanel.tsx (no modals in this app).
// ---------------------------------------------------------------------------
const collectionInputCls =
  "w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/25 transition-colors"

function CollectionRow({
  collection,
  onDeleted,
}: {
  collection: BookmarkCollection
  onDeleted: (id: string) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleConfirmDelete() {
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/v1/app/bookmarks/collections/${collection.id}/`, { method: "DELETE" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      onDeleted(collection.id)
    } catch (err) {
      console.error("[CollectionManager] delete error:", err)
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div className="flex items-center justify-between rounded bg-white/5 px-2 py-1">
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className="inline-block h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: collection.color || "#6b7280" }}
        />
        <span className="truncate text-xs text-gray-200">{collection.name}</span>
        <span className="shrink-0 text-[10px] text-gray-500">{collection.bookmarks_count} bookmarks</span>
      </div>
      {confirming ? (
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-red-400 mr-0.5">¿Eliminar?</span>
          <button
            onClick={handleConfirmDelete}
            disabled={deleting}
            className="rounded p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors disabled:opacity-40"
            title="Confirmar"
          >
            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={deleting}
            className="rounded p-1 text-gray-500 hover:text-gray-300 hover:bg-white/10 transition-colors"
            title="Cancelar"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="shrink-0 rounded p-1 text-gray-500 hover:text-red-300 hover:bg-red-500/20 transition-colors"
          title={`Eliminar colección ${collection.name}`}
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  )
}

function CollectionManager({
  collections,
  onClose,
  onCreated,
  onDeleted,
}: {
  collections: BookmarkCollection[]
  onClose: () => void
  onCreated: (collection: BookmarkCollection) => void
  onDeleted: (id: string) => void
}) {
  const [name, setName] = useState("")
  const [color, setColor] = useState(COLLECTION_COLOR_PRESETS[0])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setSubmitting(true)
    setError(null)
    try {
      const res = await apiFetch("/api/v1/app/bookmarks/collections/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, color }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const msg = body?.name?.[0] ?? body?.detail ?? `HTTP ${res.status}`
        throw new Error(msg)
      }
      const created: BookmarkCollection = await res.json()
      onCreated(created)
      setName("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la colección")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="shrink-0 border-b border-white/10 px-3 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          <FolderOpen size={11} className="shrink-0" />
          Gestionar colecciones
        </p>
        <button
          onClick={onClose}
          className="shrink-0 rounded p-1 text-gray-500 hover:text-gray-200 hover:bg-white/10 transition-colors"
          title="Cerrar"
        >
          <X size={13} />
        </button>
      </div>

      {collections.length === 0 ? (
        <p className="text-xs text-gray-600 italic">No hay colecciones aún.</p>
      ) : (
        <div className="space-y-1">
          {collections.map((c) => (
            <CollectionRow key={c.id} collection={c} onDeleted={onDeleted} />
          ))}
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-1.5 pt-1 border-t border-white/10">
        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertCircle size={11} className="shrink-0" />
            {error}
          </p>
        )}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de la colección"
          maxLength={100}
          className={collectionInputCls}
        />
        <div className="flex items-center gap-1.5">
          {COLLECTION_COLOR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setColor(preset)}
              title={preset}
              className={`h-4 w-4 rounded-full transition-transform hover:scale-110 ${
                color === preset ? "ring-2 ring-offset-1 ring-offset-gray-900 ring-white/70" : ""
              }`}
              style={{ backgroundColor: preset }}
            />
          ))}
        </div>
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="w-full flex items-center justify-center gap-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-medium text-white transition-colors"
        >
          {submitting && <Loader2 size={12} className="animate-spin" />}
          Agregar colección
        </button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// BookmarksPanel
// ---------------------------------------------------------------------------
export default function BookmarksPanel() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [bookmarks, setBookmarks]     = useState<BookmarkItem[]>([])
  const [collections, setCollections] = useState<BookmarkCollection[]>([])
  const [isLoading, setIsLoading]     = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [search, setSearch]           = useState("")
  const [activeCollection, setActiveCollection] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [expandedId, setExpandedId]   = useState<string | null>(null)
  // undefined = closed | null = new | BookmarkItem = edit
  const [formTarget, setFormTarget]   = useState<BookmarkItem | null | undefined>(undefined)
  const [clipboardUrl, setClipboardUrl]       = useState<string | null>(null)
  const [pasteInitialUrl, setPasteInitialUrl] = useState<string>("")
  const [showCollectionManager, setShowCollectionManager] = useState(false)

  const showForm = formTarget !== undefined

  const fetchCollections = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const res = await apiFetch("/api/v1/app/bookmarks/collections/")
      if (!res.ok) return
      const data = await res.json()
      setCollections(data.collections ?? data.results ?? [])
    } catch {
      // silent — collections are optional UI enhancement
    }
  }, [isAuthenticated])

  const fetchBookmarks = useCallback(async () => {
    if (!isAuthenticated) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiFetch("/api/v1/app/bookmarks/")
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`)
      }
      const data = await res.json()
      setBookmarks(data.bookmarks ?? data.results ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar bookmarks")
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      fetchCollections()
      fetchBookmarks()
    } else {
      setBookmarks([])
      setCollections([])
      setError(null)
      setFormTarget(undefined)
      setClipboardUrl(null)
    }
  }, [isAuthenticated, fetchCollections, fetchBookmarks])

  // Detect URL in clipboard and offer quick-add button
  useEffect(() => {
    if (!isAuthenticated) return
    navigator.clipboard.readText()
      .then((text) => {
        const t = text.trim()
        if (/^https?:\/\/.+/.test(t)) setClipboardUrl(t)
      })
      .catch(() => {})
  }, [isAuthenticated])

  function handleSaved(bookmark: BookmarkItem, isEdit: boolean) {
    if (isEdit) {
      setBookmarks((prev) => prev.map((b) => (b.id === bookmark.id ? bookmark : b)))
    } else {
      setBookmarks((prev) => [bookmark, ...prev])
    }
    setFormTarget(undefined)
  }

  async function handleDelete(id: string) {
    try {
      const res = await apiFetch(`/api/v1/app/bookmarks/${id}/`, { method: "DELETE" })
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

  function handleCollectionCreated(collection: BookmarkCollection) {
    setCollections((prev) => [...prev, collection])
  }

  function handleCollectionDeleted(id: string) {
    setCollections((prev) => prev.filter((c) => c.id !== id))
    if (activeCollection === id) setActiveCollection(null)
    // Bookmarks that referenced this collection are set to null server-side (SET_NULL) —
    // resync from the server instead of patching local state by hand.
    fetchBookmarks()
  }

  // Collections present in the current bookmark list
  const presentCollections = useMemo(() => {
    const ids = new Set(bookmarks.map((b) => b.collection?.id).filter(Boolean))
    return collections.filter((c) => ids.has(c.id))
  }, [bookmarks, collections])

  // Distinct tags present in the list (used for both the tag filter and
  // the tag autocomplete in BookmarkForm — no separate API call needed).
  const allTags = useMemo(() => {
    const set = new Set<string>()
    bookmarks.forEach((b) => b.tags?.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [bookmarks])

  // Filtered list
  const filtered = useMemo(() => {
    let list = bookmarks
    if (activeCollection) {
      list = list.filter((b) => b.collection?.id === activeCollection)
    }
    if (activeTag) {
      list = list.filter((b) => b.tags?.includes(activeTag))
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
  }, [bookmarks, activeCollection, activeTag, search])

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
            {/* Clipboard paste button */}
            {clipboardUrl && !showForm && (
              <button
                onClick={() => {
                  setPasteInitialUrl(clipboardUrl)
                  setClipboardUrl(null)
                  setFormTarget(null)
                }}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
                title={clipboardUrl}
              >
                <Clipboard size={11} />
                Pegar URL
              </button>
            )}
            <button
              onClick={() => setShowCollectionManager((prev) => !prev)}
              className={`rounded p-1 transition-colors ${
                showCollectionManager
                  ? "text-blue-400 bg-blue-500/20 hover:bg-blue-500/30"
                  : "text-gray-500 hover:text-gray-200 hover:bg-white/10"
              }`}
              title="Gestionar colecciones"
            >
              <FolderOpen size={13} />
            </button>
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

      {/* Collection manager */}
      {showCollectionManager && (
        <CollectionManager
          collections={collections}
          onClose={() => setShowCollectionManager(false)}
          onCreated={handleCollectionCreated}
          onDeleted={handleCollectionDeleted}
        />
      )}

      {/* Create / Edit form */}
      {showForm && (
        <BookmarkForm
          editBookmark={formTarget ?? null}
          collections={collections}
          initialUrl={pasteInitialUrl}
          onCancel={() => { setFormTarget(undefined); setPasteInitialUrl("") }}
          onSaved={(bm, isEdit) => { handleSaved(bm, isEdit); setPasteInitialUrl("") }}
          tagSuggestions={allTags}
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

          {allTags.length >= 2 && (
            <div className="flex flex-wrap gap-1">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag((prev) => (prev === tag ? null : tag))}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                    activeTag === tag
                      ? "bg-teal-900/50 text-teal-300 ring-1 ring-white/30"
                      : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
                  }`}
                >
                  #{tag}
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
