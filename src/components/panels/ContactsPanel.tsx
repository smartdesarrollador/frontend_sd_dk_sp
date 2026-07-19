import { useState, useEffect, useMemo, useRef } from "react"
import {
  Lock, Users, AlertCircle,
  Search, X, ChevronDown, ChevronRight, RefreshCw,
  Plus, Loader2, Pencil, Trash2, Check, Copy,
  Phone, Building2, Briefcase, FileText, Mail,
  Share2, CheckSquare,
} from "lucide-react"
import { useAuthStore } from "../../store/authStore"
import { ShareBlock } from "../shared/ShareBlock"
import { BulkSelectBar } from "../shared/BulkSelectBar"
import type { Contact, ContactGroup } from "../../features/contacts/types"
import { useContacts } from "../../features/contacts/hooks/useContacts"
import { useContactGroups } from "../../features/contacts/hooks/useContactGroups"
import { useContactMutations } from "../../features/contacts/hooks/useContactMutations"
import type { ContactPayload } from "../../features/contacts/hooks/useContactMutations"
import { useDebouncedValue } from "../../features/search/hooks/useDebouncedValue"
import Pagination from "../shared/Pagination"

// ---------------------------------------------------------------------------
// Avatar helpers
// ---------------------------------------------------------------------------
const AVATAR_COLORS = [
  "bg-blue-700",
  "bg-purple-700",
  "bg-green-700",
  "bg-rose-700",
  "bg-orange-700",
  "bg-teal-700",
]

function getInitial(name: string): string {
  return name.trim()[0]?.toUpperCase() ?? "?"
}

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// Group badge: render a small colored dot + name
function GroupBadge({ group }: { group: { name: string; color: string } }) {
  return (
    <span className="flex items-center gap-1">
      <span
        className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
        style={{ backgroundColor: group.color || "#6b7280" }}
      />
      <span className="text-[10px] text-gray-400 truncate max-w-[80px]">{group.name}</span>
    </span>
  )
}

// ---------------------------------------------------------------------------
// ContactItem
// ---------------------------------------------------------------------------
function ContactItem({
  contact,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onShare,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: {
  contact: Contact
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
  onShare: () => void
  selectionMode?: boolean
  selected?: boolean
  onToggleSelect?: (id: string) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copied, setCopied] = useState(false)

  function stop(e: React.MouseEvent) { e.stopPropagation() }

  async function handleCopyEmail(e: React.MouseEvent) {
    stop(e)
    if (!contact.email) return
    await navigator.clipboard.writeText(contact.email)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={`rounded-md overflow-hidden ${selected ? "ring-1 ring-blue-500/50 bg-blue-500/5" : ""}`}>
      {/* Main row */}
      <div
        className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 cursor-pointer group"
        onClick={selectionMode ? () => onToggleSelect?.(contact.id) : onToggleExpand}
      >
        {/* Chevron / checkbox */}
        {selectionMode ? (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect?.(contact.id)}
            onClick={stop}
            className="shrink-0 h-3 w-3 rounded accent-blue-500"
          />
        ) : (
          <span className="shrink-0 text-gray-600 group-hover:text-gray-400 transition-colors">
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
        )}

        {/* Avatar */}
        <div className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${getAvatarColor(contact.name)}`}>
          {getInitial(contact.name)}
        </div>

        {/* Name + email / group */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-medium text-gray-100">{contact.name}</p>
            {contact.is_shared && (
              <span
                className="shrink-0 inline-flex"
                title={contact.shared_by_name ? `Compartido por ${contact.shared_by_name}` : "Compartido contigo"}
              >
                <Share2 size={10} className="text-indigo-400" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {contact.email ? (
              <p className="truncate text-xs text-gray-500 flex-1">{contact.email}</p>
            ) : contact.company ? (
              <p className="truncate text-xs text-gray-500 flex-1">{contact.company}</p>
            ) : null}
            {contact.group && <GroupBadge group={contact.group} />}
          </div>
        </div>

        {/* Actions */}
        {selectionMode ? null : confirmDelete ? (
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
            {contact.email && (
              <button
                onClick={handleCopyEmail}
                className={`rounded p-1 transition-colors ${
                  copied
                    ? "text-green-400"
                    : "text-gray-500 hover:text-teal-300 hover:bg-teal-500/20"
                }`}
                title={copied ? "¡Copiado!" : "Copiar email"}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
            )}
            <button
              onClick={(e) => { stop(e); onShare() }}
              className="rounded p-1 text-gray-500 hover:text-indigo-300 hover:bg-indigo-500/20 transition-colors"
              title="Compartir contacto"
            >
              <Share2 size={13} />
            </button>
            <button
              onClick={(e) => { stop(e); onEdit() }}
              className="rounded p-1 text-gray-500 hover:text-blue-300 hover:bg-blue-500/20 transition-colors"
              title="Editar contacto"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={(e) => { stop(e); setConfirmDelete(true) }}
              className="rounded p-1 text-gray-500 hover:text-red-300 hover:bg-red-500/20 transition-colors"
              title="Eliminar contacto"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-3 pb-2">
          <div className="rounded bg-black/30 border border-white/10 p-2 space-y-1.5 text-xs">
            {contact.email && (
              <div className="flex items-center gap-2 text-gray-400">
                <Mail size={11} className="shrink-0 text-gray-600" />
                <span className="truncate">{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2 text-gray-400">
                <Phone size={11} className="shrink-0 text-gray-600" />
                <span>{contact.phone}</span>
              </div>
            )}
            {contact.company && (
              <div className="flex items-center gap-2 text-gray-400">
                <Building2 size={11} className="shrink-0 text-gray-600" />
                <span className="truncate">{contact.company}</span>
              </div>
            )}
            {contact.job_title && (
              <div className="flex items-center gap-2 text-gray-400">
                <Briefcase size={11} className="shrink-0 text-gray-600" />
                <span className="truncate">{contact.job_title}</span>
              </div>
            )}
            {contact.notes && (
              <div className="flex items-start gap-2 text-gray-400 border-t border-white/10 pt-1.5">
                <FileText size={11} className="shrink-0 text-gray-600 mt-0.5" />
                <p className="leading-relaxed whitespace-pre-wrap">{contact.notes}</p>
              </div>
            )}
            {!contact.email && !contact.phone && !contact.company && !contact.job_title && !contact.notes && (
              <p className="text-gray-600 italic text-center py-1">Sin detalles adicionales</p>
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
function ContactsSkeleton() {
  return (
    <div className="flex flex-col gap-1 px-3 py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 py-2 animate-pulse">
          <div className="h-7 w-7 shrink-0 rounded-full bg-white/10" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-2/3 rounded bg-white/10" />
            <div className="h-2.5 w-1/2 rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ContactForm — create (POST) and edit (PATCH)
// ---------------------------------------------------------------------------
const EMPTY_FORM = {
  name:      "",
  email:     "",
  phone:     "",
  company:   "",
  job_title: "",
  group:     "",
  notes:     "",
}

function contactToForm(c: Contact) {
  return {
    name:      c.name,
    email:     c.email ?? "",
    phone:     c.phone ?? "",
    company:   c.company ?? "",
    job_title: c.job_title ?? "",
    group:     c.group?.id ?? "",
    notes:     c.notes ?? "",
  }
}

function ContactForm({
  editContact,
  groups,
  onCancel,
  onSaved,
  onSubmit,
}: {
  editContact: Contact | null
  groups: ContactGroup[]
  onCancel: () => void
  onSaved: () => void
  onSubmit: (payload: ContactPayload) => Promise<Contact>
}) {
  const isEdit = editContact !== null
  const [form, setForm]                 = useState(isEdit ? contactToForm(editContact!) : EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError]       = useState<string | null>(null)

  function setField<K extends keyof typeof EMPTY_FORM>(field: K, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await onSubmit({
        name:      form.name.trim(),
        email:     form.email.trim() || "",
        phone:     form.phone.trim() || "",
        company:   form.company.trim() || "",
        job_title: form.job_title.trim() || "",
        group:     form.group || null,
        notes:     form.notes.trim() || "",
      })
      onSaved()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar contacto")
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = form.name.trim() && !isSubmitting

  const inputCls =
    "w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/25 transition-colors"

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 border-b border-white/10 px-3 py-3 space-y-2"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {isEdit ? "Editar contacto" : "Nuevo contacto"}
      </p>

      {/* Name */}
      <input
        type="text"
        value={form.name}
        onChange={(e) => setField("name", e.target.value)}
        placeholder="Nombre completo *"
        maxLength={200}
        required
        className={inputCls}
        autoFocus
      />

      {/* Email */}
      <input
        type="email"
        value={form.email}
        onChange={(e) => setField("email", e.target.value)}
        placeholder="Email (opcional)"
        className={inputCls}
      />

      {/* Phone + Company (row) */}
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={form.phone}
          onChange={(e) => setField("phone", e.target.value)}
          placeholder="Teléfono"
          maxLength={30}
          className={inputCls}
        />
        <input
          type="text"
          value={form.company}
          onChange={(e) => setField("company", e.target.value)}
          placeholder="Empresa"
          maxLength={100}
          className={inputCls}
        />
      </div>

      {/* Job title + Group (row) */}
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={form.job_title}
          onChange={(e) => setField("job_title", e.target.value)}
          placeholder="Cargo"
          maxLength={100}
          className={inputCls}
        />
        <select
          value={form.group}
          onChange={(e) => setField("group", e.target.value)}
          className={inputCls + " cursor-pointer"}
        >
          <option value="" className="bg-gray-900">Sin grupo</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id} className="bg-gray-900">
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <textarea
        value={form.notes}
        onChange={(e) => setField("notes", e.target.value)}
        placeholder="Notas (opcional)"
        rows={2}
        className={inputCls + " resize-none"}
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
          {isEdit ? "Guardar cambios" : "Crear contacto"}
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
// ContactsPanel
// ---------------------------------------------------------------------------
export default function ContactsPanel() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch               = useDebouncedValue(searchInput, 350)
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  // undefined = closed | null = new contact | Contact = edit
  const [formTarget, setFormTarget] = useState<Contact | null | undefined>(undefined)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [shareResources, setShareResources] = useState<{ id: string; title: string }[] | null>(null)

  const showForm = formTarget !== undefined
  const listRef  = useRef<HTMLDivElement>(null)

  const { contacts, pagination, isLoading, error, refetch: refetchContacts } =
    useContacts({ group: activeGroup, search: debouncedSearch, page })
  const { groups, refetch: refetchGroups } = useContactGroups()

  const mutations = useContactMutations(() => {
    refetchContacts()
    refetchGroups()
  })

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [activeGroup, debouncedSearch])

  // Reset scroll position when the page changes
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 })
  }, [page])

  // Fallback if the current page becomes empty (e.g. deleted the last contact on it)
  useEffect(() => {
    if (!isLoading && pagination.total > 0 && contacts.length === 0 && page > 1) {
      setPage(1)
    }
  }, [isLoading, pagination.total, contacts, page])

  function handleSaved() {
    setFormTarget(undefined)
  }

  async function handleFormSubmit(payload: ContactPayload) {
    return formTarget ? mutations.update(formTarget.id, payload) : mutations.create(payload)
  }

  async function handleDelete(id: string) {
    const ok = await mutations.remove(id)
    if (!ok) return
    if (expandedId === id) setExpandedId(null)
  }

  function toggleFormOrClose() {
    setFormTarget((prev) => (prev !== undefined ? undefined : null))
  }

  function handleRefresh() {
    refetchContacts()
    refetchGroups()
  }

  // Groups with at least one contact, based on server-side contacts_count
  const presentGroups = useMemo(
    () => groups.filter((g) => g.contacts_count > 0),
    [groups]
  )

  const hasActiveFilters = Boolean(activeGroup || debouncedSearch.trim())

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
    const selected = contacts
      .filter((c) => selectedIds.has(c.id))
      .map((c) => ({ id: c.id, title: c.name }))
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
        <p className="text-sm text-gray-400">Inicia sesión para ver tus contactos</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-100">Contactos</h2>
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
              title={showForm ? "Cancelar" : "Nuevo contacto"}
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
        <ShareBlock resourceType="contact" resources={shareResources} onClose={handleCloseShare} />
      )}

      {/* Create / Edit form */}
      {showForm && (
        <ContactForm
          editContact={formTarget ?? null}
          groups={groups}
          onCancel={() => setFormTarget(undefined)}
          onSaved={handleSaved}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Search + group filter pills — montado también durante isLoading:
          desmontarlo en el refetch hace perder el foco del input (LL-100) */}
      {!error && (isLoading || pagination.total > 0 || hasActiveFilters) && (
        <div className="shrink-0 border-b border-white/10 px-3 py-2 space-y-2">
          <div className="relative flex items-center">
            <Search size={12} className="absolute left-2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar contactos…"
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

          {presentGroups.length >= 2 && (
            <div className="flex flex-wrap gap-1">
              {presentGroups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setActiveGroup((prev) => (prev === g.id ? null : g.id))}
                  className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                    activeGroup === g.id
                      ? "bg-white/10 text-gray-200 ring-1 ring-white/20"
                      : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
                  }`}
                >
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: g.color || "#6b7280" }}
                  />
                  {g.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isLoading && <ContactsSkeleton />}

      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <AlertCircle size={28} className="text-red-400" />
          <p className="text-sm text-gray-400">{error}</p>
          <p className="text-[10px] text-gray-600 font-mono break-all">
            /api/v1/app/contacts/
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
          <Users size={32} className="text-gray-600" />
          <p className="text-sm text-gray-400">No tienes contactos aún</p>
          <button
            onClick={() => setFormTarget(null)}
            className="rounded-md bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 text-xs text-blue-300 hover:bg-blue-600/30 transition-colors"
          >
            Crear primer contacto
          </button>
        </div>
      )}

      {!isLoading && !error && hasActiveFilters && contacts.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-8 text-center">
          <Search size={24} className="text-gray-600" />
          <p className="text-sm text-gray-400">Sin resultados</p>
        </div>
      )}

      {!isLoading && !error && contacts.length > 0 && (
        <div ref={listRef} className="flex-1 overflow-y-auto p-2">
          {contacts.map((contact) => (
            <ContactItem
              key={contact.id}
              contact={contact}
              isExpanded={expandedId === contact.id}
              onToggleExpand={() => toggleExpand(contact.id)}
              onEdit={() => { setExpandedId(null); setFormTarget(contact) }}
              onDelete={() => handleDelete(contact.id)}
              onShare={() => setShareResources([{ id: contact.id, title: contact.name }])}
              selectionMode={isSelecting}
              selected={selectedIds.has(contact.id)}
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
