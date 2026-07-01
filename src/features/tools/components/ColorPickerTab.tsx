import { useState, useMemo, useCallback, useEffect } from "react"
import { Copy, Plus, Trash2, Check } from "lucide-react"

const STORAGE_KEY = "tools-saved-colors"
const MAX_SAVED = 12

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "")
  const n = parseInt(clean.length === 3
    ? clean.split("").map(c => c + c).join("")
    : clean, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("")
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return [0, 0, Math.round(l * 100)]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  switch (max) {
    case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break
    case gn: h = ((bn - rn) / d + 2) / 6; break
    case bn: h = ((rn - gn) / d + 4) / 6; break
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hn = h / 360, sn = s / 100, ln = l / 100
  if (sn === 0) {
    const v = Math.round(ln * 255)
    return [v, v, v]
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1/6) return p + (q - p) * 6 * tt
    if (tt < 1/2) return q
    if (tt < 2/3) return p + (q - p) * (2/3 - tt) * 6
    return p
  }
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn
  const p = 2 * ln - q
  return [
    Math.round(hue2rgb(p, q, hn + 1/3) * 255),
    Math.round(hue2rgb(p, q, hn) * 255),
    Math.round(hue2rgb(p, q, hn - 1/3) * 255),
  ]
}

const isValidHex = (h: string) => /^#[0-9a-fA-F]{6}$/.test(h)

const inputCls =
  "w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/25 transition-colors font-mono"

export default function ColorPickerTab() {
  const [hex, setHex] = useState("#6366f1")
  const [hexInput, setHexInput] = useState("#6366f1")
  const [copied, setCopied] = useState<string | null>(null)
  const [savedColors, setSavedColors] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
    } catch { return [] }
  })

  const [r, g, b] = useMemo(() => hexToRgb(hex), [hex])
  const [h, s, l] = useMemo(() => rgbToHsl(r, g, b), [r, g, b])

  const applyHex = useCallback((value: string) => {
    if (isValidHex(value)) {
      setHex(value)
      setHexInput(value)
    }
  }, [])

  const handleHexInput = (value: string) => {
    const normalized = value.startsWith("#") ? value : `#${value}`
    setHexInput(normalized)
    if (isValidHex(normalized)) setHex(normalized)
  }

  const handleRgbChange = (channel: "r" | "g" | "b", value: string) => {
    const n = Math.max(0, Math.min(255, parseInt(value) || 0))
    const nr = channel === "r" ? n : r
    const ng = channel === "g" ? n : g
    const nb = channel === "b" ? n : b
    const newHex = rgbToHex(nr, ng, nb)
    setHex(newHex)
    setHexInput(newHex)
  }

  const handleHslChange = (channel: "h" | "s" | "l", value: string) => {
    const max = channel === "h" ? 360 : 100
    const n = Math.max(0, Math.min(max, parseInt(value) || 0))
    const nh = channel === "h" ? n : h
    const ns = channel === "s" ? n : s
    const nl = channel === "l" ? n : l
    const [nr, ng, nb] = hslToRgb(nh, ns, nl)
    const newHex = rgbToHex(nr, ng, nb)
    setHex(newHex)
    setHexInput(newHex)
  }

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(text)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  const saveColor = () => {
    if (savedColors.includes(hex) || savedColors.length >= MAX_SAVED) return
    const next = [hex, ...savedColors]
    setSavedColors(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const removeColor = (color: string) => {
    const next = savedColors.filter(c => c !== color)
    setSavedColors(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  useEffect(() => {
    setHexInput(hex)
  }, [hex])

  const CopyBtn = ({ text }: { text: string }) => (
    <button
      onClick={() => copy(text)}
      className="ml-1 rounded p-1 text-gray-600 hover:text-blue-300 hover:bg-blue-500/20 transition-colors"
    >
      {copied === text ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
    </button>
  )

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Color preview + picker */}
      <div className="flex items-center gap-3">
        <label className="relative cursor-pointer">
          <div
            className="h-14 w-14 rounded-lg border-2 border-white/10 shadow-lg"
            style={{ backgroundColor: hex }}
          />
          <input
            type="color"
            value={hex}
            onChange={(e) => applyHex(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex items-center">
            <input
              value={hexInput}
              onChange={(e) => handleHexInput(e.target.value)}
              className={inputCls}
              placeholder="#000000"
              maxLength={7}
            />
            <CopyBtn text={hex} />
          </div>
          <div className="flex gap-1">
            <button
              onClick={saveColor}
              disabled={savedColors.includes(hex) || savedColors.length >= MAX_SAVED}
              title="Guardar color"
              className="flex items-center gap-1 rounded bg-white/5 px-2 py-1 text-[10px] text-gray-400 hover:bg-white/10 hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={10} /> Guardar
            </button>
          </div>
        </div>
      </div>

      {/* RGB */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
          RGB
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {(["r", "g", "b"] as const).map((ch, i) => (
            <div key={ch}>
              <div className="text-[9px] text-gray-600 mb-0.5 uppercase">{ch}</div>
              <input
                type="number"
                min={0}
                max={255}
                value={[r, g, b][i]}
                onChange={(e) => handleRgbChange(ch, e.target.value)}
                className={inputCls}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex items-center">
          <span className="text-[10px] font-mono text-gray-500">
            rgb({r}, {g}, {b})
          </span>
          <CopyBtn text={`rgb(${r}, ${g}, ${b})`} />
        </div>
      </div>

      {/* HSL */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
          HSL
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {(["h", "s", "l"] as const).map((ch, i) => (
            <div key={ch}>
              <div className="text-[9px] text-gray-600 mb-0.5 uppercase">
                {ch}{ch !== "h" ? "%" : "°"}
              </div>
              <input
                type="number"
                min={0}
                max={ch === "h" ? 360 : 100}
                value={[h, s, l][i]}
                onChange={(e) => handleHslChange(ch, e.target.value)}
                className={inputCls}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex items-center">
          <span className="text-[10px] font-mono text-gray-500">
            hsl({h}°, {s}%, {l}%)
          </span>
          <CopyBtn text={`hsl(${h}, ${s}%, ${l}%)`} />
        </div>
      </div>

      {/* Saved palette */}
      {savedColors.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Guardados ({savedColors.length}/{MAX_SAVED})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {savedColors.map((color) => (
              <div key={color} className="group relative">
                <button
                  onClick={() => { applyHex(color); copy(color) }}
                  title={color}
                  className="h-8 w-8 rounded border-2 border-white/10 hover:border-white/30 transition-colors"
                  style={{ backgroundColor: color }}
                />
                <button
                  onClick={() => removeColor(color)}
                  className="absolute -right-1 -top-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-[#1e1e2e] border border-white/20 text-gray-500 hover:text-red-400"
                >
                  <Trash2 size={8} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
