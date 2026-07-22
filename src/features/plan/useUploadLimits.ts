import { useEffect, useState } from "react"
import { apiFetch } from "../../lib/apiFetch"
import { useAuthStore } from "../../store/authStore"

/**
 * Límites de subida (MB) del plan del tenant, leídos de GET /api/v1/features/.
 *
 * El Desktop no usa TanStack Query, así que se cachea a nivel de módulo: una sola
 * llamada por sesión, no una por montaje del composer. El chequeo resultante es solo
 * feedback inmediato — el backend (utils/uploads.py) es siempre la autoridad y rechaza
 * con 400/402, por lo que un desfase de unos minutos tras un cambio del Admin es
 * inofensivo.
 */
export interface UploadLimits {
  imageMb: number | null
  fileMb: number | null
}

const DEFAULTS: UploadLimits = { imageMb: null, fileMb: null }

let cached: UploadLimits | null = null

function parseLimits(data: unknown): UploadLimits {
  const limits =
    data && typeof data === "object"
      ? (data as { limits?: Record<string, unknown> }).limits
      : undefined
  const num = (v: unknown): number | null => (typeof v === "number" ? v : null)
  return {
    imageMb: num(limits?.image_upload_mb),
    fileMb: num(limits?.file_upload_mb),
  }
}

export function useUploadLimits(): UploadLimits {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [limits, setLimits] = useState<UploadLimits>(cached ?? DEFAULTS)

  useEffect(() => {
    if (!isAuthenticated || cached) return
    apiFetch("/api/v1/features/")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return
        cached = parseLimits(data)
        setLimits(cached)
      })
      .catch(() => {
        /* silencioso: el composer cae a su default y el backend valida igual */
      })
  }, [isAuthenticated])

  return limits
}
