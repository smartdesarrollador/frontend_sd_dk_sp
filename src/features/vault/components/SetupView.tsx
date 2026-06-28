import { useState } from 'react'
import { ShieldCheck, Eye, EyeOff, Copy, Check } from 'lucide-react'
import { useMasterPassword } from '../hooks/useMasterPassword'

interface Props {
  onSetupComplete: () => void
}

export default function SetupView({ onSetupComplete }: Props) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const { setup, loading, error } = useMasterPassword()

  const mismatch = password.length > 0 && confirm.length > 0 && password !== confirm
  const tooShort = password.length > 0 && password.length < 8

  const handleSubmit = async () => {
    if (password !== confirm || password.length < 8) return
    const result = await setup(password)
    if (result) setRecoveryCode(result.recovery_code)
  }

  const handleCopy = () => {
    if (!recoveryCode) return
    navigator.clipboard.writeText(recoveryCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (recoveryCode) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2 text-green-400">
          <ShieldCheck size={18} />
          <span className="text-sm font-medium">Bóveda configurada</span>
        </div>
        <p className="text-xs text-gray-400">
          Guarda este código de recuperación en un lugar seguro. Lo necesitarás si olvidas tu contraseña maestra.
        </p>
        <div className="rounded-lg border border-white/10 bg-[#1e1e2e] p-3">
          <p className="break-all font-mono text-xs text-amber-300">{recoveryCode}</p>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-xs text-gray-300 hover:bg-white/5"
        >
          {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
          {copied ? 'Copiado' : 'Copiar código'}
        </button>
        <button
          onClick={onSetupComplete}
          className="rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Ya lo guardé → Entrar
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2 text-gray-200">
        <ShieldCheck size={18} />
        <span className="text-sm font-semibold">Configurar Bóveda</span>
      </div>
      <p className="text-xs text-gray-400">
        Crea una contraseña maestra para proteger tus credenciales. Esta contraseña no se puede recuperar sin el código de recuperación.
      </p>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña maestra"
            className="w-full rounded-lg border border-white/10 bg-[#1e1e2e] px-3 py-2 pr-9 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-200"
          >
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {tooShort && <p className="text-xs text-red-400">Mínimo 8 caracteres.</p>}

        <input
          type={showPw ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirmar contraseña"
          className="w-full rounded-lg border border-white/10 bg-[#1e1e2e] px-3 py-2 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500"
        />
        {mismatch && <p className="text-xs text-red-400">Las contraseñas no coinciden.</p>}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || password.length < 8 || password !== confirm}
          className="rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Configurando…' : 'Configurar Bóveda'}
        </button>
      </div>
    </div>
  )
}
