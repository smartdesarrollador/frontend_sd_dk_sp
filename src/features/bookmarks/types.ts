export interface BookmarkCollection {
  id: string
  name: string
  color: string
  bookmarks_count: number
}

export interface BookmarkItem {
  id: string
  url: string
  title: string
  description: string
  tags: string[]
  favicon_url: string
  collection: { id: string; name: string; color: string } | null
  created_at: string
  updated_at: string
}

export interface BookmarksPagination {
  page: number
  per_page: number
  total: number
}

export interface BookmarksResponse {
  bookmarks: BookmarkItem[]
  pagination: BookmarksPagination
}

export const DEFAULT_PER_PAGE = 20

export const COLLECTION_COLOR_PRESETS = [
  "#2563eb", "#16a34a", "#dc2626", "#9333ea",
  "#d97706", "#0891b2", "#db2777", "#65a30d",
]
