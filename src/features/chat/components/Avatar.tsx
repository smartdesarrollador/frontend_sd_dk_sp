import { Bookmark, Users } from 'lucide-react'
import { avatarColorClass, initials } from '../utils'

interface AvatarProps {
  name: string
  color?: string
  isGroup?: boolean
  isSelf?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
}

export function Avatar({ name, color = 'blue', isGroup = false, isSelf = false, size = 'md' }: AvatarProps) {
  return (
    <div
      className={`${SIZES[size]} ${avatarColorClass(color)} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
      aria-hidden="true"
    >
      {isSelf ? (
        <Bookmark className="w-1/2 h-1/2" />
      ) : isGroup ? (
        <Users className="w-1/2 h-1/2" />
      ) : (
        initials(name)
      )}
    </div>
  )
}
