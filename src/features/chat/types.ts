export type ConversationType = 'direct' | 'group' | 'self'
export type MemberRole = 'owner' | 'admin' | 'member'
export type ConvertTarget = 'note' | 'contact' | 'snippet'

export interface ChatUser {
  id: string
  name: string
  email: string
  avatar_url: string
}

export interface ConversationMember {
  id: string
  user: ChatUser
  role: MemberRole
  joined_at: string
}

export interface DisplayAvatar {
  type: 'user' | 'group' | 'self'
  name: string
  avatar_url?: string
  color: string
}

export interface LastMessage {
  id: string
  content: string
  sender_name: string
  created_at: string
}

export interface Conversation {
  id: string
  type: ConversationType
  name: string
  avatar_color: string
  display_name: string
  display_avatar: DisplayAvatar
  last_message: LastMessage | null
  unread_count: number
  member_count: number
  other_user_id: string | null
  updated_at: string
}

export interface ConversationDetail extends Conversation {
  members: ConversationMember[]
  created_at: string
}

export interface ReplyPreview {
  id: string
  content: string
  sender_name: string
}

export interface Attachment {
  id: string
  url: string
  kind: 'image' | 'file'
  original_name: string
  size: number
}

export interface Message {
  id: string
  conversation: string
  sender: ChatUser
  content: string
  reply_to: ReplyPreview | null
  is_mine: boolean
  is_deleted: boolean
  attachments: Attachment[]
  edited_at: string | null
  created_at: string
}

export interface CreateConversationRequest {
  type: ConversationType
  member_ids: string[]
  name?: string
}

export interface SendMessageRequest {
  conversation: string
  content: string
  reply_to?: string
}

export interface ConvertMessageRequest {
  target: ConvertTarget
  title?: string
  language?: string
}

export interface ConvertMessageResponse {
  target: ConvertTarget
  id: string
  title?: string
  name?: string
}

export type ConnectionStatus = 'pending' | 'accepted' | 'blocked'
export type ConnectionDirection = 'incoming' | 'outgoing'

export interface ChatConnection {
  id: string
  status: ConnectionStatus
  direction: ConnectionDirection
  other_user: ChatUser
  tenant_name: string
  created_at: string
}

export interface ConnectionsResponse {
  accepted: ChatConnection[]
  pending_incoming: ChatConnection[]
  pending_outgoing: ChatConnection[]
}

export type ConnectionAction = 'accept' | 'reject' | 'block'
