import { MousePointerClick, CalendarCheck, StickyNote, FileStack } from 'lucide-react'
import { StatusIndicator } from '../components/StatusIndicator'
import { useAppStore } from '../store/appStore'
import type { PageId } from '../components/Sidebar'

interface DashboardProps {
  onNavigate: (page: PageId) => void
}

export function Dashboard({ onNavigate }: DashboardProps): JSX.Element {
  const status = useAppStore((s) => s.status)
  const shortcut = useAppStore((s) => s.currentShortcut)

  return (
    <div className="flex flex-col gap-3">
      <div className="glass-card rounded-2xl p-4">
        <h1 className="text-sm font-semibold text-gray-100">Bem-vindo à Caixa de Tudo</h1>
        <p className="mt-1 text-xs text-gray-500">
          Sua central de ferramentas. Novas ferramentas serão adicionadas em atualizações futuras.
        </p>
      </div>

      <button
        type="button"
        onClick={() => onNavigate('auto-clicker')}
        className="glass-card glow-border flex items-center justify-between rounded-2xl p-4 text-left transition hover:bg-white/[0.04]"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent-violet/10 p-2 text-accent-violet">
            <MousePointerClick size={18} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-100">Auto Clicker</p>
            <p className="text-[11px] text-gray-500">Atalho atual: {shortcut}</p>
          </div>
        </div>
        <StatusIndicator active={status.running} />
      </button>

      <button
        type="button"
        onClick={() => onNavigate('agenda')}
        className="glass-card glow-border flex items-center gap-3 rounded-2xl p-4 text-left transition hover:bg-white/[0.04]"
      >
        <div className="rounded-lg bg-accent-violet/10 p-2 text-accent-violet">
          <CalendarCheck size={18} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-100">Agenda</p>
          <p className="text-[11px] text-gray-500">Descreva tarefas em texto livre e a IA organiza pra você</p>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('notes')}
        className="glass-card glow-border flex items-center gap-3 rounded-2xl p-4 text-left transition hover:bg-white/[0.04]"
      >
        <div className="rounded-lg bg-accent-violet/10 p-2 text-accent-violet">
          <StickyNote size={18} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-100">Post-its</p>
          <p className="text-[11px] text-gray-500">Anote qualquer coisa e organize por prioridade</p>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('converter')}
        className="glass-card glow-border flex items-center gap-3 rounded-2xl p-4 text-left transition hover:bg-white/[0.04]"
      >
        <div className="rounded-lg bg-accent-violet/10 p-2 text-accent-violet">
          <FileStack size={18} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-100">Conversor de arquivos</p>
          <p className="text-[11px] text-gray-500">Converta entre TXT, DOCX e PDF</p>
        </div>
      </button>
    </div>
  )
}
