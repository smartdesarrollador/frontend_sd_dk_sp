import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Lock, FolderKanban, AlertCircle,
  Search, X, ChevronDown, ChevronRight, RefreshCw,
  Plus, Loader2, Pencil, Trash2, Check,
  Layers, ListChecks, Users,
} from "lucide-react"
import { useAuthStore } from "../../store/authStore"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ProjectStatus = "active" | "archived"

interface Project {
  id: string
  name: string
  description: string
  color: string
  icon: string
  is_archived: boolean
  status: ProjectStatus       // computed by backend: active | archived
  sections_count: number
  items_count: number
  members_count: number
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PRESET_COLORS = [
  "#6366f1", // indigo (default)
  "#2563eb", // blue
  "#16a34a", // green
  "#dc2626", // red
  "#9333ea", // purple
  "#d97706", // amber
  "#0891b2", // cyan
  "#db2777", // pink
]

const STATUS_STYLES: Record<ProjectStatus, string> = {
  active:   "bg-green-900/50 text-green-300",
  archived: "bg-gray-700/60 text-gray-400",
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  active:   "Activo",
  archived: "Archivado",
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

// ---------------------------------------------------------------------------
// ProjectItem row
// ---------------------------------------------------------------------------
function ProjectRow({
  project,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: {
  project: Project
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  function stop(e: React.MouseEvent) { e.stopPropagation() }

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

        {/* Color dot */}
        <span
          className="shrink-0 h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: project.color || "#6366f1" }}
        />

        {/* Name + status */}
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-medium ${project.is_archived ? "text-gray-500" : "text-gray-100"}`}>
            {project.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLES[project.status]}`}>
              {STATUS_LABELS[project.status]}
            </span>
            {/* Mini stats */}
            <span className="flex items-center gap-0.5 text-[10px] text-gray-600">
              <Layers size={9} />{project.sections_count}
            </span>
            <span className="flex items-center gap-0.5 text-[10px] text-gray-600">
              <ListChecks size={9} />{project.items_count}
            </span>
            {project.members_count > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-600">
                <Users size={9} />{project.members_count}
              </span>
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
              onClick={(e) => { stop(e); onEdit() }}
              className="rounded p-1 text-gray-500 hover:text-blue-300 hover:bg-blue-500/20 transition-colors"
              title="Editar proyecto"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={(e) => { stop(e); setConfirmDelete(true) }}
              className="rounded p-1 text-gray-500 hover:text-red-300 hover:bg-red-500/20 transition-colors"
              title="Eliminar proyecto"
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
            {/* Color bar accent */}
            <div
              className="h-1 w-full rounded-full opacity-60"
              style={{ backgroundColor: project.color || "#6366f1" }}
            />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded bg-white/5 p-1.5">
                <p className="text-gray-100 font-semibold">{project.sections_count}</p>
                <p className="text-[10px] text-gray-500">Secciones</p>
              </div>
              <div className="rounded bg-white/5 p-1.5">
                <p className="text-gray-100 font-semibold">{project.items_count}</p>
                <p className="text-[10px] text-gray-500">Items</p>
              </div>
              <div className="rounded bg-white/5 p-1.5">
                <p className="text-gray-100 font-semibold">{project.members_count}</p>
                <p className="text-[10px] text-gray-500">Miembros</p>
              </div>
            </div>

            {/* Description */}
            {project.description && (
              <p className="text-gray-400 leading-relaxed border-t border-white/10 pt-1.5">
                {project.description}
              </p>
            )}

            {/* Dates */}
            <p className="text-[10px] text-gray-600 border-t border-white/10 pt-1.5">
              Creado: {formatDate(project.created_at)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function ProjectsSkeleton() {
  return (
    <div className="flex flex-col gap-1 px-3 py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 py-2 animate-pulse">
          <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-white/10" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-2/3 rounded bg-white/10" />
            <div className="h-2.5 w-1/3 rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ProjectForm — create (POST) and edit (PATCH)
// ---------------------------------------------------------------------------
const EMPTY_FORM = {
  name:        "",
  description: "",
  color:       "#6366f1",
  is_archived: false,
}

function projectToForm(p: Project) {
  return {
    name:        p.name,
    description: p.description ?? "",
    color:       p.color || "#6366f1",
    is_archived: p.is_archived,
  }
}

function ColorSwatch({
  color,
  selected,
  onClick,
}: {
  color: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-5 w-5 rounded-full transition-transform hover:scale-110 ${
        selected ? "ring-2 ring-white/60 ring-offset-1 ring-offset-black/40" : ""
      }`}
      style={{ backgroundColor: color }}
      title={color}
    />
  )
}

function ProjectForm({
  editProject,
  onCancel,
  onSaved,
  accessToken,
  tenantSlug,
}: {
  editProject: Project | null
  onCancel: () => void
  onSaved: (project: Project, isEdit: boolean) => void
  accessToken: string
  tenantSlug: string
}) {
  const isEdit = editProject !== null
  const [form, setForm]                 = useState(isEdit ? projectToForm(editProject!) : EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError]       = useState<string | null>(null)

  function setField<K extends keyof typeof EMPTY_FORM>(field: K, value: typeof EMPTY_FORM[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return

    setIsSubmitting(true)
    setFormError(null)

    const apiBase = import.meta.env.VITE_API_URL ?? "http://rbac.local.test"
    const url = isEdit
      ? `${apiBase}/api/v1/app/projects/${editProject!.id}/update/`
      : `${apiBase}/api/v1/app/projects/create/`

    try {
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          Authorization:   `Bearer ${accessToken}`,
          "X-Tenant-Slug": tenantSlug,
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({
          name:        form.name.trim(),
          description: form.description.trim(),
          color:       form.color,
          is_archived: form.is_archived,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const msg =
          body?.detail ??
          body?.name?.[0] ??
          `HTTP ${res.status}`
        throw new Error(msg)
      }

      const saved: Project = await res.json()
      onSaved(saved, isEdit)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar proyecto")
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
        {isEdit ? "Editar proyecto" : "Nuevo proyecto"}
      </p>

      {/* Name */}
      <input
        type="text"
        value={form.name}
        onChange={(e) => setField("name", e.target.value)}
        placeholder="Nombre del proyecto *"
        maxLength={255}
        required
        className={inputCls}
        autoFocus
      />

      {/* Description */}
      <textarea
        value={form.description}
        onChange={(e) => setField("description", e.target.value)}
        placeholder="Descripción (opcional)"
        rows={2}
        className={inputCls + " resize-none"}
      />

      {/* Color swatches */}
      <div className="space-y-1">
        <p className="text-[10px] text-gray-500">Color</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <ColorSwatch
              key={c}
              color={c}
              selected={form.color === c}
              onClick={() => setField("color", c)}
            />
          ))}
          {/* Custom color picker */}
          <label className="relative h-5 w-5 rounded-full overflow-hidden cursor-pointer border border-white/20 hover:border-white/40 transition-colors" title="Color personalizado">
            <input
              type="color"
              value={form.color}
              onChange={(e) => setField("color", e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <span
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: PRESET_COLORS.includes(form.color) ? "transparent" : form.color }}
            />
            {!PRESET_COLORS.includes(form.color) && (
              <span className="absolute inset-0 flex items-center justify-center text-white/80 text-[8px] font-bold">✎</span>
            )}
            {PRESET_COLORS.includes(form.color) && (
              <span className="absolute inset-0 flex items-center justify-center text-gray-400 text-[8px]">+</span>
            )}
          </label>
        </div>

        {/* Color preview */}
        <div className="flex items-center gap-1.5 mt-1">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: form.color }}
          />
          <span className="text-[10px] font-mono text-gray-500">{form.color}</span>
        </div>
      </div>

      {/* Archived toggle */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.is_archived}
          onChange={(e) => setField("is_archived", e.target.checked)}
          className="accent-gray-400 w-3 h-3"
        />
        <span className="text-xs text-gray-400">Marcar como archivado</span>
      </label>

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
          {isEdit ? "Guardar cambios" : "Crear proyecto"}
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
// ProjectsPanel
// ---------------------------------------------------------------------------
export default function ProjectsPanel() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const accessToken     = useAuthStore((s) => s.accessToken)
  const tenantSlug      = useAuthStore((s) => s.tenant?.slug)

  const [projects, setProjects]     = useState<Project[]>([])
  const [isLoading, setIsLoading]   = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [search, setSearch]         = useState("")
  const [activeStatus, setActiveStatus] = useState<ProjectStatus | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  // undefined = closed | null = new | Project = edit
  const [formTarget, setFormTarget] = useState<Project | null | undefined>(undefined)

  const showForm = formTarget !== undefined
  const apiBase  = import.meta.env.VITE_API_URL ?? "http://rbac.local.test"

  const fetchProjects = useCallback(async () => {
    if (!accessToken || !tenantSlug) {
      console.warn("[ProjectsPanel] fetchProjects called without accessToken or tenantSlug")
      return
    }
    setIsLoading(true)
    setError(null)

    console.log("[ProjectsPanel] fetching →", `${apiBase}/api/v1/app/projects/`)

    try {
      const res = await fetch(`${apiBase}/api/v1/app/projects/`, {
        headers: {
          Authorization:   `Bearer ${accessToken}`,
          "X-Tenant-Slug": tenantSlug,
        },
      })
      console.log("[ProjectsPanel] response status:", res.status, res.statusText)

      if (!res.ok) {
        const body = await res.text().catch(() => "(sin body)")
        console.error("[ProjectsPanel] HTTP error body:", body)
        throw new Error(`HTTP ${res.status} ${res.statusText}`)
      }

      const data = await res.json()
      const list: Project[] = data.projects ?? data.results ?? []
      console.log("[ProjectsPanel] projects count:", list.length)
      setProjects(list)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cargar proyectos"
      console.error("[ProjectsPanel] fetch error:", err)
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, tenantSlug, apiBase])

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects()
    } else {
      setProjects([])
      setError(null)
      setFormTarget(undefined)
    }
  }, [isAuthenticated, fetchProjects])

  function handleSaved(project: Project, isEdit: boolean) {
    if (isEdit) {
      setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)))
    } else {
      setProjects((prev) => [project, ...prev])
    }
    setFormTarget(undefined)
  }

  async function handleDelete(id: string) {
    if (!accessToken || !tenantSlug) return
    try {
      const res = await fetch(`${apiBase}/api/v1/app/projects/${id}/delete/`, {
        method: "DELETE",
        headers: {
          Authorization:   `Bearer ${accessToken}`,
          "X-Tenant-Slug": tenantSlug,
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setProjects((prev) => prev.filter((p) => p.id !== id))
      if (expandedId === id) setExpandedId(null)
    } catch (err) {
      console.error("[ProjectsPanel] delete error:", err)
    }
  }

  function toggleFormOrClose() {
    setFormTarget((prev) => (prev !== undefined ? undefined : null))
  }

  // Statuses present in the list
  const presentStatuses = useMemo((): ProjectStatus[] => {
    const has = { active: false, archived: false }
    for (const p of projects) { has[p.status] = true }
    return (Object.keys(has) as ProjectStatus[]).filter((s) => has[s])
  }, [projects])

  // Summary counts
  const activeCount   = useMemo(() => projects.filter((p) => !p.is_archived).length, [projects])
  const archivedCount = useMemo(() => projects.filter((p) =>  p.is_archived).length, [projects])

  // Filtered + sorted (active first, then archived; alphabetical within each group)
  const filtered = useMemo(() => {
    let list = projects
    if (activeStatus) {
      list = list.filter((p) => p.status === activeStatus)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      )
    }
    return [...list].sort((a, b) => {
      if (a.is_archived !== b.is_archived) return a.is_archived ? 1 : -1
      return a.name.localeCompare(b.name)
    })
  }, [projects, activeStatus, search])

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <Lock size={32} className="text-gray-600" />
        <p className="text-sm text-gray-400">Inicia sesión para ver tus proyectos</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-100">Proyectos</h2>
          <div className="flex items-center gap-1">
            {!isLoading && !error && projects.length > 0 && (
              <span className="text-xs text-gray-500 mr-1">{filtered.length}</span>
            )}
            <button
              onClick={toggleFormOrClose}
              className={`rounded p-1 transition-colors ${
                showForm && formTarget === null
                  ? "text-blue-400 bg-blue-500/20 hover:bg-blue-500/30"
                  : "text-gray-500 hover:text-gray-200 hover:bg-white/10"
              }`}
              title={showForm ? "Cancelar" : "Nuevo proyecto"}
            >
              {showForm && formTarget === null ? <X size={13} /> : <Plus size={13} />}
            </button>
            <button
              onClick={fetchProjects}
              disabled={isLoading}
              className="rounded p-1 text-gray-500 hover:text-gray-200 hover:bg-white/10 transition-colors disabled:opacity-40"
              title="Actualizar"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Status summary */}
        {!isLoading && !error && projects.length > 0 && (
          <div className="flex gap-2 mt-1.5">
            {activeCount > 0 && (
              <span className="text-[10px] text-green-400/80">
                {activeCount} activo{activeCount !== 1 ? "s" : ""}
              </span>
            )}
            {archivedCount > 0 && (
              <span className="text-[10px] text-gray-500">
                · {archivedCount} archivado{archivedCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </header>

      {/* Create / Edit form */}
      {showForm && accessToken && tenantSlug && (
        <ProjectForm
          editProject={formTarget ?? null}
          accessToken={accessToken}
          tenantSlug={tenantSlug}
          onCancel={() => setFormTarget(undefined)}
          onSaved={handleSaved}
        />
      )}

      {/* Search + status filter */}
      {!isLoading && !error && projects.length > 0 && (
        <div className="shrink-0 border-b border-white/10 px-3 py-2 space-y-2">
          <div className="relative flex items-center">
            <Search size={12} className="absolute left-2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar proyectos…"
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

          {presentStatuses.length >= 2 && (
            <div className="flex gap-1">
              {presentStatuses.map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveStatus((prev) => (prev === s ? null : s))}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase transition-colors ${
                    activeStatus === s
                      ? STATUS_STYLES[s] + " ring-1 ring-white/30"
                      : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isLoading && <ProjectsSkeleton />}

      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <AlertCircle size={28} className="text-red-400" />
          <p className="text-sm text-gray-400">{error}</p>
          <p className="text-[10px] text-gray-600 font-mono break-all">
            {apiBase}/api/v1/app/projects/
          </p>
          <button
            onClick={fetchProjects}
            className="rounded-md bg-white/10 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/20 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !error && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <FolderKanban size={32} className="text-gray-600" />
          <p className="text-sm text-gray-400">No tienes proyectos aún</p>
          <button
            onClick={() => setFormTarget(null)}
            className="rounded-md bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 text-xs text-blue-300 hover:bg-blue-600/30 transition-colors"
          >
            Crear primer proyecto
          </button>
        </div>
      )}

      {!isLoading && !error && projects.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-8 text-center">
          <Search size={24} className="text-gray-600" />
          <p className="text-sm text-gray-400">Sin resultados</p>
        </div>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              isExpanded={expandedId === project.id}
              onToggleExpand={() => toggleExpand(project.id)}
              onEdit={() => { setExpandedId(null); setFormTarget(project) }}
              onDelete={() => handleDelete(project.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
