import { Minus, Settings, X } from 'lucide-react'
import { StatusIndicator } from './StatusIndicator'
import { useAppStore } from '../store/appStore'
import { desktopApi } from '../services/desktopApi'

interface HeaderProps {
  onOpenSettings: () => void
}

export function Header({ onOpenSettings }: HeaderProps): JSX.Element {
  const running = useAppStore((s) => s.status.running)

  return (
    <header className="drag-region flex h-14 shrink-0 items-center justify-between border-b border-white/5 px-4">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple shadow-glow" />
        <span className="text-sm font-semibold tracking-wide text-gray-100">Caixa de Tudo</span>
        <StatusIndicator active={running} />
      </div>

      <div className="no-drag flex items-center gap-1">
        <button
          type="button"
          onClick={onOpenSettings}
          className="rounded-md p-1.5 text-gray-400 transition hover:bg-white/5 hover:text-accent-cyan"
          title="Configurações"
        >
          <Settings size={16} />
        </button>
        <button
          type="button"
          onClick={() => void desktopApi().minimizeWindow()}
          className="rounded-md p-1.5 text-gray-400 transition hover:bg-white/5 hover:text-gray-100"
          title="Minimizar"
        >
          <Minus size={16} />
        </button>
        <button
          type="button"
          onClick={() => void desktopApi().closeWindow()}
          className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-500/20 hover:text-red-400"
          title="Fechar"
        >
          <X size={16} />
        </button>
      </div>
    </header>
  )
}
