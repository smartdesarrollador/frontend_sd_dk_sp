import { useState, useEffect } from 'react'
import { useVaultStore } from '../../store/vaultStore'
import { useVaultStatus } from '../../features/vault/hooks/useVaultStatus'
import { useLockVault } from '../../features/vault/hooks/useLockVault'
import SetupView from '../../features/vault/components/SetupView'
import UnlockView from '../../features/vault/components/UnlockView'
import ItemList from '../../features/vault/components/ItemList'
import ItemDetail from '../../features/vault/components/ItemDetail'
import ItemForm from '../../features/vault/components/ItemForm'
import type { VaultItem, VaultItemRevealed } from '../../features/vault/types'

type VaultView = 'list' | 'detail' | 'form'

export default function VaultPanel() {
  const { status, loading: statusLoading, refetch: refetchStatus } = useVaultStatus()
  // Subscribe to actual values so the panel re-renders when lock state changes
  const unlockToken = useVaultStore((s) => s.unlockToken)
  const expiresAt = useVaultStore((s) => s.expiresAt)
  // tick forces re-render when the expiry timer fires
  const [tick, setTick] = useState(0)
  const [view, setView] = useState<VaultView>('list')
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null)
  const [itemToEdit, setItemToEdit] = useState<VaultItemRevealed | null>(null)
  const { lockVault } = useLockVault()

  // Expiry timer — re-check state when token expires
  useEffect(() => {
    if (!expiresAt) return
    const ms = Math.max(0, expiresAt - Date.now())
    const t = setTimeout(() => setTick((n) => n + 1), ms + 250)
    return () => clearTimeout(t)
  }, [expiresAt, tick])

  const unlocked = Boolean(unlockToken && expiresAt && Date.now() < expiresAt)

  const handleLock = async () => {
    await lockVault()
    setView('list')
    setSelectedItem(null)
    setItemToEdit(null)
  }

  const handleSelectItem = (item: VaultItem) => {
    setSelectedItem(item)
    setView('detail')
  }

  const handleNew = () => {
    setItemToEdit(null)
    setView('form')
  }

  const handleEdit = (revealed: VaultItemRevealed) => {
    setItemToEdit(revealed)
    setView('form')
  }

  const handleBack = () => {
    setView('list')
    setSelectedItem(null)
    setItemToEdit(null)
  }

  const handleSaved = () => {
    setView('list')
    setItemToEdit(null)
  }

  const handleDeleted = () => {
    setView('list')
    setSelectedItem(null)
  }

  // Need a refetch for ItemList/ItemDetail to share
  const [refetchKey, setRefetchKey] = useState(0)
  const triggerRefetch = () => setRefetchKey((k) => k + 1)

  if (statusLoading) {
    return (
      <div className="flex h-full flex-col gap-3 p-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-white/5" />)}
      </div>
    )
  }

  if (!status) {
    return <div className="p-4 text-xs text-red-400">No se pudo cargar el estado de la bóveda.</div>
  }

  if (!status.is_configured) {
    return <SetupView onSetupComplete={refetchStatus} />
  }

  if (!unlocked) {
    return <UnlockView onUnlocked={() => {}} />
  }

  if (view === 'form') {
    return (
      <ItemForm
        key={itemToEdit?.id ?? 'new'}
        initial={itemToEdit}
        onBack={handleBack}
        onSaved={handleSaved}
        refetchItems={triggerRefetch}
      />
    )
  }

  if (view === 'detail' && selectedItem) {
    return (
      <ItemDetail
        key={`${selectedItem.id}-${refetchKey}`}
        item={selectedItem}
        onBack={handleBack}
        onEdit={handleEdit}
        onDeleted={handleDeleted}
        refetchItems={triggerRefetch}
      />
    )
  }

  return (
    <ItemList
      key={refetchKey}
      onSelect={handleSelectItem}
      onNew={handleNew}
      onLock={handleLock}
    />
  )
}
