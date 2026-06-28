import { useState } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { useUnlockVault } from '../hooks/useUnlockVault'
import { useMasterPassword } from '../hooks/useMasterPassword'

interface Props {
  onUnlocked: () => void
}

export default function UnlockView({ onUnlocked }: Props) {
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showRecovery, setShowRecovery] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNew, setConfirmNew] = useState('')
  const [recoveryDone, setRecoveryDone] = useState(false)

  const { unlockVault, loading: unlocking, errorMessage } = useUnlockVault(onUnlocked)
  const { recover, loading: recovering, error: recoverError } = useMasterPassword()

  const handleUnlock = () => {
    if (password) unlockVault(password)
  }

  const handleRecover = async () => {
    if (!recoveryCode || newPassword.length < 8 || newPassword !== confirmNew) return
    const ok = await recover(recoveryCode, newPassword)
    if (ok) setRecoveryDone(true)
  }

  if (recoveryDone) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <p className="text-xs text-green-400">Contraseña restablecida. Ahora puedes desbloquear la bóveda con tu nueva contraseña.</p>
        <button onClick={() => setShowRecovery(false)} className="text-xs text-blue-400 hover:underline">
          Volver a desbloquear
        </button>
      </div>
    )
  }

  if (showRecovery) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2 text-gray-200">
          <Lock size={16} />
          <span className="text-sm font-semibold">Recuperar acceso</span>
        </div>
        <p className="text-xs text-gray-400">Ingresa el código de recuperación y una nueva contraseña maestra.</p>
        <input
          type="text"
          value={recoveryCode}
          onChange={(e) => setRecoveryCode(e.target.value)}
          placeholder="Código de recuperación"
          className="w-full rounded-lg border border-white/10 bg-[#1e1e2e] px-3 py-2 font-mono text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500"
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Nueva contraseña maestra"
          className="w-full rounded-lg border border-white/10 bg-[#1e1e2e] px-3 py-2 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500"
        />
        <input
          type="password"
          value={confirmNew}
          onChange={(e) => setConfirmNew(e.target.value)}
          placeholder="Confirmar contraseña"
          className="w-full rounded-lg border border-white/10 bg-[#1e1e2e] px-3 py-2 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500"
        />
        {recoverError && <p className="text-xs text-red-400">{recoverError}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => setShowRecovery(false)}
            className="flex-1 rounded-lg border border-white/10 py-2 text-xs text-gray-400 hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            onClick={handleRecover}
            disabled={recovering || !recoveryCode || newPassword.length < 8 || newPassword !== confirmNew}
            className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {recovering ? 'Recuperando…' : 'Restablecer'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2 text-gray-200">
        <Lock size={16} />
        <span className="text-sm font-semibold">Bóveda bloqueada</span>
      </div>
      <p className="text-xs text-gray-400">Ingresa tu contraseña maestra para acceder.</p>

      <div className="relative">
        <input
          type={showPw ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
          placeholder="Contraseña maestra"
          className="w-full rounded-lg border border-white/10 bg-[#1e1e2e] px-3 py-2 pr-9 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500"
          autoFocus
        />
        <button
          type="button"
          onClick={() => setShowPw((v) => !v)}
          className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-200"
        >
          {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      {errorMessage && <p className="text-xs text-red-400">{errorMessage}</p>}

      <button
        onClick={handleUnlock}
        disabled={unlocking || !password}
        className="rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {unlocking ? 'Desbloqueando…' : 'Desbloquear'}
      </button>

      <button
        onClick={() => setShowRecovery(true)}
        className="text-xs text-gray-500 hover:text-gray-300 hover:underline"
      >
        ¿Olvidaste la contraseña?
      </button>
    </div>
  )
}
