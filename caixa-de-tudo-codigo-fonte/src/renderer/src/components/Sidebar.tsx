import {
  LayoutDashboard,
  MousePointerClick,
  Settings as SettingsIcon,
  CalendarCheck,
  StickyNote,
  Type,
  FileStack,
  Image as ImageIcon,
  Video,
  Timer,
  ClipboardList
} from 'lucide-react'

export type PageId = 'dashboard' | 'auto-clicker' | 'agenda' | 'notes' | 'converter' | 'settings'

interface NavItem {
  id: PageId
  label: string
  icon: JSX.Element
}

interface FutureToolItem {
  label: string
  icon: JSX.Element
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
  { id: 'auto-clicker', label: 'Auto Clicker', icon: <MousePointerClick size={17} /> },
  { id: 'agenda', label: 'Agenda', icon: <CalendarCheck size={17} /> },
  { id: 'notes', label: 'Post-its', icon: <StickyNote size={17} /> },
  { id: 'converter', label: 'Conversor', icon: <FileStack size={17} /> },
  { id: 'settings', label: 'Configurações', icon: <SettingsIcon size={17} /> }
]

// Ferramentas planejadas - apenas navegação/arquitetura preparada, sem implementação ainda
const FUTURE_TOOLS: FutureToolItem[] = [
  { label: 'Gerador de texto', icon: <Type size={16} /> },
  { label: 'Ferramentas de imagem', icon: <ImageIcon size={16} /> },
  { label: 'Gravador de macros', icon: <Video size={16} /> },
  { label: 'Temporizador', icon: <Timer size={16} /> },
  { label: 'Gerenciador de snippets', icon: <ClipboardList size={16} /> }
]

interface SidebarProps {
  active: PageId
  onNavigate: (page: PageId) => void
}

export function Sidebar({ active, onNavigate }: SidebarProps): JSX.Element {
  return (
    <nav className="flex w-40 shrink-0 flex-col gap-1 border-r border-white/5 p-2">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onNavigate(item.id)}
          className={
            'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ' +
            (active === item.id
              ? 'bg-accent-violet/10 text-accent-violet glow-border'
              : 'text-gray-400 hover:bg-white/5 hover:text-gray-200')
          }
        >
          {item.icon}
          {item.label}
        </button>
      ))}

      <div className="mt-4 border-t border-white/5 pt-3">
        <p className="px-3 pb-1 text-[10px] uppercase tracking-wider text-gray-600">Em breve</p>
        {FUTURE_TOOLS.map((tool) => (
          <div
            key={tool.label}
            className="flex cursor-not-allowed items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-600"
            title="Disponível em uma atualização futura"
          >
            {tool.icon}
            {tool.label}
          </div>
        ))}
      </div>
    </nav>
  )
}
