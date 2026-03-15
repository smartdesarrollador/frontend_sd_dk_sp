import { UserCircle, LogOut, Loader2 } from 'lucide-react'
import { useDesktopAuth } from '../../features/auth/useDesktopAuth'

export default function ProfilePanel() {
  const { isAuthenticated, user, tenant, isLoggingIn, login, logout } = useDesktopAuth()

  if (isAuthenticated && user && tenant) {
    const initials = user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    const bgColor = tenant.primaryColor ?? '#2563eb'

    return (
      <div className="flex h-full flex-col p-4">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Perfil
        </h2>

        {/* Avatar + Name */}
        <div className="mb-4 flex flex-col items-center gap-3">
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ backgroundColor: bgColor }}
          >
            {initials}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-200">{user.name}</p>
            <p className="max-w-[140px] truncate text-xs text-gray-400">{user.email}</p>
          </div>
        </div>

        {/* Plan badge */}
        <div className="mb-3 flex justify-center">
          <span className="rounded-full border border-primary-700/50 bg-primary-900/40 px-2 py-0.5 text-xs capitalize text-primary-300">
            {tenant.plan}
          </span>
        </div>

        {/* Organization */}
        <div className="mb-4 text-center">
          <p className="text-xs text-gray-500">Organización</p>
          <p className="text-sm font-medium text-gray-300">{tenant.name}</p>
        </div>

        <div className="my-2 border-t border-gray-700/50" />

        {/* Logout */}
        <button
          onClick={logout}
          className="mt-auto flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-900/20 hover:text-red-300"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
      <UserCircle size={48} className="text-gray-500" />
      <p className="text-center text-sm text-gray-400">
        Inicia sesión para acceder a tus servicios
      </p>
      <button
        onClick={login}
        disabled={isLoggingIn}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
      >
        {isLoggingIn ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Abriendo el Hub...
          </>
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
