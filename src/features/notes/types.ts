export interface NoteCategory {
  id: string
  name: string
  color: string
  notes_count: number
}

export interface Note {
  id: string
  title: string
  content: string
  category: { id: string; name: string; color: string } | null
  category_name: string | null
  is_pinned: boolean
  color: string
  tags: string[]
  is_shared: boolean
  shared_by_name: string | null
  created_at: string
  updated_at: string
}

export interface NotesPagination {
  page: number
  per_page: number
  total: number
}

export interface NotesResponse {
  notes: Note[]
  pagination: NotesPagination
}

export const DEFAULT_PER_PAGE = 20

export const CATEGORY_COLOR_PRESETS = [
  "#2563eb", "#16a34a", "#dc2626", "#9333ea",
  "#d97706", "#0891b2", "#db2777", "#65a30d",
]
