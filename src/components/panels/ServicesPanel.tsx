import { Globe, TrendingUp, Zap, Palette, BrainCircuit, ExternalLink, Sparkles } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useAuthStore } from "../../store/authStore"
import { openExternal } from "../../lib/openExternal"

// ─── Constants ────────────────────────────────────────────────────────────────
const DIGISIDER_URL = "https://digisider.com"

interface ServiceDef {
  id: string
  icon: LucideIcon
  iconColor: string
  iconBg: string
  title: string
  descriptionFree: string
  descriptionPaid: string
  url: string
}

const SERVICES: ServiceDef[] = [
  {
    id: "web",
    icon: Globe,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10",
    title: "Páginas Web",
    descriptionFree:
      "Obtené una presencia profesional online. Diseño moderno, rápido y pensado para convertir visitas en clientes.",
    descriptionPaid:
      "Páginas web profesionales que complementan y potencian los flujos de trabajo de tu organización.",
    url: "https://digisider.com/paginas-web",
  },
  {
    id: "marketing",
    icon: TrendingUp,
    iconColor: "text-green-400",
    iconBg: "bg-green-500/10",
    title: "Marketing Digital",
    descriptionFree:
      "Hacé crecer tu negocio con estrategias de marketing digital que generan resultados reales y medibles.",
    descriptionPaid:
      "Estrategias de marketing que amplían el alcance de tu organización y generan nuevas oportunidades.",
    url: "https://digisider.com/marketing-digital",
  },
  {
    id: "automatizaciones",
    icon: Zap,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10",
    title: "Automatizaciones",
    descriptionFree:
      "Automatizá tareas repetitivas y liberá tiempo para lo que realmente importa en tu negocio.",
    descriptionPaid:
      "Integrá automatizaciones que potencian tu eficiencia y se conectan con tus procesos existentes.",
    url: "https://digisider.com/automatizaciones",
  },
  {
    id: "digital-design",
    icon: Palette,
    iconColor: "text-pink-400",
    iconBg: "bg-pink-500/10",
    title: "Diseño Digital",
    descriptionFree:
      "Identidad visual, branding y diseño gráfico que hacen destacar tu negocio frente a la competencia.",
    descriptionPaid:
      "Diseño gráfico y branding profesional para potenciar la imagen visual de tu organización.",
    url: "https://digisider.com/digital-design",
  },
  {
    id: "ia",
    icon: BrainCircuit,
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/10",
    title: "Inteligencia Artificial",
    descriptionFree:
      "Aprendé a integrar IA en tu negocio y tomá ventaja de las herramientas más poderosas del momento.",
    descriptionPaid:
      "Incorporá soluciones de IA que automatizan procesos y generan valor real en tu organización.",
    url: "https://digisider.com/aprende-inteligencia-artificial",
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function openUrl(url: string) {
  openExternal(url)
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ServiceCard({ service, isPaidPlan }: { service: ServiceDef; isPaidPlan: boolean }) {
  const Icon = service.icon
  const description = isPaidPlan ? service.descriptionPaid : service.descriptionFree
  const ctaLabel = isPaidPlan ? "Más información" : "Quiero esto"

  return (
    <div className="rounded-xl bg-white/5 p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className={`shrink-0 rounded-lg p-2 ${service.iconBg}`}>
          <Icon size={18} className={service.iconColor} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-100">{service.title}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-gray-400">{description}</p>
        </div>
      </div>
      <button
        onClick={() => openUrl(service.url)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-[11px] font-medium text-gray-300 transition-colors hover:bg-white/10 hover:border-white/20 hover:text-white"
      >
        {ctaLabel}
        <ExternalLink size={11} />
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ServicesPanel() {
  const tenant = useAuthStore((s) => s.tenant)
  const plan = tenant?.plan ?? "free"
  const isPaidPlan = plan !== "free"

  return (
    <div className="flex h-full flex-col">

      {/* ── Header ── */}
      <header className="shrink-0 border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-white/90">Servicios Digitales</h2>
        <p className="mt-0.5 text-[10px] text-gray-500">
          {isPaidPlan
            ? "Servicios profesionales para potenciar tu organización"
            : "Hacé crecer tu negocio online"}
        </p>
      </header>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">

        {/* Intro banner — solo plan free */}
        {!isPaidPlan && (
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-purple-900/30 to-blue-900/20 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={13} className="text-purple-400" />
              <p className="text-xs font-semibold text-gray-200">¿Listo para el siguiente nivel?</p>
            </div>
            <p className="text-[10px] leading-relaxed text-gray-500">
              Combiná tu cuenta con servicios profesionales diseñados para hacer crecer tu negocio online.
            </p>
          </div>
        )}

        {/* Cards de servicios */}
        {SERVICES.map((service) => (
          <ServiceCard key={service.id} service={service} isPaidPlan={isPaidPlan} />
        ))}

        {/* Footer link */}
        <div className="mt-1 flex flex-col items-center gap-1.5 pb-1">
          <p className="text-[10px] text-gray-700">¿Querés saber más?</p>
          <button
            onClick={() => openUrl(DIGISIDER_URL)}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] text-gray-600 transition-colors hover:bg-white/5 hover:text-gray-400"
          >
            <ExternalLink size={11} />
            Visitá digisider.com
          </button>
        </div>

      </div>
    </div>
  )
}
