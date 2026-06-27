export function deriveWsUrl(path: string): string {
  const apiUrl = import.meta.env.VITE_API_URL ?? ''
  const origin = apiUrl || window.location.origin
  const wsOrigin = origin.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')
  return `${wsOrigin}${path}`
}
