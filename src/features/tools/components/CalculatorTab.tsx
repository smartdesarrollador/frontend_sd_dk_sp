import { useState } from "react"
import { Delete } from "lucide-react"

type CalcOp = "+" | "−" | "×" | "÷" | null

const btnBase =
  "flex h-10 w-full items-center justify-center rounded text-sm font-medium transition-colors select-none"

export default function CalculatorTab() {
  const [display, setDisplay] = useState("0")
  const [expression, setExpression] = useState("")
  const [operand, setOperand] = useState<number | null>(null)
  const [op, setOp] = useState<CalcOp>(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)
  const [history, setHistory] = useState<string[]>([])

  const pushHistory = (entry: string) =>
    setHistory((h) => [entry, ...h].slice(0, 10))

  const inputDigit = (d: string) => {
    if (waitingForOperand) {
      setDisplay(d)
      setWaitingForOperand(false)
    } else {
      setDisplay(display === "0" ? d : display + d)
    }
  }

  const inputDot = () => {
    if (waitingForOperand) {
      setDisplay("0.")
      setWaitingForOperand(false)
      return
    }
    if (!display.includes(".")) setDisplay(display + ".")
  }

  const toggleSign = () => setDisplay(String(parseFloat(display) * -1))

  const inputPercent = () => setDisplay(String(parseFloat(display) / 100))

  const clear = () => {
    setDisplay("0")
    setExpression("")
    setOperand(null)
    setOp(null)
    setWaitingForOperand(false)
  }

  const backspace = () => {
    if (waitingForOperand) return
    setDisplay(display.length > 1 ? display.slice(0, -1) : "0")
  }

  const handleOp = (nextOp: CalcOp) => {
    const current = parseFloat(display)
    if (operand !== null && !waitingForOperand && op) {
      const result = compute(operand, current, op)
      setDisplay(String(result))
      setOperand(result)
      setExpression(`${result} ${nextOp}`)
    } else {
      setOperand(current)
      setExpression(`${current} ${nextOp}`)
    }
    setOp(nextOp)
    setWaitingForOperand(true)
  }

  const compute = (a: number, b: number, o: CalcOp): number => {
    switch (o) {
      case "+": return a + b
      case "−": return a - b
      case "×": return a * b
      case "÷": return b !== 0 ? a / b : 0
      default:  return b
    }
  }

  const equals = () => {
    const current = parseFloat(display)
    if (operand === null || !op) return
    const result = compute(operand, current, op)
    const formatted = Number.isFinite(result)
      ? parseFloat(result.toPrecision(12)).toString()
      : "Error"
    pushHistory(`${operand} ${op} ${current} = ${formatted}`)
    setDisplay(formatted)
    setExpression("")
    setOperand(null)
    setOp(null)
    setWaitingForOperand(true)
  }

  const displayValue = parseFloat(display).toLocaleString("en-US", {
    maximumFractionDigits: 10,
  }) + (display.endsWith(".") ? "." : "")

  return (
    <div className="flex h-full flex-col p-3 gap-3">
      {/* Display */}
      <div className="rounded-lg bg-black/30 border border-white/10 p-3">
        <div className="text-[10px] text-gray-500 min-h-[16px] truncate text-right">
          {expression || " "}
        </div>
        <div className="text-2xl font-mono font-semibold text-gray-100 text-right truncate mt-1">
          {displayValue}
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-1.5">
        {/* Row 1 */}
        <button onClick={clear} className={`${btnBase} bg-red-500/20 text-red-300 hover:bg-red-500/30`}>
          AC
        </button>
        <button onClick={toggleSign} className={`${btnBase} bg-white/5 text-gray-400 hover:bg-white/10 text-xs`}>
          ±
        </button>
        <button onClick={inputPercent} className={`${btnBase} bg-white/5 text-gray-400 hover:bg-white/10`}>
          %
        </button>
        <button onClick={() => handleOp("÷")} className={`${btnBase} ${op === "÷" && waitingForOperand ? "bg-blue-500/40 text-blue-200" : "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"}`}>
          ÷
        </button>

        {/* Row 2 */}
        {["7","8","9"].map(d => (
          <button key={d} onClick={() => inputDigit(d)} className={`${btnBase} bg-white/5 text-gray-200 hover:bg-white/10`}>{d}</button>
        ))}
        <button onClick={() => handleOp("×")} className={`${btnBase} ${op === "×" && waitingForOperand ? "bg-blue-500/40 text-blue-200" : "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"}`}>
          ×
        </button>

        {/* Row 3 */}
        {["4","5","6"].map(d => (
          <button key={d} onClick={() => inputDigit(d)} className={`${btnBase} bg-white/5 text-gray-200 hover:bg-white/10`}>{d}</button>
        ))}
        <button onClick={() => handleOp("−")} className={`${btnBase} ${op === "−" && waitingForOperand ? "bg-blue-500/40 text-blue-200" : "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"}`}>
          −
        </button>

        {/* Row 4 */}
        {["1","2","3"].map(d => (
          <button key={d} onClick={() => inputDigit(d)} className={`${btnBase} bg-white/5 text-gray-200 hover:bg-white/10`}>{d}</button>
        ))}
        <button onClick={() => handleOp("+")} className={`${btnBase} ${op === "+" && waitingForOperand ? "bg-blue-500/40 text-blue-200" : "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"}`}>
          +
        </button>

        {/* Row 5 */}
        <button onClick={backspace} className={`${btnBase} bg-white/5 text-gray-400 hover:bg-white/10`}>
          <Delete size={14} />
        </button>
        <button onClick={() => inputDigit("0")} className={`${btnBase} bg-white/5 text-gray-200 hover:bg-white/10`}>
          0
        </button>
        <button onClick={inputDot} className={`${btnBase} bg-white/5 text-gray-400 hover:bg-white/10`}>
          .
        </button>
        <button onClick={equals} className={`${btnBase} bg-blue-600 text-white hover:bg-blue-500`}>
          =
        </button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            Historial
          </div>
          <div className="flex flex-col gap-0.5">
            {history.map((entry, i) => (
              <div
                key={i}
                className="rounded bg-white/5 px-2 py-1 font-mono text-[11px] text-gray-400"
              >
                {entry}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
