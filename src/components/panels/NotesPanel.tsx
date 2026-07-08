import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Lock, StickyNote, AlertCircle,
  Search, X, ChevronDown, ChevronRight, RefreshCw,
  Plus, Loader2, Pencil, Trash2, Check, Pin, PinOff, Copy,
  Share2, CheckSquare,
} from "lucide-react"
import { useAuthStore } from "../../store/authStore"
import { ShareBlock } from "../shared/ShareBlock"
import { BulkSelectBar } from "../shared/BulkSelectBar"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type NoteCategory = "work" | "personal" | "ideas" | "archive"

interface Note {
  id: string
  title: string
  content: string
  category: NoteCategory
  is_pinned: boolean
  color: string
  tags: string[]
  is_shared: boolean
  shared_by_name: string | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CATEGORIES: { value: NoteCategory; label: string }[] = [
  { value: "work",     label: "Trabajo"  },
  { value: "personal", label: "Personal" },
  { value: "ideas",    label: "Ideas"    },
  { value: "archive",  label: "Archivo"  },
]

const CATEGORY_STYLES: Record<NoteCategory, string> = {
  work:     "bg-blue-900/50 text-blue-300",
  personal: "bg-green-900/50 text-green-300",
  ideas:    "bg-yellow-900/40 text-yellow-300",
  archive:  "bg-gray-700/60 text-gray-400",
}

const CATEGORY_LABELS: Record<NoteCategory, string> = {
  work:     "Trabajo",
  personal: "Personal",
  ideas:    "Ideas",
  archive:  "Archivo",
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

// ---------------------------------------------------------------------------
// NoteItem
// ---------------------------------------------------------------------------
function NoteItem({
  note,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onTogglePin,
  onShare,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: {
  note: Note
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
  onTogglePin: () => void
  onShare: () => void
  selectionMode?: boolean
  selected?: boolean
  onToggleSelect?: (id: string) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copied, setCopied] = useState(false)

  function stop(e: React.MouseEvent) { e.stopPropagation() }

  function handleEditClick(e: React.MouseEvent) {
    stop(e); onEdit()
  }
  function handleDeleteClick(e: React.MouseEvent) {
    stop(e); setConfirmDelete(true)
  }
  function handleConfirmDelete(e: React.MouseEvent) {
    stop(e); setConfirmDelete(false); onDelete()
  }
  function handleCancelDelete(e: React.MouseEvent) {
    stop(e); setConfirmDelete(false)
  }
  function handlePinClick(e: React.MouseEvent) {
    stop(e); onTogglePin()
  }
  function handleShareClick(e: React.MouseEvent) {
    stop(e); onShare()
  }
  async function handleCopy(e: React.MouseEvent) {
    stop(e)
    if (!note.content) return
    await navigator.clipboard.writeText(note.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={`rounded-md overflow-hidden ${note.is_pinned ? "bg-white/[0.03]" : ""} ${selected ? "ring-1 ring-blue-500/50 bg-blue-500/5" : ""}`}>
      {/* Main row */}
      <div
        className="flex items-start gap-2 px-3 py-2 hover:bg-white/5 cursor-pointer group"
        onClick={selectionMode ? () => onToggleSelect?.(note.id) : onToggleExpand}
      >
        {/* Chevron / checkbox */}
        {selectionMode ? (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect?.(note.id)}
            onClick={stop}
            className="shrink-0 mt-0.5 h-3 w-3 rounded accent-blue-500"
          />
        ) : (
          <span className="shrink-0 mt-0.5 text-gray-600 group-hover:text-gray-400 transition-colors">
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {note.is_pinned && (
              <Pin size={10} className="shrink-0 text-yellow-400" />
            )}
            <p className="truncate text-sm font-medium text-gray-100">{note.title}</p>
            {note.is_shared && (
              <span
                className="shrink-0 inline-flex"
                title={note.shared_by_name ? `Compartida por ${note.shared_by_name}` : "Compartida contigo"}
              >
                <Share2 size={10} className="text-indigo-400" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${CATEGORY_STYLES[note.category]}`}>
              {CATEGORY_LABELS[note.category]}
            </span>
            {note.content && !isExpanded && (
              <p className="truncate text-xs text-gray-500 flex-1">{note.content}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        {selectionMode ? null : confirmDelete ? (
          <div className="flex items-center gap-1 shrink-0" onClick={stop}>
            <span className="text-[10px] text-red-400 mr-0.5">¿Eliminar?</span>
            <button
              onClick={handleConfirmDelete}
              className="rounded p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
              title="Confirmar"
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
              onClick={handlePinClick}
              className={`rounded p-1 transition-colors ${
                note.is_pinned
                  ? "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20"
                  : "text-gray-500 hover:text-yellow-300 hover:bg-yellow-500/20"
              }`}
              title={note.is_pinned ? "Desfijar" : "Fijar"}
            >
              {note.is_pinned ? <PinOff size={13} /> : <Pin size={13} />}
            </button>
            {note.content && (
              <button
                onClick={handleCopy}
                className={`rounded p-1 transition-colors ${
                  copied
                    ? "text-green-400"
                    : "text-gray-500 hover:text-teal-300 hover:bg-teal-500/20"
                }`}
                title={copied ? "¡Copiado!" : "Copiar contenido"}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
            )}
            <button
              onClick={handleShareClick}
              className="rounded p-1 text-gray-500 hover:text-indigo-300 hover:bg-indigo-500/20 transition-colors"
              title="Compartir nota"
            >
              <Share2 size={13} />
            </button>
            <button
              onClick={handleEditClick}
              className="rounded p-1 text-gray-500 hover:text-blue-300 hover:bg-blue-500/20 transition-colors"
              title="Editar nota"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={handleDeleteClick}
              className="rounded p-1 text-gray-500 hover:text-red-300 hover:bg-red-500/20 transition-colors"
              title="Eliminar nota"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-2">
          <div className="rounded bg-black/30 border border-white/10 p-2 space-y-2">
            {note.content ? (
              <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>
            ) : (
              <p className="text-xs text-gray-600 italic">Sin contenido</p>
            )}
            <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[10px] text-gray-600">
              <span>{formatDate(note.created_at)}</span>
              {note.tags.length > 0 && (
                <span className="text-gray-500">
                  {note.tags.slice(0, 3).map((t) => `#${t}`).join(" ")}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function NotesSkeleton() {
  return (
    <div className="flex flex-col gap-1 px-3 py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-2 py-2 animate-pulse">
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-3/4 rounded bg-white/10" />
            <div className="h-2.5 w-1/2 rounded bg-white/10" />
          </div>
          <div className="h-4 w-14 shrink-0 rounded bg-white/10" />
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// NoteForm — create (POST) and edit (PATCH)
// ---------------------------------------------------------------------------
const EMPTY_FORM = {
  title:     "",
  content:   "",
  category:  "personal" as NoteCategory,
  is_pinned: false,
  tags:      "",
}

function noteToForm(n: Note) {
  return {
    title:     n.title,
    content:   n.content ?? "",
    category:  n.category,
    is_pinned: n.is_pinned,
    tags:      n.tags?.join(", ") ?? "",
  }
}

function NoteForm({
  editNote,
  onCancel,
  onSaved,
  accessToken,
  tenantSlug,
}: {
  editNote: Note | null
  onCancel: () => void
  onSaved: (note: Note, isEdit: boolean) => void
  accessToken: string
  tenantSlug: string
}) {
  const isEdit = editNote !== null
  const [form, setForm]                 = useState(isEdit ? noteToForm(editNote!) : EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError]       = useState<string | null>(null)

  function setField<K extends keyof typeof EMPTY_FORM>(field: K, value: typeof EMPTY_FORM[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return

    setIsSubmitting(true)
    setFormError(null)

    const apiBase = import.meta.env.VITE_API_URL ?? "http://rbac.local.test"
    const url = isEdit
      ? `${apiBase}/api/v1/app/notes/${editNote!.id}/`
      : `${apiBase}/api/v1/app/notes/`

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
          title:     form.title.trim(),
          content:   form.content.trim(),
          category:  form.category,
          is_pinned: form.is_pinned,
          tags,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const msg = body?.detail ?? body?.title?.[0] ?? `HTTP ${res.status}`
        throw new Error(msg)
      }

      const saved: Note = await res.json()
      onSaved(saved, isEdit)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar nota")
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = form.title.trim() && !isSubmitting

  const inputCls =
    "w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/25 transition-colors"

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 border-b border-white/10 px-3 py-3 space-y-2"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {isEdit ? "Editar nota" : "Nueva nota"}
      </p>

      {/* Title */}
      <input
        type="text"
        value={form.title}
        onChange={(e) => setField("title", e.target.value)}
        placeholder="Título de la nota *"
        maxLength={255}
        required
        className={inputCls}
        autoFocus
      />

      {/* Category + Pin (row) */}
      <div className="flex gap-2 items-center">
        <select
          value={form.category}
          onChange={(e) => setField("category", e.target.value as NoteCategory)}
          className={inputCls + " cursor-pointer flex-1"}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value} className="bg-gray-900">
              {c.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 shrink-0 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.is_pinned}
            onChange={(e) => setField("is_pinned", e.target.checked)}
            className="accent-yellow-400 w-3 h-3"
          />
          <Pin size={11} className={form.is_pinned ? "text-yellow-400" : "text-gray-500"} />
          <span className="text-xs text-gray-400">Fijar</span>
        </label>
      </div>

      {/* Content */}
      <textarea
        value={form.content}
        onChange={(e) => setField("content", e.target.value)}
        placeholder="Contenido de la nota…"
        rows={4}
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
          {isEdit ? "Guardar cambios" : "Crear nota"}
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
// NotesPanel
// ---------------------------------------------------------------------------
export default function NotesPanel() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const accessToken     = useAuthStore((s) => s.accessToken)
  const tenantSlug      = useAuthStore((s) => s.tenant?.slug)

  const [notes, setNotes]           = useState<Note[]>([])
  const [isLoading, setIsLoading]   = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [search, setSearch]         = useState("")
  const [activeCategory, setActiveCategory] = useState<NoteCategory | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  // undefined = closed | null = new note | Note = edit mode
  const [formTarget, setFormTarget] = useState<Note | null | undefined>(undefined)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [shareResources, setShareResources] = useState<{ id: string; title: string }[] | null>(null)

  const showForm = formTarget !== undefined

  const fetchNotes = useCallback(async () => {
    if (!accessToken || !tenantSlug) {
      console.warn("[NotesPanel] fetchNotes called without accessToken or tenantSlug")
      return
    }
    setIsLoading(true)
    setError(null)

    const apiBase = import.meta.env.VITE_API_URL ?? "http://rbac.local.test"
    const url = `${apiBase}/api/v1/app/notes/`
    console.log("[NotesPanel] fetching →", url)

    try {
      const res = await fetch(url, {
        headers: {
          Authorization:   `Bearer ${accessToken}`,
          "X-Tenant-Slug": tenantSlug,
        },
      })
      console.log("[NotesPanel] response status:", res.status, res.statusText)

      if (!res.ok) {
        const body = await res.text().catch(() => "(sin body)")
        console.error("[NotesPanel] HTTP error body:", body)
        throw new Error(`HTTP ${res.status} ${res.statusText}`)
      }

      const data = await res.json()
      const list: Note[] = data.notes ?? data.results ?? []
      console.log("[NotesPanel] notes count:", list.length)
      setNotes(list)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cargar notas"
      console.error("[NotesPanel] fetch error:", err)
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, tenantSlug])

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotes()
    } else {
      setNotes([])
      setError(null)
      setFormTarget(undefined)
    }
  }, [isAuthenticated, fetchNotes])

  function handleSaved(note: Note, isEdit: boolean) {
    if (isEdit) {
      setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)))
    } else {
      // Pinned notes go to top, unpinned to after pinned block
      setNotes((prev) => note.is_pinned ? [note, ...prev] : [...prev, note])
    }
    setFormTarget(undefined)
  }

  async function handleDelete(id: string) {
    if (!accessToken || !tenantSlug) return
    const apiBase = import.meta.env.VITE_API_URL ?? "http://rbac.local.test"
    try {
      const res = await fetch(`${apiBase}/api/v1/app/notes/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization:   `Bearer ${accessToken}`,
          "X-Tenant-Slug": tenantSlug,
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setNotes((prev) => prev.filter((n) => n.id !== id))
      if (expandedId === id) setExpandedId(null)
    } catch (err) {
      console.error("[NotesPanel] delete error:", err)
    }
  }

  async function handleTogglePin(note: Note) {
    if (!accessToken || !tenantSlug) return
    const apiBase = import.meta.env.VITE_API_URL ?? "http://rbac.local.test"
    try {
      const res = await fetch(`${apiBase}/api/v1/app/notes/${note.id}/pin/`, {
        method: "PATCH",
        headers: {
          Authorization:   `Bearer ${accessToken}`,
          "X-Tenant-Slug": tenantSlug,
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const updated: Note = await res.json()
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
    } catch (err) {
      console.error("[NotesPanel] pin toggle error:", err)
    }
  }

  function openEditForm(note: Note) {
    setExpandedId(null)
    setFormTarget(note)
  }

  function toggleFormOrClose() {
    setFormTarget((prev) => (prev !== undefined ? undefined : null))
  }

  // Categories present in the list
  const presentCategories = useMemo(() => {
    const set = new Set(notes.map((n) => n.category))
    return CATEGORIES.filter((c) => set.has(c.value))
  }, [notes])

  // Filtered + sorted list (pinned first)
  const filtered = useMemo(() => {
    let list = notes
    if (activeCategory) {
      list = list.filter((n) => n.category === activeCategory)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content?.toLowerCase().includes(q) ||
          n.tags?.some((t) => t.toLowerCase().includes(q))
      )
    }
    // pinned first
    return [...list].sort((a, b) => {
      if (a.is_pinned === b.is_pinned) return 0
      return a.is_pinned ? -1 : 1
    })
  }, [notes, activeCategory, search])

  const pinnedCount = useMemo(() => notes.filter((n) => n.is_pinned).length, [notes])

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  function toggleSelectionMode() {
    setIsSelecting((prev) => !prev)
    setSelectedIds(new Set())
  }

  function toggleSelectId(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleBulkShare() {
    const selected = filtered
      .filter((n) => selectedIds.has(n.id))
      .map((n) => ({ id: n.id, title: n.title }))
    setShareResources(selected)
  }

  function handleCloseShare() {
    setShareResources(null)
    setIsSelecting(false)
    setSelectedIds(new Set())
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <Lock size={32} className="text-gray-600" />
        <p className="text-sm text-gray-400">Inicia sesión para ver tus notas</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-100">Notas</h2>
          <div className="flex items-center gap-1">
            {!isLoading && !error && notes.length > 0 && (
              <span className="text-xs text-gray-500 mr-1">{filtered.length}</span>
            )}
            {!isLoading && !error && notes.length > 0 && (
              <button
                onClick={toggleSelectionMode}
                className={`rounded p-1 transition-colors ${
                  isSelecting
                    ? "text-blue-400 bg-blue-500/20 hover:bg-blue-500/30"
                    : "text-gray-500 hover:text-gray-200 hover:bg-white/10"
                }`}
                title={isSelecting ? "Salir de selección" : "Seleccionar varias"}
              >
                <CheckSquare size={13} />
              </button>
            )}
            <button
              onClick={toggleFormOrClose}
              className={`rounded p-1 transition-colors ${
                showForm && formTarget === null
                  ? "text-blue-400 bg-blue-500/20 hover:bg-blue-500/30"
                  : "text-gray-500 hover:text-gray-200 hover:bg-white/10"
              }`}
              title={showForm ? "Cancelar" : "Nueva nota"}
            >
              {showForm && formTarget === null ? <X size={13} /> : <Plus size={13} />}
            </button>
            <button
              onClick={fetchNotes}
              disabled={isLoading}
              className="rounded p-1 text-gray-500 hover:text-gray-200 hover:bg-white/10 transition-colors disabled:opacity-40"
              title="Actualizar"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Summary */}
        {!isLoading && !error && notes.length > 0 && pinnedCount > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <Pin size={10} className="text-yellow-400" />
            <span className="text-[10px] text-yellow-400/80">{pinnedCount} fijada{pinnedCount !== 1 ? "s" : ""}</span>
          </div>
        )}
      </header>

      {/* Bulk selection bar */}
      {isSelecting && (
        <BulkSelectBar
          count={selectedIds.size}
          onShare={handleBulkShare}
          onCancel={toggleSelectionMode}
        />
      )}

      {/* Share block (single or bulk) */}
      {shareResources && (
        <ShareBlock resourceType="note" resources={shareResources} onClose={handleCloseShare} />
      )}

      {/* Create / Edit form */}
      {showForm && accessToken && tenantSlug && (
        <NoteForm
          editNote={formTarget ?? null}
          accessToken={accessToken}
          tenantSlug={tenantSlug}
          onCancel={() => setFormTarget(undefined)}
          onSaved={handleSaved}
        />
      )}

      {/* Search + category filter */}
      {!isLoading && !error && notes.length > 0 && (
        <div className="shrink-0 border-b border-white/10 px-3 py-2 space-y-2">
          <div className="relative flex items-center">
            <Search size={12} className="absolute left-2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar notas…"
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

          {presentCategories.length >= 2 && (
            <div className="flex flex-wrap gap-1">
              {presentCategories.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setActiveCategory((prev) => (prev === c.value ? null : c.value))}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase transition-colors ${
                    activeCategory === c.value
                      ? CATEGORY_STYLES[c.value] + " ring-1 ring-white/30"
                      : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isLoading && <NotesSkeleton />}

      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <AlertCircle size={28} className="text-red-400" />
          <p className="text-sm text-gray-400">{error}</p>
          <p className="text-[10px] text-gray-600 font-mono break-all">
            {import.meta.env.VITE_API_URL ?? "http://rbac.local.test"}/api/v1/app/notes/
          </p>
          <button
            onClick={fetchNotes}
            className="rounded-md bg-white/10 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/20 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !error && notes.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <StickyNote size={32} className="text-gray-600" />
          <p className="text-sm text-gray-400">No tienes notas aún</p>
          <button
            onClick={() => setFormTarget(null)}
            className="rounded-md bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 text-xs text-blue-300 hover:bg-blue-600/30 transition-colors"
          >
            Crear primera nota
          </button>
        </div>
      )}

      {!isLoading && !error && notes.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-8 text-center">
          <Search size={24} className="text-gray-600" />
          <p className="text-sm text-gray-400">Sin resultados</p>
        </div>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              isExpanded={expandedId === note.id}
              onToggleExpand={() => toggleExpand(note.id)}
              onEdit={() => openEditForm(note)}
              onDelete={() => handleDelete(note.id)}
              onTogglePin={() => handleTogglePin(note)}
              onShare={() => setShareResources([{ id: note.id, title: note.title }])}
              selectionMode={isSelecting}
              selected={selectedIds.has(note.id)}
              onToggleSelect={toggleSelectId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
