import { useState } from "react"
import { Wrench, Calculator, ArrowLeftRight, Palette, Clock, type LucideIcon } from "lucide-react"
import CalculatorTab from "../../features/tools/components/CalculatorTab"
import UnitConverterTab from "../../features/tools/components/UnitConverterTab"
import ColorPickerTab from "../../features/tools/components/ColorPickerTab"
import TimestampTab from "../../features/tools/components/TimestampTab"

type ToolTab = "calculator" | "converter" | "color" | "timestamp"

const TABS: { id: ToolTab; label: string; icon: LucideIcon }[] = [
  { id: "calculator", label: "Calc",       icon: Calculator     },
  { id: "converter",  label: "Converter",  icon: ArrowLeftRight },
  { id: "color",      label: "Color",      icon: Palette        },
  { id: "timestamp",  label: "Time",       icon: Clock          },
]

export default function ToolsPanel() {
  const [activeTab, setActiveTab] = useState<ToolTab>("calculator")

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-2">
        <Wrench size={14} className="text-gray-500" />
        <span className="text-sm font-semibold text-gray-100">Tools</span>
      </div>

      {/* Tab bar */}
      <div className="shrink-0 border-b border-white/10 flex gap-1 px-2 py-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-1 items-center justify-center gap-1 rounded px-1 py-1.5 text-[10px] font-medium transition-colors ${
              activeTab === id
                ? "bg-blue-500/20 text-blue-300"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "calculator" && <CalculatorTab />}
        {activeTab === "converter"  && <UnitConverterTab />}
        {activeTab === "color"      && <ColorPickerTab />}
        {activeTab === "timestamp"  && <TimestampTab />}
      </div>
    </div>
  )
}
