import { FileText, UserPlus, Code2, Trash2 } from 'lucide-react'
import type { ConvertTarget } from '../types'

interface ConvertMenuProps {
  onConvert: (target: ConvertTarget) => void
  onDelete?: () => void
  disabled?: boolean
}

const OPTIONS: { target: ConvertTarget; label: string; icon: typeof FileText }[] = [
  { target: 'note', label: 'Convertir a Nota', icon: FileText },
  { target: 'contact', label: 'Convertir a Contacto', icon: UserPlus },
  { target: 'snippet', label: 'Convertir a Snippet', icon: Code2 },
]

export function ConvertMenu({ onConvert, onDelete, disabled = false }: ConvertMenuProps) {
  return (
    <div
      role="menu"
      className="absolute z-20 mt-1 w-48 bg-[#1e1e2e] border border-white/10 rounded-lg shadow-xl py-1"
    >
      {OPTIONS.map(({ target, label, icon: Icon }) => (
        <button
          key={target}
          type="button"
          role="menuitem"
          disabled={disabled}
          onClick={() => onConvert(target)}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/10 disabled:opacity-50 transition-colors"
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
      {onDelete && (
        <>
          <div className="my-1 border-t border-white/10" />
          <button
            type="button"
            role="menuitem"
            disabled={disabled}
            onClick={onDelete}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-white/10 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Eliminar mensaje
          </button>
        </>
      )}
    </div>
  )
}
