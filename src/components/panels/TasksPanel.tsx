import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Lock, CheckSquare, AlertCircle,
  Search, X, ChevronDown, ChevronRight, RefreshCw,
  Plus, Loader2, Pencil, Trash2, Check,
  Calendar, User,
} from "lucide-react"
import { useAuthStore } from "../../store/authStore"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type TaskStatus   = "todo" | "in_progress" | "review" | "done"
type TaskPriority = "low" | "medium" | "high" | "urgent"

interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  board_id: string
  assignee_name: string | null
  subtasks_count: number
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo",        label: "Por hacer"   },
  { value: "in_progress", label: "En progreso" },
  { value: "review",      label: "En revisión" },
  { value: "done",        label: "Hecho"       },
]

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "low",    label: "Baja"     },
  { value: "medium", label: "Media"    },
  { value: "high",   label: "Alta"     },
  { value: "urgent", label: "Urgente"  },
]

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo:        "bg-gray-700/60 text-gray-300",
  in_progress: "bg-blue-900/50 text-blue-300",
  review:      "bg-purple-900/50 text-purple-300",
  done:        "bg-green-900/50 text-green-300",
}

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low:    "bg-gray-700/50 text-gray-400",
  medium: "bg-yellow-900/40 text-yellow-300",
  high:   "bg-orange-900/40 text-orange-300",
  urgent: "bg-red-900/50 text-red-300",
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo:        "Por hacer",
  in_progress: "En progreso",
  review:      "En revisión",
  done:        "Hecho",
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low:    "Baja",
  medium: "Media",
  high:   "Alta",
  urgent: "Urgente",
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" })
}

function isOverdue(due_date: string | null, status: TaskStatus): boolean {
  if (!due_date || status === "done") return false
  return new Date(due_date) < new Date()
}

// ---------------------------------------------------------------------------
// TaskItem
// ---------------------------------------------------------------------------
function TaskItem({
  task,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: {
  task: Task
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const overdue = isOverdue(task.due_date, task.status)

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
      {/* Main row */}
      <div
        className="flex items-start gap-2 px-3 py-2 hover:bg-white/5 cursor-pointer group"
        onClick={onToggleExpand}
      >
        {/* Chevron */}
        <span className="shrink-0 mt-0.5 text-gray-600 group-hover:text-gray-400 transition-colors">
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>

        {/* Status dot */}
        <span
          className={`shrink-0 mt-1 h-2 w-2 rounded-full ${
            task.status === "done"        ? "bg-green-400" :
            task.status === "in_progress" ? "bg-blue-400"  :
            task.status === "review"      ? "bg-purple-400":
            "bg-gray-500"
          }`}
        />

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-medium ${task.status === "done" ? "line-through text-gray-500" : "text-gray-100"}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {/* Priority badge */}
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${PRIORITY_STYLES[task.priority]}`}>
              {PRIORITY_LABELS[task.priority]}
            </span>
            {/* Due date */}
            {task.due_date && (
              <span className={`flex items-center gap-0.5 text-[10px] ${overdue ? "text-red-400" : "text-gray-500"}`}>
                <Calendar size={9} />
                {formatDate(task.due_date)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {confirmDelete ? (
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
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
              onClick={handleEditClick}
              className="rounded p-1 text-gray-500 hover:text-blue-300 hover:bg-blue-500/20 transition-colors"
              title="Editar tarea"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={handleDeleteClick}
              className="rounded p-1 text-gray-500 hover:text-red-300 hover:bg-red-500/20 transition-colors"
              title="Eliminar tarea"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-3 pb-2 space-y-1.5">
          <div className="rounded bg-black/30 border border-white/10 p-2 space-y-2 text-xs">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Estado</span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLES[task.status]}`}>
                {STATUS_LABELS[task.status]}
              </span>
            </div>

            {/* Assignee */}
            {task.assignee_name && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Asignado a</span>
                <span className="flex items-center gap-1 text-gray-300">
                  <User size={10} />
                  {task.assignee_name}
                </span>
              </div>
            )}

            {/* Subtasks */}
            {task.subtasks_count > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Subtareas</span>
                <span className="text-gray-300">{task.subtasks_count}</span>
              </div>
            )}

            {/* Description */}
            {task.description && (
              <p className="text-gray-400 leading-relaxed border-t border-white/10 pt-2">
                {task.description}
              </p>
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
function TasksSkeleton() {
  return (
    <div className="flex flex-col gap-1 px-3 py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 py-2 animate-pulse">
          <div className="h-2 w-2 shrink-0 rounded-full bg-white/10" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-3/4 rounded bg-white/10" />
            <div className="h-2.5 w-1/3 rounded bg-white/10" />
          </div>
          <div className="h-4 w-12 shrink-0 rounded bg-white/10" />
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// TaskForm — shared for create (POST) and edit (PATCH)
// ---------------------------------------------------------------------------
const EMPTY_FORM = {
  title:       "",
  status:      "todo" as TaskStatus,
  priority:    "medium" as TaskPriority,
  description: "",
  due_date:    "",
}

function taskToForm(t: Task) {
  return {
    title:       t.title,
    status:      t.status,
    priority:    t.priority,
    description: t.description ?? "",
    due_date:    t.due_date ? t.due_date.split("T")[0] : "",
  }
}

function TaskForm({
  editTask,
  onCancel,
  onSaved,
  accessToken,
  tenantSlug,
}: {
  editTask: Task | null
  onCancel: () => void
  onSaved: (task: Task, isEdit: boolean) => void
  accessToken: string
  tenantSlug: string
}) {
  const isEdit = editTask !== null
  const [form, setForm]                 = useState(isEdit ? taskToForm(editTask!) : EMPTY_FORM)
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
      ? `${apiBase}/api/v1/app/tasks/${editTask!.id}/`
      : `${apiBase}/api/v1/app/tasks/`

    try {
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          Authorization:   `Bearer ${accessToken}`,
          "X-Tenant-Slug": tenantSlug,
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({
          title:       form.title.trim(),
          status:      form.status,
          priority:    form.priority,
          description: form.description.trim(),
          due_date:    form.due_date || null,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const msg = body?.detail ?? body?.title?.[0] ?? `HTTP ${res.status}`
        throw new Error(msg)
      }

      const saved: Task = await res.json()
      onSaved(saved, isEdit)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar tarea")
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
        {isEdit ? "Editar tarea" : "Nueva tarea"}
      </p>

      {/* Title */}
      <input
        type="text"
        value={form.title}
        onChange={(e) => setField("title", e.target.value)}
        placeholder="Título de la tarea *"
        maxLength={500}
        required
        className={inputCls}
        autoFocus
      />

      {/* Status + Priority (row) */}
      <div className="grid grid-cols-2 gap-2">
        <select
          value={form.status}
          onChange={(e) => setField("status", e.target.value as TaskStatus)}
          className={inputCls + " cursor-pointer"}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value} className="bg-gray-900">
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={form.priority}
          onChange={(e) => setField("priority", e.target.value as TaskPriority)}
          className={inputCls + " cursor-pointer"}
        >
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value} className="bg-gray-900">
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Due date */}
      <input
        type="date"
        value={form.due_date}
        onChange={(e) => setField("due_date", e.target.value)}
        className={inputCls + " cursor-pointer"}
      />

      {/* Description */}
      <textarea
        value={form.description}
        onChange={(e) => setField("description", e.target.value)}
        placeholder="Descripción (opcional)"
        rows={3}
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
          {isEdit ? "Guardar cambios" : "Crear tarea"}
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
// TasksPanel
// ---------------------------------------------------------------------------
export default function TasksPanel() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const accessToken     = useAuthStore((s) => s.accessToken)
  const tenantSlug      = useAuthStore((s) => s.tenant?.slug)

  const [tasks, setTasks]           = useState<Task[]>([])
  const [isLoading, setIsLoading]   = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [search, setSearch]         = useState("")
  const [activeStatus, setActiveStatus] = useState<TaskStatus | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  // undefined = form closed | null = new task | Task = edit mode
  const [formTarget, setFormTarget] = useState<Task | null | undefined>(undefined)

  const showForm = formTarget !== undefined

  const fetchTasks = useCallback(async () => {
    if (!accessToken || !tenantSlug) {
      console.warn("[TasksPanel] fetchTasks called without accessToken or tenantSlug")
      return
    }
    setIsLoading(true)
    setError(null)

    const apiBase = import.meta.env.VITE_API_URL ?? "http://rbac.local.test"
    const url = `${apiBase}/api/v1/app/tasks/`
    console.log("[TasksPanel] fetching →", url)

    try {
      const res = await fetch(url, {
        headers: {
          Authorization:   `Bearer ${accessToken}`,
          "X-Tenant-Slug": tenantSlug,
        },
      })
      console.log("[TasksPanel] response status:", res.status, res.statusText)

      if (!res.ok) {
        const body = await res.text().catch(() => "(sin body)")
        console.error("[TasksPanel] HTTP error body:", body)
        throw new Error(`HTTP ${res.status} ${res.statusText}`)
      }

      const data = await res.json()
      const list: Task[] = data.tasks ?? data.results ?? []
      console.log("[TasksPanel] tasks count:", list.length)
      setTasks(list)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cargar tareas"
      console.error("[TasksPanel] fetch error:", err)
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, tenantSlug])

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks()
    } else {
      setTasks([])
      setError(null)
      setFormTarget(undefined)
    }
  }, [isAuthenticated, fetchTasks])

  function handleSaved(task: Task, isEdit: boolean) {
    if (isEdit) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)))
    } else {
      setTasks((prev) => [task, ...prev])
    }
    setFormTarget(undefined)
  }

  async function handleDelete(id: string) {
    if (!accessToken || !tenantSlug) return
    const apiBase = import.meta.env.VITE_API_URL ?? "http://rbac.local.test"
    try {
      const res = await fetch(`${apiBase}/api/v1/app/tasks/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization:   `Bearer ${accessToken}`,
          "X-Tenant-Slug": tenantSlug,
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setTasks((prev) => prev.filter((t) => t.id !== id))
      if (expandedId === id) setExpandedId(null)
    } catch (err) {
      console.error("[TasksPanel] delete error:", err)
    }
  }

  function openEditForm(task: Task) {
    setExpandedId(null)
    setFormTarget(task)
  }

  function toggleFormOrClose() {
    setFormTarget((prev) => (prev !== undefined ? undefined : null))
  }

  // Unique statuses present in the list (for filter pills)
  const presentStatuses = useMemo(() => {
    const set = new Set(tasks.map((t) => t.status))
    return STATUSES.filter((s) => set.has(s.value))
  }, [tasks])

  // Filtered list
  const filtered = useMemo(() => {
    let list = tasks
    if (activeStatus) {
      list = list.filter((t) => t.status === activeStatus)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.assignee_name?.toLowerCase().includes(q)
      )
    }
    return list
  }, [tasks, activeStatus, search])

  // Count by status for header summary
  const countByStatus = useMemo(() => {
    const map: Partial<Record<TaskStatus, number>> = {}
    for (const t of tasks) {
      map[t.status] = (map[t.status] ?? 0) + 1
    }
    return map
  }, [tasks])

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <Lock size={32} className="text-gray-600" />
        <p className="text-sm text-gray-400">Inicia sesión para ver tus tareas</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-100">Tareas</h2>
          <div className="flex items-center gap-1">
            {!isLoading && !error && tasks.length > 0 && (
              <span className="text-xs text-gray-500 mr-1">{filtered.length}</span>
            )}
            <button
              onClick={toggleFormOrClose}
              className={`rounded p-1 transition-colors ${
                showForm && formTarget === null
                  ? "text-blue-400 bg-blue-500/20 hover:bg-blue-500/30"
                  : "text-gray-500 hover:text-gray-200 hover:bg-white/10"
              }`}
              title={showForm ? "Cancelar" : "Nueva tarea"}
            >
              {showForm && formTarget === null ? <X size={13} /> : <Plus size={13} />}
            </button>
            <button
              onClick={fetchTasks}
              disabled={isLoading}
              className="rounded p-1 text-gray-500 hover:text-gray-200 hover:bg-white/10 transition-colors disabled:opacity-40"
              title="Actualizar"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Status summary pills (when there are tasks) */}
        {!isLoading && !error && tasks.length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {STATUSES.map((s) => {
              const count = countByStatus[s.value] ?? 0
              if (!count) return null
              return (
                <span key={s.value} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[s.value]}`}>
                  {s.label} · {count}
                </span>
              )
            })}
          </div>
        )}
      </header>

      {/* Create / Edit form */}
      {showForm && accessToken && tenantSlug && (
        <TaskForm
          editTask={formTarget ?? null}
          accessToken={accessToken}
          tenantSlug={tenantSlug}
          onCancel={() => setFormTarget(undefined)}
          onSaved={handleSaved}
        />
      )}

      {/* Search + status filter pills */}
      {!isLoading && !error && tasks.length > 0 && (
        <div className="shrink-0 border-b border-white/10 px-3 py-2 space-y-2">
          {/* Search */}
          <div className="relative flex items-center">
            <Search size={12} className="absolute left-2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar tareas…"
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

          {/* Status filter pills */}
          {presentStatuses.length >= 2 && (
            <div className="flex flex-wrap gap-1">
              {presentStatuses.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setActiveStatus((prev) => (prev === s.value ? null : s.value))}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase transition-colors ${
                    activeStatus === s.value
                      ? STATUS_STYLES[s.value] + " ring-1 ring-white/30"
                      : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isLoading && <TasksSkeleton />}

      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <AlertCircle size={28} className="text-red-400" />
          <p className="text-sm text-gray-400">{error}</p>
          <p className="text-[10px] text-gray-600 font-mono break-all">
            {import.meta.env.VITE_API_URL ?? "http://rbac.local.test"}/api/v1/app/tasks/
          </p>
          <button
            onClick={fetchTasks}
            className="rounded-md bg-white/10 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/20 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !error && tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <CheckSquare size={32} className="text-gray-600" />
          <p className="text-sm text-gray-400">No tienes tareas aún</p>
          <button
            onClick={() => setFormTarget(null)}
            className="rounded-md bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 text-xs text-blue-300 hover:bg-blue-600/30 transition-colors"
          >
            Crear primera tarea
          </button>
        </div>
      )}

      {!isLoading && !error && tasks.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-8 text-center">
          <Search size={24} className="text-gray-600" />
          <p className="text-sm text-gray-400">Sin resultados</p>
        </div>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isExpanded={expandedId === task.id}
              onToggleExpand={() => toggleExpand(task.id)}
              onEdit={() => openEditForm(task)}
              onDelete={() => handleDelete(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
