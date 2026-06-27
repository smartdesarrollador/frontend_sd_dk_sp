import { useState } from 'react'
import { ArrowLeft, Send, Check, X, Clock } from 'lucide-react'
import { Avatar } from './Avatar'
import { useConnections } from '../hooks/useConnections'
import { useInviteConnection } from '../hooks/useInviteConnection'
import { useRespondConnection } from '../hooks/useRespondConnection'

interface ConnectionsViewProps {
  onBack: () => void
}

export function ConnectionsView({ onBack }: ConnectionsViewProps) {
  const [email, setEmail] = useState('')
  const { connections, loading, refetch } = useConnections(true)

  const { invite, loading: inviting, error: inviteError } = useInviteConnection(() => {
    setEmail('')
    refetch()
  })

  const { respond, loading: responding } = useRespondConnection(refetch)

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || inviting) return
    invite(trimmed)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10 flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver"
          className="p-1 rounded-md text-gray-400 hover:bg-white/10 hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-gray-200">Conexiones</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Invite section */}
        <div className="px-3 py-3 border-b border-white/10">
          <p className="text-[11px] text-gray-400 mb-2 font-medium">Invitar por email</p>
          <form onSubmit={handleInvite} className="flex gap-1.5">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="flex-1 px-2.5 py-1.5 text-xs rounded-md bg-white/5 border border-white/10 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
            />
            <button
              type="submit"
              disabled={!email.trim() || inviting}
              aria-label="Enviar invitación"
              className="p-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          {inviteError && <p className="mt-1.5 text-[10px] text-red-400">{inviteError}</p>}
        </div>

        {/* Pending incoming */}
        {connections.pending_incoming.length > 0 && (
          <div className="px-3 py-3 border-b border-white/10">
            <p className="text-[11px] text-gray-400 mb-2 font-medium">
              Solicitudes recibidas ({connections.pending_incoming.length})
            </p>
            <div className="space-y-1.5">
              {connections.pending_incoming.map((conn) => (
                <div key={conn.id} className="flex items-center gap-2">
                  <Avatar name={conn.other_user.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-200 truncate">{conn.other_user.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{conn.tenant_name}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => respond(conn.id, 'accept')}
                      disabled={responding}
                      aria-label="Aceptar"
                      className="p-1 rounded-md bg-green-600/20 text-green-400 hover:bg-green-600/40 disabled:opacity-40 transition-colors"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => respond(conn.id, 'reject')}
                      disabled={responding}
                      aria-label="Rechazar"
                      className="p-1 rounded-md bg-red-600/20 text-red-400 hover:bg-red-600/40 disabled:opacity-40 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending outgoing */}
        {connections.pending_outgoing.length > 0 && (
          <div className="px-3 py-3 border-b border-white/10">
            <p className="text-[11px] text-gray-400 mb-2 font-medium">Solicitudes enviadas</p>
            <div className="space-y-1.5">
              {connections.pending_outgoing.map((conn) => (
                <div key={conn.id} className="flex items-center gap-2">
                  <Avatar name={conn.other_user.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-200 truncate">{conn.other_user.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{conn.tenant_name}</p>
                  </div>
                  <Clock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accepted */}
        {connections.accepted.length > 0 && (
          <div className="px-3 py-3">
            <p className="text-[11px] text-gray-400 mb-2 font-medium">
              Conexiones activas ({connections.accepted.length})
            </p>
            <div className="space-y-1.5">
              {connections.accepted.map((conn) => (
                <div key={conn.id} className="flex items-center gap-2">
                  <Avatar name={conn.other_user.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-200 truncate">{conn.other_user.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{conn.tenant_name}</p>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && connections.accepted.length === 0 &&
          connections.pending_incoming.length === 0 &&
          connections.pending_outgoing.length === 0 && (
          <div className="px-3 py-8 text-center">
            <p className="text-[11px] text-gray-500">Sin conexiones aún</p>
            <p className="text-[10px] text-gray-600 mt-1">Invita a alguien por email para chatear</p>
          </div>
        )}
      </div>
    </div>
  )
}
