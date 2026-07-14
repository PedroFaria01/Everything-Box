import Store from 'electron-store'
import type { AgendaTask, AppSettings, StickyNote } from '../../renderer/src/types'
import { DEFAULT_SETTINGS } from '../../renderer/src/types'

interface StoreSchema {
  settings: AppSettings
  tasks: AgendaTask[]
  notes: StickyNote[]
}

let store: Store<StoreSchema> | null = null

function getStore(): Store<StoreSchema> {
  if (!store) {
    store = new Store<StoreSchema>({
      name: 'caixa-de-tudo-settings',
      defaults: {
        settings: DEFAULT_SETTINGS,
        tasks: [],
        notes: []
      },
      clearInvalidConfig: true
    })
  }
  return store
}

export function loadSettings(): AppSettings {
  try {
    const s = getStore()
    const saved = s.get('settings')
    // Faz merge defensivo com os defaults, caso versões antigas faltem campos novos
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      autoClicker: { ...DEFAULT_SETTINGS.autoClicker, ...saved?.autoClicker },
      interfacePrefs: { ...DEFAULT_SETTINGS.interfacePrefs, ...saved?.interfacePrefs }
    }
  } catch (error) {
    console.error('[store] Falha ao carregar configurações:', error)
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    const s = getStore()
    s.set('settings', settings)
  } catch (error) {
    console.error('[store] Falha ao salvar configurações:', error)
    throw error
  }
}

export function loadTasks(): AgendaTask[] {
  try {
    const s = getStore()
    const tasks = s.get('tasks') ?? []
    // Tarefas salvas antes do campo "priority" existir não têm esse valor - normaliza pra 'normal'
    return tasks.map((task) => ({ ...task, priority: task.priority ?? 'normal' }))
  } catch (error) {
    console.error('[store] Falha ao carregar tarefas:', error)
    return []
  }
}

export function saveTasks(tasks: AgendaTask[]): void {
  try {
    const s = getStore()
    s.set('tasks', tasks)
  } catch (error) {
    console.error('[store] Falha ao salvar tarefas:', error)
    throw error
  }
}

export function loadNotes(): StickyNote[] {
  try {
    const s = getStore()
    return s.get('notes') ?? []
  } catch (error) {
    console.error('[store] Falha ao carregar post-its:', error)
    return []
  }
}

export function saveNotes(notes: StickyNote[]): void {
  try {
    const s = getStore()
    s.set('notes', notes)
  } catch (error) {
    console.error('[store] Falha ao salvar post-its:', error)
    throw error
  }
}
