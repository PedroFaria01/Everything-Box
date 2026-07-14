import { useEffect, useState } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Checkbox,
  addToast
} from '@heroui/react'
import { MainLayout } from './layouts/MainLayout'
import type { PageId } from './components/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { Settings } from './pages/Settings'
import { AutoClickerPage } from './tools/auto-clicker/AutoClickerPage'
import { AgendaPage } from './tools/agenda/AgendaPage'
import { NotesPage } from './tools/notes/NotesPage'
import { desktopApi } from './services/desktopApi'
import { useAppStore } from './store/appStore'

function App(): JSX.Element {
  const [page, setPage] = useState<PageId>('dashboard')
  const [askCloseOpen, setAskCloseOpen] = useState(false)
  const [rememberChoice, setRememberChoice] = useState(false)

  const setSettings = useAppStore((s) => s.setSettings)
  const setCurrentShortcut = useAppStore((s) => s.setCurrentShortcut)
  const setLoaded = useAppStore((s) => s.setLoaded)
  const loaded = useAppStore((s) => s.loaded)

  useEffect(() => {
    async function bootstrap(): Promise<void> {
      try {
        const settings = await desktopApi().getSettings()
        setSettings(settings)

        const registration = await desktopApi().registerShortcut(settings.shortcut)
        if (registration.ok) {
          setCurrentShortcut(registration.accelerator)
        } else {
          setCurrentShortcut(settings.shortcut)
          addToast({
            title: 'Atalho salvo indisponível',
            description: registration.error.message,
            color: 'warning'
          })
        }
      } catch (error) {
        addToast({
          title: 'Falha ao carregar configurações',
          description: error instanceof Error ? error.message : 'Erro desconhecido.',
          color: 'danger'
        })
      } finally {
        setLoaded(true)
      }
    }

    void bootstrap()

    const unsubscribeAsk = desktopApi().onAskCloseBehavior(() => setAskCloseOpen(true))

    return () => {
      unsubscribeAsk()
    }
  }, [setSettings, setCurrentShortcut, setLoaded])

  const resolveClose = async (choice: 'minimize' | 'close'): Promise<void> => {
    await desktopApi().resolveCloseBehavior(choice, rememberChoice)
    setAskCloseOpen(false)
  }

  if (!loaded) {
    return (
      <div className="flex h-screen w-screen items-center justify-center text-xs text-gray-500">
        Carregando Caixa de Tudo...
      </div>
    )
  }

  return (
    <MainLayout active={page} onNavigate={setPage} onOpenSettings={() => setPage('settings')}>
      {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
      {page === 'auto-clicker' && <AutoClickerPage />}
      {page === 'agenda' && <AgendaPage />}
      {page === 'notes' && <NotesPage />}
      {page === 'settings' && <Settings />}

      <Modal isOpen={askCloseOpen} onOpenChange={setAskCloseOpen} isDismissable={false} size="sm">
        <ModalContent>
          <ModalHeader>Fechar Caixa de Tudo</ModalHeader>
          <ModalBody>
            <p className="text-sm text-gray-300">
              Deseja minimizar para a bandeja ou fechar o aplicativo por completo?
            </p>
            <Checkbox
              size="sm"
              isSelected={rememberChoice}
              onValueChange={setRememberChoice}
              className="mt-2"
            >
              Lembrar minha escolha
            </Checkbox>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => void resolveClose('minimize')}>
              Minimizar
            </Button>
            <Button color="danger" onPress={() => void resolveClose('close')}>
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </MainLayout>
  )
}

export default App
