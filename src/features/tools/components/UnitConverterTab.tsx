import { useState, useMemo } from "react"
import { ArrowLeftRight } from "lucide-react"

type Category = "length" | "weight" | "temperature" | "data"

interface UnitDef {
  label: string
  toBase: (v: number) => number
  fromBase: (v: number) => number
}

const UNITS: Record<Category, Record<string, UnitDef>> = {
  length: {
    mm:  { label: "mm",  toBase: v => v / 1000,       fromBase: v => v * 1000       },
    cm:  { label: "cm",  toBase: v => v / 100,        fromBase: v => v * 100        },
    m:   { label: "m",   toBase: v => v,               fromBase: v => v              },
    km:  { label: "km",  toBase: v => v * 1000,        fromBase: v => v / 1000       },
    in:  { label: "in",  toBase: v => v * 0.0254,      fromBase: v => v / 0.0254     },
    ft:  { label: "ft",  toBase: v => v * 0.3048,      fromBase: v => v / 0.3048     },
    yd:  { label: "yd",  toBase: v => v * 0.9144,      fromBase: v => v / 0.9144     },
    mi:  { label: "mi",  toBase: v => v * 1609.344,    fromBase: v => v / 1609.344   },
  },
  weight: {
    mg:  { label: "mg",  toBase: v => v / 1_000_000,   fromBase: v => v * 1_000_000  },
    g:   { label: "g",   toBase: v => v / 1000,        fromBase: v => v * 1000       },
    kg:  { label: "kg",  toBase: v => v,               fromBase: v => v              },
    t:   { label: "t",   toBase: v => v * 1000,        fromBase: v => v / 1000       },
    oz:  { label: "oz",  toBase: v => v * 0.028349,    fromBase: v => v / 0.028349   },
    lb:  { label: "lb",  toBase: v => v * 0.453592,    fromBase: v => v / 0.453592   },
  },
  temperature: {
    C:   { label: "°C",  toBase: v => v,               fromBase: v => v              },
    F:   { label: "°F",  toBase: v => (v - 32) * 5/9,  fromBase: v => v * 9/5 + 32  },
    K:   { label: "K",   toBase: v => v - 273.15,       fromBase: v => v + 273.15    },
  },
  data: {
    B:   { label: "B",   toBase: v => v,               fromBase: v => v              },
    KB:  { label: "KB",  toBase: v => v * 1024,        fromBase: v => v / 1024       },
    MB:  { label: "MB",  toBase: v => v * 1024**2,     fromBase: v => v / 1024**2   },
    GB:  { label: "GB",  toBase: v => v * 1024**3,     fromBase: v => v / 1024**3   },
    TB:  { label: "TB",  toBase: v => v * 1024**4,     fromBase: v => v / 1024**4   },
  },
}

const CATEGORY_LABELS: Record<Category, string> = {
  length: "Longitud",
  weight: "Peso",
  temperature: "Temperatura",
  data: "Datos",
}

const inputCls =
  "w-full rounded bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/25 transition-colors"

const selectCls =
  "rounded bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-white/25 transition-colors"

export default function UnitConverterTab() {
  const [category, setCategory] = useState<Category>("length")
  const [fromUnit, setFromUnit] = useState("m")
  const [toUnit, setToUnit] = useState("ft")
  const [inputValue, setInputValue] = useState("1")

  const units = UNITS[category]
  const unitKeys = Object.keys(units)

  const ensureValidUnits = (cat: Category) => {
    const keys = Object.keys(UNITS[cat])
    setFromUnit(keys[0])
    setToUnit(keys[1])
  }

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat)
    ensureValidUnits(cat)
    setInputValue("1")
  }

  const swap = () => {
    setFromUnit(toUnit)
    setToUnit(fromUnit)
  }

  const result = useMemo(() => {
    const val = parseFloat(inputValue)
    if (isNaN(val)) return ""
    const from = units[fromUnit]
    const to = units[toUnit]
    if (!from || !to) return ""
    const base = from.toBase(val)
    const out = to.fromBase(base)
    const rounded = parseFloat(out.toPrecision(8))
    return rounded.toLocaleString("en-US", { maximumFractionDigits: 8 })
  }, [inputValue, fromUnit, toUnit, units])

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Category selector */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Categoría
        </div>
        <div className="grid grid-cols-2 gap-1">
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                category === cat
                  ? "bg-blue-500/20 text-blue-300"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Conversion */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Conversión
        </div>
        <div className="flex flex-col gap-2">
          {/* From */}
          <div className="flex gap-2">
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className={`${inputCls} flex-1`}
              placeholder="Valor"
            />
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className={selectCls}
            >
              {unitKeys.map((u) => (
                <option key={u} value={u}>{units[u].label}</option>
              ))}
            </select>
          </div>

          {/* Swap button */}
          <div className="flex justify-center">
            <button
              onClick={swap}
              className="flex items-center gap-1.5 rounded px-3 py-1 text-[10px] text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
            >
              <ArrowLeftRight size={12} />
              intercambiar
            </button>
          </div>

          {/* To */}
          <div className="flex gap-2">
            <div className={`${inputCls} flex-1 font-mono text-blue-300 bg-blue-500/10 border-blue-500/20`}>
              {result || "—"}
            </div>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className={selectCls}
            >
              {unitKeys.map((u) => (
                <option key={u} value={u}>{units[u].label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Formula hint */}
      {result && (
        <div className="rounded bg-white/5 border border-white/5 px-3 py-2 text-[11px] text-gray-500 font-mono">
          {inputValue} {units[fromUnit]?.label} = {result} {units[toUnit]?.label}
        </div>
      )}
    </div>
  )
}
