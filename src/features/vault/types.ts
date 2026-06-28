export type VaultItemType = 'login' | 'api_key' | 'secure_note' | 'card'

export type VaultData = Record<string, string>

export interface VaultItem {
  id: string
  title: string
  item_type: VaultItemType
  favorite: boolean
  created_at: string
  updated_at: string
}

export interface VaultItemRevealed extends VaultItem {
  data: VaultData
}

export interface VaultItemsFilters {
  search?: string
  item_type?: VaultItemType | ''
}

export interface CreateVaultItemRequest {
  title: string
  item_type: VaultItemType
  data: VaultData
  favorite?: boolean
}

export type UpdateVaultItemRequest = Partial<CreateVaultItemRequest>

export interface VaultStatus {
  is_configured: boolean
  is_unlocked: boolean
}

export interface UnlockResponse {
  unlock_token: string
  expires_in: number
}

export interface SetupResponse {
  recovery_code: string
}
