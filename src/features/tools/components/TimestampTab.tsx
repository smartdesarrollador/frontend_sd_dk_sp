import { useState, useEffect, useCallback } from "react"
import { Copy, RefreshCw, Check } from "lucide-react"

const TIMEZONES = [
  { label: "UTC",              tz: "UTC"                    },
  { label: "México (CDT)",     tz: "America/Mexico_City"    },
  { label: "Bogotá",           tz: "America/Bogota"         },
  { label: "Lima",             tz: "America/Lima"           },
  { label: "New York",         tz: "America/New_York"       },
  { label: "Los Angeles",      tz: "America/Los_Angeles"    },
  { label: "Madrid",           tz: "Europe/Madrid"          },
  { label: "London",           tz: "Europe/London"          },
  { label: "Tokio",            tz: "Asia/Tokyo"             },
  { label: "Shanghai",         tz: "Asia/Shanghai"          },
]

function formatInTz(ts: number, tz: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      timeZone: tz,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    }).format(new Date(ts * 1000))
  } catch {
    return "—"
  }
}

const inputCls =
  "w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/25 transition-colors font-mono"

export default function TimestampTab() {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))
  const [unixInput, setUnixInput] = useState("")
  const [dateInput, setDateInput] = useState("")
  const [timeInput, setTimeInput] = useState("00:00:00")
  const [selectedTz, setSelectedTz] = useState("UTC")
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(id)
  }, [])

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(text)
      setTimeout(() => setCopied(null), 1500)
    })
  }, [])

  const CopyBtn = ({ text }: { text: string }) => (
    <button
      onClick={() => copy(text)}
      className="rounded p-1 text-gray-600 hover:text-blue-300 hover:bg-blue-500/20 transition-colors flex-shrink-0"
    >
      {copied === text ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
    </button>
  )

  // Unix → Date
  const unixTs = parseInt(unixInput)
  const unixValid = !isNaN(unixTs) && unixTs > 0

  const unixResult = unixValid ? formatInTz(unixTs, selectedTz) : null
  const unixIso = unixValid ? new Date(unixTs * 1000).toISOString() : null

  // Date → Unix
  const dateToUnix = (() => {
    if (!dateInput) return null
    try {
      const dtStr = `${dateInput}T${timeInput || "00:00:00"}`
      const tz = TIMEZONES.find(t => t.tz === selectedTz)?.tz ?? "UTC"
      // Interpret the input date/time as being in the selected timezone
      const d = new Date(dtStr + "Z")
      const tzOffset = getOffsetMs(d, tz)
      const adjusted = new Date(d.getTime() - tzOffset)
      const ts = Math.floor(adjusted.getTime() / 1000)
      return isNaN(ts) ? null : ts
    } catch {
      return null
    }
  })()

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Section: Now */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Ahora
        </div>
        <div className="rounded-lg bg-black/30 border border-white/10 p-3 flex items-center justify-between">
          <div>
            <div className="font-mono text-xl font-semibold text-gray-100">{now}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {formatInTz(now, selectedTz)} ({selectedTz})
            </div>
          </div>
          <div className="flex items-center gap-1">
            <CopyBtn text={String(now)} />
            <button
              onClick={() => setUnixInput(String(now))}
              title="Usar en conversor"
              className="rounded p-1 text-gray-600 hover:text-blue-300 hover:bg-blue-500/20 transition-colors"
            >
              <RefreshCw size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* Timezone selector */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Zona horaria
        </div>
        <select
          value={selectedTz}
          onChange={(e) => setSelectedTz(e.target.value)}
          className="w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-white/25 transition-colors"
        >
          {TIMEZONES.map(({ label, tz }) => (
            <option key={tz} value={tz}>{label}</option>
          ))}
        </select>
      </div>

      {/* Unix → Fecha */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Unix → Fecha
        </div>
        <div className="flex gap-2 mb-2">
          <input
            type="number"
            value={unixInput}
            onChange={(e) => setUnixInput(e.target.value)}
            placeholder="1234567890"
            className={inputCls}
          />
        </div>
        {unixResult && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between rounded bg-white/5 px-2 py-1.5">
              <span className="font-mono text-[11px] text-blue-300">{unixResult}</span>
              <CopyBtn text={unixResult} />
            </div>
            {unixIso && (
              <div className="flex items-center justify-between rounded bg-white/5 px-2 py-1.5">
                <span className="font-mono text-[10px] text-gray-400 truncate">{unixIso}</span>
                <CopyBtn text={unixIso} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fecha → Unix */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Fecha → Unix
        </div>
        <div className="flex flex-col gap-1.5 mb-2">
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className={inputCls}
          />
          <input
            type="time"
            step="1"
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            className={inputCls}
          />
        </div>
        {dateToUnix !== null && (
          <div className="flex items-center justify-between rounded bg-white/5 px-2 py-1.5">
            <span className="font-mono text-[11px] text-blue-300">{dateToUnix}</span>
            <CopyBtn text={String(dateToUnix)} />
          </div>
        )}
      </div>
    </div>
  )
}

function getOffsetMs(date: Date, tz: string): number {
  const utcStr = date.toLocaleString("en-US", { timeZone: "UTC" })
  const tzStr  = date.toLocaleString("en-US", { timeZone: tz })
  return new Date(utcStr).getTime() - new Date(tzStr).getTime()
}
