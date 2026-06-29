import {
  FileText,
  CheckSquare,
  Calendar,
  Users,
  Bookmark,
  Code2,
  Folder,
  Vault,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react'

export type SearchResultType =
  | 'notes'
  | 'tasks'
  | 'events'
  | 'contacts'
  | 'bookmarks'
  | 'snippets'
  | 'projects'
  | 'vault'
  | 'messages'

export interface SearchResultItem {
  type: SearchResultType
  id: string
  title: string
  snippet: string
  url: string
  created_at: string | null
}

export interface SearchGroup {
  type: SearchResultType
  label: string
  count: number
  results: SearchResultItem[]
}

export interface GlobalSearchResponse {
  query: string
  total: number
  groups: SearchGroup[]
}

export interface SearchFiltersState {
  types: SearchResultType[]
  dateFrom: string
  dateTo: string
}

export const EMPTY_FILTERS: SearchFiltersState = { types: [], dateFrom: '', dateTo: '' }

export const TYPE_LABELS: Record<SearchResultType, string> = {
  notes:     'Notas',
  tasks:     'Tareas',
  events:    'Eventos',
  contacts:  'Contactos',
  bookmarks: 'Bookmarks',
  snippets:  'Snippets',
  projects:  'Proyectos',
  vault:     'Bóveda',
  messages:  'Mensajes',
}

export const TYPE_ICONS: Record<SearchResultType, LucideIcon> = {
  notes:     FileText,
  tasks:     CheckSquare,
  events:    Calendar,
  contacts:  Users,
  bookmarks: Bookmark,
  snippets:  Code2,
  projects:  Folder,
  vault:     Vault,
  messages:  MessageSquare,
}

export const ALL_TYPES: SearchResultType[] = [
  'notes',
  'tasks',
  'events',
  'contacts',
  'bookmarks',
  'snippets',
  'projects',
  'vault',
  'messages',
]
