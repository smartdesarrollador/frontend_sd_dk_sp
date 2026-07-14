import { useState, useEffect, useMemo, useRef } from "react"
import {
  Lock, StickyNote, AlertCircle,
  Search, X, ChevronDown, ChevronRight, RefreshCw,
  Plus, Loader2, Pencil, Trash2, Check, Pin, PinOff, Copy,
  Share2, CheckSquare, Tag,
} from "lucide-react"
import { useAuthStore } from "../../store/authStore"
import { apiFetch } from "../../lib/apiFetch"
import { ShareBlock } from "../shared/ShareBlock"
import { BulkSelectBar } from "../shared/BulkSelectBar"
import { CATEGORY_COLOR_PRESETS } from "../../features/notes/types"
import type { Note, NoteCategory } from "../../features/notes/types"
import { useNotes } from "../../features/notes/hooks/useNotes"
import { useNoteCategories } from "../../features/notes/hooks/useNoteCategories"
import { useNoteTags } from "../../features/notes/hooks/useNoteTags"
import { useNoteMutations } from "../../features/notes/hooks/useNoteMutations"
import type { NotePayload } from "../../features/notes/hooks/useNoteMutations"
import { useDebouncedValue } from "../../features/search/hooks/useDebouncedValue"
import Pagination from "../shared/Pagination"

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
            {note.category && (
              <span
                className="flex items-center gap-1 rounded px-1.5 py-0.5 shrink-0"
                style={{ backgroundColor: (note.category.color || "#6b7280") + "20" }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: note.category.color || "#6b7280" }}
                />
                <span
                  className="text-[10px] font-semibold uppercase truncate max-w-[80px]"
                  style={{ color: note.category.color || "#9ca3af" }}
                >
                  {note.category.name}
                </span>
              </span>
            )}
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
  category:  "",
  is_pinned: false,
  tags:      "",
}

function noteToForm(n: Note) {
  return {
    title:     n.title,
    content:   n.content ?? "",
    category:  n.category?.id ?? "",
    is_pinned: n.is_pinned,
    tags:      n.tags?.join(", ") ?? "",
  }
}

function NoteForm({
  editNote,
  onCancel,
  onSaved,
  onSubmit,
  categories,
  tagSuggestions,
}: {
  editNote: Note | null
  onCancel: () => void
  onSaved: () => void
  onSubmit: (payload: NotePayload) => Promise<Note>
  categories: NoteCategory[]
  tagSuggestions: string[]
}) {
  const isEdit = editNote !== null
  const [form, setForm]                 = useState(isEdit ? noteToForm(editNote!) : EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError]       = useState<string | null>(null)
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const tagFieldRef = useRef<HTMLDivElement>(null)

  function setField<K extends keyof typeof EMPTY_FORM>(field: K, value: typeof EMPTY_FORM[K]) {
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
    if (!form.title.trim()) return

    setIsSubmitting(true)
    setFormError(null)

    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    try {
      await onSubmit({
        title:     form.title.trim(),
        content:   form.content.trim(),
        category:  form.category || null,
        is_pinned: form.is_pinned,
        tags,
      })
      onSaved()
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
          onChange={(e) => setField("category", e.target.value)}
          className={inputCls + " cursor-pointer flex-1"}
        >
          <option value="" className="bg-gray-900">Sin categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id} className="bg-gray-900">
              {c.name}
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
        rows={6}
        className={inputCls + " resize-y min-h-[80px] max-h-[320px]"}
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
// CategoryManager — inline "gestionar categorías" section (create/delete),
// same visual pattern as ShareBlock (no modals exist in this app).
// ---------------------------------------------------------------------------
const categoryInputCls =
  "w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/25 transition-colors"

function CategoryRow({
  category,
  onDeleted,
}: {
  category: NoteCategory
  onDeleted: (id: string) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleConfirmDelete() {
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/v1/app/notes/categories/${category.id}/`, { method: "DELETE" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      onDeleted(category.id)
    } catch (err) {
      console.error("[CategoryManager] delete error:", err)
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div className="flex items-center justify-between rounded bg-white/5 px-2 py-1">
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className="inline-block h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: category.color || "#6b7280" }}
        />
        <span className="truncate text-xs text-gray-200">{category.name}</span>
        <span className="shrink-0 text-[10px] text-gray-500">{category.notes_count} notas</span>
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
          title={`Eliminar categoría ${category.name}`}
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  )
}

function CategoryManager({
  categories,
  onClose,
  onCreated,
  onDeleted,
}: {
  categories: NoteCategory[]
  onClose: () => void
  onCreated: (category: NoteCategory) => void
  onDeleted: (id: string) => void
}) {
  const [name, setName] = useState("")
  const [color, setColor] = useState(CATEGORY_COLOR_PRESETS[0])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setSubmitting(true)
    setError(null)
    try {
      const res = await apiFetch("/api/v1/app/notes/categories/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, color }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const msg = body?.name?.[0] ?? body?.detail ?? `HTTP ${res.status}`
        throw new Error(msg)
      }
      const created: NoteCategory = await res.json()
      onCreated(created)
      setName("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la categoría")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="shrink-0 border-b border-white/10 px-3 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          <Tag size={11} className="shrink-0" />
          Gestionar categorías
        </p>
        <button
          onClick={onClose}
          className="shrink-0 rounded p-1 text-gray-500 hover:text-gray-200 hover:bg-white/10 transition-colors"
          title="Cerrar"
        >
          <X size={13} />
        </button>
      </div>

      {categories.length === 0 ? (
        <p className="text-xs text-gray-600 italic">No hay categorías aún.</p>
      ) : (
        <div className="space-y-1">
          {categories.map((c) => (
            <CategoryRow key={c.id} category={c} onDeleted={onDeleted} />
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
          placeholder="Nombre de la categoría"
          maxLength={100}
          className={categoryInputCls}
        />
        <div className="flex items-center gap-1.5">
          {CATEGORY_COLOR_PRESETS.map((preset) => (
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
          Agregar categoría
        </button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// NotesPanel
// ---------------------------------------------------------------------------
export default function NotesPanel() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch               = useDebouncedValue(searchInput, 350)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  // undefined = closed | null = new note | Note = edit mode
  const [formTarget, setFormTarget] = useState<Note | null | undefined>(undefined)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [shareResources, setShareResources] = useState<{ id: string; title: string }[] | null>(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)

  const showForm = formTarget !== undefined
  const listRef  = useRef<HTMLDivElement>(null)

  const { notes, pagination, isLoading, error, refetch: refetchNotes } =
    useNotes({ category: activeCategory, tag: activeTag, search: debouncedSearch, page })
  const { categories, refetch: refetchCategories } = useNoteCategories()
  const { tags, refetch: refetchTags } = useNoteTags()

  const mutations = useNoteMutations(() => {
    refetchNotes()
    refetchCategories()
    refetchTags()
  })

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [activeCategory, activeTag, debouncedSearch])

  // Reset scroll position when the page changes
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 })
  }, [page])

  // Notes with is_pinned=true are always returned in full on every page;
  // pagination.total only counts non-pinned notes.
  const pinnedCount = useMemo(() => notes.filter((n) => n.is_pinned).length, [notes])
  const headerCount = pinnedCount + pagination.total

  // Fallback if the current page's non-pinned block becomes empty
  // (e.g. deleted the last non-pinned note on it). notes.length alone can't
  // be used here since pinned notes are always present.
  useEffect(() => {
    const unpinnedInPage = notes.filter((n) => !n.is_pinned).length
    if (!isLoading && pagination.total > 0 && unpinnedInPage === 0 && page > 1) {
      setPage(1)
    }
  }, [isLoading, pagination.total, notes, page])

  function handleSaved() {
    setFormTarget(undefined)
  }

  async function handleFormSubmit(payload: NotePayload) {
    return formTarget ? mutations.update(formTarget.id, payload) : mutations.create(payload)
  }

  async function handleDelete(id: string) {
    const ok = await mutations.remove(id)
    if (!ok) return
    if (expandedId === id) setExpandedId(null)
  }

  async function handleTogglePin(note: Note) {
    await mutations.togglePin(note.id)
  }

  function openEditForm(note: Note) {
    setExpandedId(null)
    setFormTarget(note)
  }

  function toggleFormOrClose() {
    setFormTarget((prev) => (prev !== undefined ? undefined : null))
  }

  function handleCategoryCreated() {
    refetchCategories()
  }

  function handleCategoryDeleted(id: string) {
    if (activeCategory === id) setActiveCategory(null)
    // Notes that referenced this category are set to null server-side (SET_NULL) —
    // resync notes and categories from the server instead of patching local state.
    refetchNotes()
    refetchCategories()
  }

  function handleRefresh() {
    refetchNotes()
    refetchCategories()
    refetchTags()
  }

  // Categories with at least one note, based on server-side notes_count
  const presentCategories = useMemo(
    () => categories.filter((c) => c.notes_count > 0),
    [categories]
  )

  const hasActiveFilters = Boolean(activeCategory || activeTag || debouncedSearch.trim())

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
    const selected = notes
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
            {!isLoading && !error && headerCount > 0 && (
              <span className="text-xs text-gray-500 mr-1">{headerCount}</span>
            )}
            {!isLoading && !error && headerCount > 0 && (
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
              onClick={() => setShowCategoryManager((prev) => !prev)}
              className={`rounded p-1 transition-colors ${
                showCategoryManager
                  ? "text-blue-400 bg-blue-500/20 hover:bg-blue-500/30"
                  : "text-gray-500 hover:text-gray-200 hover:bg-white/10"
              }`}
              title="Gestionar categorías"
            >
              <Tag size={13} />
            </button>
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
              onClick={handleRefresh}
              disabled={isLoading}
              className="rounded p-1 text-gray-500 hover:text-gray-200 hover:bg-white/10 transition-colors disabled:opacity-40"
              title="Actualizar"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Summary */}
        {!isLoading && !error && headerCount > 0 && pinnedCount > 0 && (
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

      {/* Category manager */}
      {showCategoryManager && (
        <CategoryManager
          categories={categories}
          onClose={() => setShowCategoryManager(false)}
          onCreated={handleCategoryCreated}
          onDeleted={handleCategoryDeleted}
        />
      )}

      {/* Create / Edit form */}
      {showForm && (
        <NoteForm
          editNote={formTarget ?? null}
          categories={categories}
          onCancel={() => setFormTarget(undefined)}
          onSaved={handleSaved}
          onSubmit={handleFormSubmit}
          tagSuggestions={tags}
        />
      )}

      {/* Search + category filter */}
      {!isLoading && !error && (headerCount > 0 || hasActiveFilters) && (
        <div className="shrink-0 border-b border-white/10 px-3 py-2 space-y-2">
          <div className="relative flex items-center">
            <Search size={12} className="absolute left-2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar notas…"
              className="w-full rounded bg-white/5 border border-white/10 pl-6 pr-6 py-1 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/20 transition-colors"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-1.5 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X size={11} />
              </button>
            )}
          </div>

          {presentCategories.length >= 2 && (
            <div className="flex flex-wrap gap-1">
              {presentCategories.map((c) => {
                const isActive = activeCategory === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCategory((prev) => (prev === c.id ? null : c.id))}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase transition-colors ${
                      isActive
                        ? "ring-1 ring-white/30"
                        : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
                    }`}
                    style={
                      isActive
                        ? { backgroundColor: (c.color || "#6b7280") + "30", color: c.color || "#e5e7eb" }
                        : undefined
                    }
                  >
                    {c.name}
                  </button>
                )
              })}
            </div>
          )}

          {tags.length >= 2 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
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

      {isLoading && <NotesSkeleton />}

      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <AlertCircle size={28} className="text-red-400" />
          <p className="text-sm text-gray-400">{error}</p>
          <p className="text-[10px] text-gray-600 font-mono break-all">
            {import.meta.env.VITE_API_URL ?? "http://rbac.local.test"}/api/v1/app/notes/
          </p>
          <button
            onClick={handleRefresh}
            className="rounded-md bg-white/10 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/20 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !error && !hasActiveFilters && headerCount === 0 && (
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

      {!isLoading && !error && hasActiveFilters && notes.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-8 text-center">
          <Search size={24} className="text-gray-600" />
          <p className="text-sm text-gray-400">Sin resultados</p>
        </div>
      )}

      {!isLoading && !error && notes.length > 0 && (
        <div ref={listRef} className="flex-1 overflow-y-auto p-2">
          {notes.map((note) => (
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

      <Pagination
        page={pagination.page}
        perPage={pagination.per_page}
        total={pagination.total}
        onPageChange={setPage}
      />
    </div>
  )
}
