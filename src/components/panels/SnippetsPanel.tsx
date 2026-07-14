import { useState, useEffect, useRef } from "react"
import {
  Lock, Clipboard, Check, Code2, AlertCircle,
  Search, X, ChevronDown, ChevronRight, RefreshCw,
  Plus, Loader2, Pencil, Trash2, Share2, CheckSquare, Tag,
} from "lucide-react"
import { useAuthStore } from "../../store/authStore"
import { ShareBlock } from "../shared/ShareBlock"
import { BulkSelectBar } from "../shared/BulkSelectBar"
import { LANGUAGES, langColor } from "../../features/snippets/types"
import type { Snippet } from "../../features/snippets/types"
import { useSnippets } from "../../features/snippets/hooks/useSnippets"
import { useSnippetTags } from "../../features/snippets/hooks/useSnippetTags"
import { useSnippetMutations } from "../../features/snippets/hooks/useSnippetMutations"
import type { SnippetPayload } from "../../features/snippets/hooks/useSnippetMutations"
import { useDebouncedValue } from "../../features/search/hooks/useDebouncedValue"
import Pagination from "../shared/Pagination"

// ---------------------------------------------------------------------------
// SnippetItem
// ---------------------------------------------------------------------------
function SnippetItem({
  snippet,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onShare,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: {
  snippet: Snippet
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
  onShare: () => void
  selectionMode?: boolean
  selected?: boolean
  onToggleSelect?: (id: string) => void
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

  function handleShareClick(e: React.MouseEvent) {
    e.stopPropagation()
    onShare()
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
    <div className={`rounded-md overflow-hidden ${selected ? "ring-1 ring-blue-500/50 bg-blue-500/5" : ""}`}>
      <div
        className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 cursor-pointer group"
        onClick={selectionMode ? () => onToggleSelect?.(snippet.id) : onToggleExpand}
      >
        {selectionMode ? (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect?.(snippet.id)}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 h-3 w-3 rounded accent-blue-500"
          />
        ) : (
          <span className="shrink-0 text-gray-600 group-hover:text-gray-400 transition-colors">
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
        )}

        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase ${langColor(snippet.language)}`}
        >
          {snippet.language}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-medium text-gray-100">{snippet.title}</p>
            {snippet.is_shared && (
              <span
                className="shrink-0 inline-flex"
                title={snippet.shared_by_name ? `Compartido por ${snippet.shared_by_name}` : "Compartido contigo"}
              >
                <Share2 size={10} className="text-indigo-400" />
              </span>
            )}
          </div>
          {snippet.description && (
            <p className="truncate text-xs text-gray-400">{snippet.description}</p>
          )}
        </div>

        {/* Action buttons — visible on hover */}
        {selectionMode ? null : confirmDelete ? (
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
              onClick={handleShareClick}
              className="rounded p-1 text-gray-500 hover:text-indigo-300 hover:bg-indigo-500/20 transition-colors"
              title="Compartir snippet"
            >
              <Share2 size={13} />
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

      {isExpanded && (snippet.code || snippet.tags.length > 0) && (
        <div className="px-3 pb-2 space-y-1.5">
          {snippet.code && (
            <pre className="max-h-48 overflow-y-auto rounded bg-black/40 border border-white/10 p-2 text-[11px] font-mono text-gray-300 whitespace-pre-wrap break-all">
              <code>{snippet.code}</code>
            </pre>
          )}
          {snippet.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <Tag size={10} className="text-gray-600 shrink-0" />
              {snippet.tags.map((t) => (
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
  onSubmit,
  tagSuggestions,
}: {
  editSnippet: Snippet | null
  onCancel: () => void
  onSaved: () => void
  onSubmit: (payload: SnippetPayload) => Promise<Snippet>
  tagSuggestions: string[]
}) {
  const isEdit = editSnippet !== null
  const [form, setForm]                 = useState(isEdit ? snippetToForm(editSnippet!) : EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError]       = useState<string | null>(null)
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const tagFieldRef = useRef<HTMLDivElement>(null)

  function setField(field: keyof typeof EMPTY_FORM, value: string) {
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
    if (!form.title.trim() || !form.code.trim()) return

    setIsSubmitting(true)
    setFormError(null)

    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    try {
      await onSubmit({
        title: form.title.trim(),
        code: form.code.trim(),
        language: form.language,
        description: form.description.trim(),
        tags,
      })
      onSaved()
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
        rows={6}
        required
        className={inputCls + " font-mono resize-y min-h-[80px] max-h-[320px]"}
      />

      <input
        type="text"
        value={form.description}
        onChange={(e) => setField("description", e.target.value)}
        placeholder="Descripción (opcional)"
        className={inputCls}
      />

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

  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch               = useDebouncedValue(searchInput, 350)
  const [activeLang, setActiveLang] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  // null = closed, undefined = new, Snippet = edit mode
  const [formTarget, setFormTarget] = useState<Snippet | null | undefined>(undefined)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [shareResources, setShareResources] = useState<{ id: string; title: string }[] | null>(null)

  const showForm = formTarget !== undefined
  const listRef  = useRef<HTMLDivElement>(null)

  const { snippets, pagination, isLoading, error, refetch: refetchSnippets } =
    useSnippets({ language: activeLang, tag: activeTag, search: debouncedSearch, page })
  const { tags, refetch: refetchTags } = useSnippetTags()

  const mutations = useSnippetMutations(() => {
    refetchSnippets()
    refetchTags()
  })

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [activeLang, activeTag, debouncedSearch])

  // Reset scroll position when the page changes
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 })
  }, [page])

  // Fallback if the current page becomes empty (e.g. deleted the last snippet on it)
  useEffect(() => {
    if (!isLoading && pagination.total > 0 && snippets.length === 0 && page > 1) {
      setPage(1)
    }
  }, [isLoading, pagination.total, snippets, page])

  function handleSaved() {
    setFormTarget(undefined)
  }

  async function handleFormSubmit(payload: SnippetPayload) {
    return formTarget ? mutations.update(formTarget.id, payload) : mutations.create(payload)
  }

  async function handleDelete(id: string) {
    const ok = await mutations.remove(id)
    if (!ok) return
    if (expandedId === id) setExpandedId(null)
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

  function handleRefresh() {
    refetchSnippets()
    refetchTags()
  }

  const hasActiveFilters = Boolean(activeLang || activeTag || debouncedSearch.trim())

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
    const selected = snippets
      .filter((s) => selectedIds.has(s.id))
      .map((s) => ({ id: s.id, title: s.title }))
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
            {!isLoading && !error && pagination.total > 0 && (
              <span className="text-xs text-gray-500 mr-1">{pagination.total}</span>
            )}
            {!isLoading && !error && pagination.total > 0 && (
              <button
                onClick={toggleSelectionMode}
                className={`rounded p-1 transition-colors ${
                  isSelecting
                    ? "text-blue-400 bg-blue-500/20 hover:bg-blue-500/30"
                    : "text-gray-500 hover:text-gray-200 hover:bg-white/10"
                }`}
                title={isSelecting ? "Salir de selección" : "Seleccionar varios"}
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
              title={showForm ? "Cancelar" : "Nuevo snippet"}
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
        <ShareBlock resourceType="snippet" resources={shareResources} onClose={handleCloseShare} />
      )}

      {/* Create / Edit form */}
      {showForm && (
        <SnippetForm
          editSnippet={formTarget ?? null}
          onCancel={closeForm}
          onSaved={handleSaved}
          onSubmit={handleFormSubmit}
          tagSuggestions={tags}
        />
      )}

      {/* Search + language filters */}
      {!isLoading && !error && (pagination.total > 0 || hasActiveFilters) && (
        <div className="shrink-0 border-b border-white/10 px-3 py-2 space-y-2">
          <div className="relative flex items-center">
            <Search size={12} className="absolute left-2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar snippets…"
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

          <div className="flex flex-wrap gap-1">
            {LANGUAGES.map((lang) => (
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

      {isLoading && <SnippetsSkeleton />}

      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <AlertCircle size={28} className="text-red-400" />
          <p className="text-sm text-gray-400">{error}</p>
          <p className="text-[10px] text-gray-600 font-mono break-all">
            {import.meta.env.VITE_API_URL ?? "http://rbac.local.test"}/api/v1/app/snippets/
          </p>
          <button
            onClick={handleRefresh}
            className="rounded-md bg-white/10 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/20 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !error && !hasActiveFilters && pagination.total === 0 && (
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

      {!isLoading && !error && hasActiveFilters && snippets.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-8 text-center">
          <Search size={24} className="text-gray-600" />
          <p className="text-sm text-gray-400">Sin resultados</p>
        </div>
      )}

      {!isLoading && !error && snippets.length > 0 && (
        <div ref={listRef} className="flex-1 overflow-y-auto p-2">
          {snippets.map((snippet) => (
            <SnippetItem
              key={snippet.id}
              snippet={snippet}
              isExpanded={expandedId === snippet.id}
              onToggleExpand={() => toggleExpand(snippet.id)}
              onEdit={() => openEditForm(snippet)}
              onDelete={() => handleDelete(snippet.id)}
              onShare={() => setShareResources([{ id: snippet.id, title: snippet.title }])}
              selectionMode={isSelecting}
              selected={selectedIds.has(snippet.id)}
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
