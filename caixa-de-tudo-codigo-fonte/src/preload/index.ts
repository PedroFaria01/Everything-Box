import { contextBridge, ipcRenderer } from 'electron'
import type {
  AutoClickerConfig,
  AutoClickerStatus,
  AppSettings,
  AgendaTask,
  ConversionFormat,
  ParsedTaskInput,
  TaskDraft,
  NoteDraft,
  ParsedNoteInput,
  StickyNote
} from '../renderer/src/types'

type IpcResult<T = undefined> =
  | { ok: true } & (T extends undefined ? unknown : { [K in keyof T]: T[K] })
  | { ok: false; error: { code: string; message: string } }

type IpcErrorResult = { ok: false; error: { code: string; message: string } }

type PickConversionFileResult =
  | {
      ok: true
      path: string
      name: string
      format: ConversionFormat
      targets: ConversionFormat[]
    }
  | { ok: false; canceled: true }
  | IpcErrorResult

type ConvertFileResult =
  | { ok: true; outputPath: string }
  | { ok: false; canceled: true }
  | IpcErrorResult

const desktopAPI = {
  startAutoClicker: (config: AutoClickerConfig): Promise<IpcResult> =>
    ipcRenderer.invoke('auto-clicker:start', config),

  stopAutoClicker: (): Promise<IpcResult> => ipcRenderer.invoke('auto-clicker:stop'),

  getAutoClickerStatus: (): Promise<AutoClickerStatus> => ipcRenderer.invoke('auto-clicker:get-status'),

  captureMousePosition: (): Promise<
    { ok: true; point: { x: number; y: number } } | { ok: false; error: { code: string; message: string } }
  > => ipcRenderer.invoke('auto-clicker:capture-position'),

  onAutoClickerStatus: (callback: (status: AutoClickerStatus) => void): (() => void) => {
    const listener = (_event: unknown, status: AutoClickerStatus): void => callback(status)
    ipcRenderer.on('auto-clicker:status', listener)
    return () => ipcRenderer.removeListener('auto-clicker:status', listener)
  },

  onAutoClickerStartRequested: (callback: (config: AutoClickerConfig) => void): (() => void) => {
    const listener = (_event: unknown, config: AutoClickerConfig): void => callback(config)
    ipcRenderer.on('auto-clicker:start-requested', listener)
    return () => ipcRenderer.removeListener('auto-clicker:start-requested', listener)
  },

  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),

  saveSettings: (settings: AppSettings): Promise<IpcResult> =>
    ipcRenderer.invoke('settings:save', settings),

  validateShortcut: (
    accelerator: string
  ): Promise<{ ok: true } | { ok: false; error: { code: string; message: string } }> =>
    ipcRenderer.invoke('shortcut:validate', accelerator),

  registerShortcut: (
    accelerator: string
  ): Promise<
    | { ok: true; accelerator: string }
    | { ok: false; error: { code: string; message: string } }
  > => ipcRenderer.invoke('shortcut:register', accelerator),

  getCurrentShortcut: (): Promise<string | null> => ipcRenderer.invoke('shortcut:get-current'),

  parseTaskWithAI: (
    text: string
  ): Promise<{ ok: true; task: ParsedTaskInput } | IpcErrorResult> =>
    ipcRenderer.invoke('agenda:parse-task', text),

  getTasks: (): Promise<AgendaTask[]> => ipcRenderer.invoke('agenda:get-tasks'),

  addTask: (task: TaskDraft): Promise<{ ok: true; task: AgendaTask } | IpcErrorResult> =>
    ipcRenderer.invoke('agenda:add-task', task),

  updateTask: (
    id: string,
    partial: Partial<AgendaTask>
  ): Promise<{ ok: true; task: AgendaTask } | IpcErrorResult> =>
    ipcRenderer.invoke('agenda:update-task', id, partial),

  deleteTask: (id: string): Promise<{ ok: true } | IpcErrorResult> =>
    ipcRenderer.invoke('agenda:delete-task', id),

  checkOllamaConnection: (baseUrl: string): Promise<{ connected: boolean; models: string[] }> =>
    ipcRenderer.invoke('ollama:check-connection', baseUrl),

  improveNoteWithAI: (
    text: string
  ): Promise<{ ok: true; note: ParsedNoteInput } | IpcErrorResult> =>
    ipcRenderer.invoke('notes:improve', text),

  getNotes: (): Promise<StickyNote[]> => ipcRenderer.invoke('notes:get-notes'),

  addNote: (note: NoteDraft): Promise<{ ok: true; note: StickyNote } | IpcErrorResult> =>
    ipcRenderer.invoke('notes:add-note', note),

  updateNote: (
    id: string,
    partial: Partial<StickyNote>
  ): Promise<{ ok: true; note: StickyNote } | IpcErrorResult> =>
    ipcRenderer.invoke('notes:update-note', id, partial),

  deleteNote: (id: string): Promise<{ ok: true } | IpcErrorResult> =>
    ipcRenderer.invoke('notes:delete-note', id),

  pickConversionFile: (): Promise<PickConversionFileResult> =>
    ipcRenderer.invoke('converter:pick-file'),

  convertFile: (inputPath: string, targetFormat: ConversionFormat): Promise<ConvertFileResult> =>
    ipcRenderer.invoke('converter:convert', inputPath, targetFormat),

  exportTextToFile: (text: string, format: ConversionFormat): Promise<ConvertFileResult> =>
    ipcRenderer.invoke('converter:export-text', text, format),

  generateText: (prompt: string): Promise<{ ok: true; text: string } | IpcErrorResult> =>
    ipcRenderer.invoke('text-generator:generate', prompt),

  openInFolder: (filePath: string): Promise<void> => ipcRenderer.invoke('converter:open-in-folder', filePath),

  minimizeWindow: (): Promise<void> => ipcRenderer.invoke('window:minimize'),

  minimizeToTray: (): Promise<void> => ipcRenderer.invoke('window:minimize-to-tray'),

  closeWindow: (): Promise<void> => ipcRenderer.invoke('window:close'),

  onAskCloseBehavior: (callback: () => void): (() => void) => {
    const listener = (): void => callback()
    ipcRenderer.on('window:ask-close-behavior', listener)
    return () => ipcRenderer.removeListener('window:ask-close-behavior', listener)
  },

  resolveCloseBehavior: (choice: 'minimize' | 'close', remember: boolean): Promise<void> =>
    ipcRenderer.invoke('window:resolve-close-behavior', choice, remember)
}

export type DesktopAPI = typeof desktopAPI

contextBridge.exposeInMainWorld('desktopAPI', desktopAPI)
