import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle } from "lucide-react"

interface Props {
  /** Cambiar este valor (p. ej. el id del panel activo) resetea el boundary. */
  resetKey?: string
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Aísla el fallo de un panel: si su árbol lanza en render, mostramos un fallback
 * en lugar de dejar que la excepción desmonte TODA la app (icon strip incluido),
 * que era la causa de la "pantalla en blanco" al abrir Inicio.
 */
export default class PanelErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[PanelErrorBoundary]", error, info.componentStack)
  }

  componentDidUpdate(prevProps: Props) {
    // Al cambiar de panel, limpiar el estado de error para reintentar el render.
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          <AlertTriangle size={32} className="text-amber-500/70" />
          <p className="text-sm text-gray-400">No se pudo cargar este panel.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="rounded-md bg-white/5 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:bg-white/10"
          >
            Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
