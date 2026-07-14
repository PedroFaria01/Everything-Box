import type { ReactNode } from 'react'
import { Header } from '../components/Header'
import { Sidebar, type PageId } from '../components/Sidebar'

interface MainLayoutProps {
  active: PageId
  onNavigate: (page: PageId) => void
  onOpenSettings: () => void
  children: ReactNode
}

export function MainLayout({ active, onNavigate, onOpenSettings, children }: MainLayoutProps): JSX.Element {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden rounded-xl">
      <Header onOpenSettings={onOpenSettings} />
      <div className="flex min-h-0 flex-1">
        <Sidebar active={active} onNavigate={onNavigate} />
        <main className="min-h-0 flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  )
}
