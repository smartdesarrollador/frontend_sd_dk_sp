import { VAULT_TYPES } from '../itemTypes'
import type { VaultItemType } from '../types'

interface Props {
  type: VaultItemType
}

export default function ItemTypeBadge({ type }: Props) {
  const meta = VAULT_TYPES[type]
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${meta.color}`}>
      <Icon size={10} />
      {meta.label}
    </span>
  )
}
