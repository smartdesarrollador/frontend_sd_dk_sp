export interface Snippet {
  id: string
  title: string
  description: string
  code: string
  language: string
  tags: string[]
  is_favorite: boolean
  usage_count: number
  is_shared: boolean
  shared_by_name: string | null
  created_at: string
  updated_at: string
}

export const LANGUAGES = [
  "javascript", "typescript", "python", "bash", "sql",
  "html", "css", "json", "yaml", "dockerfile",
  "go", "rust", "java", "other",
] as const

export const LANG_COLORS: Record<string, string> = {
  javascript: "bg-yellow-900/40 text-yellow-300",
  typescript: "bg-blue-900/40 text-blue-300",
  python:     "bg-green-900/40 text-green-300",
  bash:       "bg-gray-700/60 text-gray-200",
  sql:        "bg-orange-900/40 text-orange-300",
  html:       "bg-red-900/40 text-red-300",
  css:        "bg-purple-900/40 text-purple-300",
  json:       "bg-teal-900/40 text-teal-300",
  yaml:       "bg-teal-900/40 text-teal-300",
  dockerfile: "bg-sky-900/40 text-sky-300",
  go:         "bg-cyan-900/40 text-cyan-300",
  rust:       "bg-orange-900/40 text-orange-300",
  java:       "bg-red-900/40 text-red-300",
  other:      "bg-gray-700/60 text-gray-300",
}

export function langColor(language: string): string {
  return LANG_COLORS[language.toLowerCase()] ?? LANG_COLORS.other
}

export interface SnippetsPagination {
  page: number
  per_page: number
  total: number
}

export interface SnippetsResponse {
  snippets: Snippet[]
  pagination: SnippetsPagination
}

export const DEFAULT_PER_PAGE = 20
