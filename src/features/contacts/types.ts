export interface ContactGroup {
  id: string
  name: string
  color: string
  contacts_count: number
}

export interface Contact {
  id: string
  name: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
  job_title: string
  notes: string
  group: { id: string; name: string; color: string } | null
  is_shared: boolean
  shared_by_name: string | null
  created_at: string
  updated_at: string
}

export interface ContactsPagination {
  page: number
  per_page: number
  total: number
}

export interface ContactsResponse {
  contacts: Contact[]
  pagination: ContactsPagination
}

export const DEFAULT_PER_PAGE = 20
