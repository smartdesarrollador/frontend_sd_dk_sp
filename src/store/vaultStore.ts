import { create } from 'zustand'

/**
 * Ephemeral vault-unlock state. Held in memory only (NO persist / localStorage):
 * reloading the app re-locks the vault and forces re-entering the master password.
 */
interface VaultState {
  unlockToken: string | null
  expiresAt: number | null
  isUnlocked: () => boolean
  unlock: (token: string, ttlSeconds: number) => void
  lock: () => void
}

export const useVaultStore = create<VaultState>((set, get) => ({
  unlockToken: null,
  expiresAt: null,
  isUnlocked: () => {
    const { unlockToken, expiresAt } = get()
    return Boolean(unlockToken && expiresAt && Date.now() < expiresAt)
  },
  unlock: (token, ttlSeconds) =>
    set({ unlockToken: token, expiresAt: Date.now() + ttlSeconds * 1000 }),
  lock: () => set({ unlockToken: null, expiresAt: null }),
}))
