export type TaskStatus = "todo" | "in_progress" | "review" | "done"
export type TaskPriority = "low" | "medium" | "high" | "urgent"

export interface Task {
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

export interface TasksPagination {
  page: number
  per_page: number
  total: number
}

export interface TasksResponse {
  tasks: Task[]
  pagination: TasksPagination
}

export const DEFAULT_PER_PAGE = 20

export const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo",        label: "Por hacer"   },
  { value: "in_progress", label: "En progreso" },
  { value: "review",      label: "En revisión" },
  { value: "done",        label: "Hecho"       },
]

export const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "low",    label: "Baja"     },
  { value: "medium", label: "Media"    },
  { value: "high",   label: "Alta"     },
  { value: "urgent", label: "Urgente"  },
]

export const STATUS_STYLES: Record<TaskStatus, string> = {
  todo:        "bg-gray-700/60 text-gray-300",
  in_progress: "bg-blue-900/50 text-blue-300",
  review:      "bg-purple-900/50 text-purple-300",
  done:        "bg-green-900/50 text-green-300",
}

export const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low:    "bg-gray-700/50 text-gray-400",
  medium: "bg-yellow-900/40 text-yellow-300",
  high:   "bg-orange-900/40 text-orange-300",
  urgent: "bg-red-900/50 text-red-300",
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo:        "Por hacer",
  in_progress: "En progreso",
  review:      "En revisión",
  done:        "Hecho",
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low:    "Baja",
  medium: "Media",
  high:   "Alta",
  urgent: "Urgente",
}
