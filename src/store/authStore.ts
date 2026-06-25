import { create } from 'zustand'

export interface DesktopUser {
  id: string
  name: string
  email: string
  roles: string[]
  tenantId?: string
}

export interface DesktopTenant {
  id: string
  name: string
  slug: string
  plan: string
  primaryColor?: string
  subdomain?: string
}

interface DesktopAuthState {
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  user: DesktopUser | null
  tenant: DesktopTenant | null
  setAuth: (
    accessToken: string,
    refreshToken: string,
    user: DesktopUser,
    tenant: DesktopTenant,
  ) => void
  setAccessToken: (accessToken: string, refreshToken: string) => void
  clearAuth: () => void
}

function loadFromStorage<T>(key: string): T | null {
  try {
    const val = localStorage.getItem(key)
    return val ? (JSON.parse(val) as T) : null
  } catch {
    return null
  }
}

export const useAuthStore = create<DesktopAuthState>((set) => ({
  isAuthenticated: !!localStorage.getItem('desktop-accessToken'),
  accessToken: localStorage.getItem('desktop-accessToken'),
  refreshToken: localStorage.getItem('desktop-refreshToken'),
  user: loadFromStorage<DesktopUser>('desktop-authUser'),
  tenant: loadFromStorage<DesktopTenant>('desktop-authTenant'),

  setAuth: (accessToken, refreshToken, user, tenant) => {
    localStorage.setItem('desktop-accessToken', accessToken)
    localStorage.setItem('desktop-refreshToken', refreshToken)
    localStorage.setItem('desktop-authUser', JSON.stringify(user))
    localStorage.setItem('desktop-authTenant', JSON.stringify(tenant))
    set({ isAuthenticated: true, accessToken, refreshToken, user, tenant })
  },

  setAccessToken: (accessToken, refreshToken) => {
    localStorage.setItem('desktop-accessToken', accessToken)
    localStorage.setItem('desktop-refreshToken', refreshToken)
    set({ accessToken, refreshToken })
  },

  clearAuth: () => {
    localStorage.removeItem('desktop-accessToken')
    localStorage.removeItem('desktop-refreshToken')
    localStorage.removeItem('desktop-authUser')
    localStorage.removeItem('desktop-authTenant')
    localStorage.removeItem('desktop-auth-state')
    set({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      user: null,
      tenant: null,
    })
  },
}))
