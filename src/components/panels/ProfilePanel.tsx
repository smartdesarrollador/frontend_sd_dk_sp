import { useState, useEffect } from 'react'
import {
  UserCircle, LogOut, Loader2,
  CheckCircle2, XCircle, ShieldCheck, Shield, CalendarDays, ExternalLink,
} from 'lucide-react'
import { useDesktopAuth } from '../../features/auth/useDesktopAuth'
import { apiFetch } from '../../lib/apiFetch'
import { openExternal } from '../../lib/openExternal'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ProfileData {
  user: {
    id: string
    name: string
    email: string
    email_verified: boolean
    mfa_enabled: boolean
    created_at: string
    roles: string[]
    tenant_plan: string
  }
  tenant: {
    id: string
    name: string
    slug: string
    subdomain?: string
    plan: string
    logo_url?: string | null
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PLAN_STYLES: Record<string, string> = {
  free:         'bg-gray-700/60 text-gray-300',
  starter:      'bg-blue-900/50 text-blue-300',
  professional: 'bg-purple-900/50 text-purple-300',
  enterprise:   'bg-amber-900/40 text-amber-300',
}

const PLAN_LABELS: Record<string, string> = {
  free:         'Free',
  starter:      'Starter',
  professional: 'Professional',
  enterprise:   'Enterprise',
}

const HUB_URL = import.meta.env.VITE_HUB_URL ?? 'http://hub.local.test'
const PLAN_ORDER = ['free', 'starter', 'professional', 'enterprise']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatMemberSince(iso: string): string {
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ---------------------------------------------------------------------------
// ProfilePanel
// ---------------------------------------------------------------------------
export default function ProfilePanel() {
  const { isAuthenticated, user: storeUser, tenant: storeTenant, isLoggingIn, login, logout } = useDesktopAuth()

  const [profile,          setProfile]          = useState<ProfileData | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isLoggingOut,     setIsLoggingOut]     = useState(false)

  useEffect(() => {
    if (!isAuthenticated) { setProfile(null); return }
    setIsLoadingProfile(true)
    apiFetch('/api/v1/auth/profile/')
      .then((r) => r.ok ? r.json() : null)
      .then((data: ProfileData | null) => { if (data) setProfile(data) })
      .catch(() => {})
      .finally(() => setIsLoadingProfile(false))
  }, [isAuthenticated])

  async function handleLogout() {
    setIsLoggingOut(true)
    const refreshToken = localStorage.getItem('desktop-refreshToken')
    if (refreshToken) {
      await apiFetch('/api/v1/auth/logout/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }).catch(() => {})
    }
    await logout()
  }

  // ── Not authenticated ──────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
        <UserCircle size={48} className="text-gray-500" />
        <p className="text-center text-sm text-gray-400">
          Inicia sesión para acceder a tus servicios
        </p>
        <button
          onClick={login}
          disabled={isLoggingIn}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {isLoggingIn ? (
            <><Loader2 size={16} className="animate-spin" /> Abriendo el Hub...</>
          ) : (
            'Iniciar sesión'
          )}
        </button>
        {isLoggingIn && (
          <p className="text-center text-xs text-gray-500">
            Se está abriendo el Hub en tu navegador...
          </p>
        )}
      </div>
    )
  }

  // Fallback to store data while API loads — never shows empty
  const displayUser   = profile?.user   ?? storeUser
  const displayTenant = profile?.tenant ?? storeTenant
  if (!displayUser || !displayTenant) return null

  const initials  = getInitials(displayUser.name)
  const bgColor   = storeTenant?.primaryColor ?? '#2563eb'
  const plan      = displayTenant.plan
  const planStyle = PLAN_STYLES[plan] ?? PLAN_STYLES.free
  const planLabel = PLAN_LABELS[plan] ?? plan
  const canUpgradePlan = PLAN_ORDER.indexOf(plan) < PLAN_ORDER.length - 1

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-100">Perfil</h2>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* ── Avatar + identity ──────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-2 px-4 py-5">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white shadow-lg"
            style={{ backgroundColor: bgColor }}
          >
            {isLoadingProfile && !profile
              ? <Loader2 size={20} className="animate-spin opacity-70" />
              : initials
            }
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-100">{displayUser.name}</p>
            <p className="max-w-[180px] truncate text-xs text-gray-400">{displayUser.email}</p>
          </div>
          {/* Role badges */}
          {profile?.user.roles && profile.user.roles.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1 mt-0.5">
              {profile.user.roles.map((role) => (
                <span key={role} className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-white/10 text-gray-300">
                  {role}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Status ─────────────────────────────────────────────────── */}
        {profile && (
          <div className="mx-3 mb-3 rounded-md border border-white/10 bg-white/5 divide-y divide-white/10">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs text-gray-400">Email verificado</span>
              {profile.user.email_verified ? (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-green-400">
                  <CheckCircle2 size={12} /> Verificado
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-yellow-400">
                  <XCircle size={12} /> Sin verificar
                </span>
              )}
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs text-gray-400">Doble factor (MFA)</span>
              {profile.user.mfa_enabled ? (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-green-400">
                  <ShieldCheck size={12} /> Activo
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-500">
                  <Shield size={12} /> Inactivo
                </span>
              )}
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs text-gray-400">Miembro desde</span>
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <CalendarDays size={11} />
                {formatMemberSince(profile.user.created_at)}
              </span>
            </div>
          </div>
        )}

        {/* ── Organización ───────────────────────────────────────────── */}
        <div className="mx-3 mb-4 rounded-md border border-white/10 bg-white/5 px-3 py-2.5 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Organización
          </p>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-200 truncate">{displayTenant.name}</p>
            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${planStyle}`}>
              {planLabel}
            </span>
          </div>
          <p className="text-[10px] text-gray-600 font-mono">{displayTenant.slug}</p>
          {canUpgradePlan && (
            <button
              onClick={() => openExternal(`${HUB_URL}/subscription`)}
              className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ExternalLink size={11} />
              Actualizar plan
            </button>
          )}
        </div>

        {/* ── Digisider link ── */}
        <div className="mx-3 mb-3 flex items-center justify-center">
          <button
            onClick={() => openExternal("https://digisider.com")}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] text-gray-700 transition-colors hover:bg-white/5 hover:text-gray-400"
          >
            <ExternalLink size={11} />
            digisider.com
          </button>
        </div>
      </div>

      {/* ── Logout ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-white/10 p-3">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-900/20 hover:text-red-300 disabled:opacity-50"
        >
          {isLoggingOut
            ? <Loader2 size={15} className="animate-spin" />
            : <LogOut size={15} />
          }
          {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
        </button>
      </div>
    </div>
  )
}
