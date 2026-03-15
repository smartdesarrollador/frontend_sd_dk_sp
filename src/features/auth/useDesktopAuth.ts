import { useEffect, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useAuthStore } from '../../store/authStore'
import type { DesktopUser, DesktopTenant } from '../../store/authStore'

interface DeepLinkPayload {
  access_token: string
  refresh_token: string
  user: DesktopUser
  tenant: DesktopTenant
}

export function useDesktopAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const tenant = useAuthStore((s) => s.tenant)
  const setAuth = useAuthStore((s) => s.setAuth)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function stopPolling() {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  function processDeepLinkUrl(rawUrl: string) {
    try {
      const url = new URL(rawUrl)
      const payloadB64 = url.searchParams.get('payload')
      const state = url.searchParams.get('state')

      const savedState = localStorage.getItem('desktop-auth-state')
      if (!payloadB64 || !state || state !== savedState) {
        console.error('[DesktopAuth] Invalid deep link state — ignoring')
        return
      }

      localStorage.removeItem('desktop-auth-state')

      const decoded = JSON.parse(atob(payloadB64)) as DeepLinkPayload
      setAuth(decoded.access_token, decoded.refresh_token, decoded.user, decoded.tenant)
    } catch (e) {
      console.error('[DesktopAuth] Failed to parse deep link payload', e)
    } finally {
      setIsLoggingIn(false)
      stopPolling()
    }
  }

  // Poll Rust for the deep-link URL every 500ms while waiting for auth
  useEffect(() => {
    if (!isLoggingIn) {
      stopPolling()
      return
    }

    pollRef.current = setInterval(async () => {
      try {
        const url = await invoke<string | null>('poll_deep_link_url')
        if (url) {
          processDeepLinkUrl(url)
        }
      } catch (e) {
        console.error('[DesktopAuth] poll_deep_link_url error', e)
      }
    }, 500)

    // Stop polling after 120s regardless
    const timeout = setTimeout(() => {
      setIsLoggingIn(false)
      stopPolling()
    }, 120_000)

    return () => {
      stopPolling()
      clearTimeout(timeout)
    }
  }, [isLoggingIn]) // eslint-disable-line react-hooks/exhaustive-deps

  async function login() {
    const nonce = crypto.randomUUID()
    localStorage.setItem('desktop-auth-state', nonce)
    setIsLoggingIn(true)
    try {
      await invoke('open_hub_login', { stateNonce: nonce })
    } catch (e) {
      console.error('[DesktopAuth] Failed to open hub login', e)
      setIsLoggingIn(false)
    }
  }

  async function logout() {
    await invoke('clear_desktop_auth').catch(() => {})
    clearAuth()
  }

  return { isAuthenticated, user, tenant, isLoggingIn, login, logout }
}
