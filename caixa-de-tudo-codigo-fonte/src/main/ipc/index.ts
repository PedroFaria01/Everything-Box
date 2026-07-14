import { ipcMain, BrowserWindow } from 'electron'
import type {
  AgendaTask,
  AutoClickerConfig,
  AppSettings,
  NoteDraft,
  StickyNote,
  TaskDraft
} from '../../renderer/src/types'
import {
  startAutoClicker,
  stopAutoClicker,
  getStatus,
  onStatusChange,
  captureMousePosition
} from '../auto-clicker'
import { registerGlobalShortcut, validateAccelerator, getCurrentAccelerator } from '../shortcuts'
import { loadSettings, saveSettings } from '../store'
import { checkOllamaConnection } from '../ollama'
import { parseTaskWithAI, getAllTasks, addTask, updateTask, deleteTask } from '../agenda'
import {
  improveNoteWithAI,
  getAllNotes,
  addNote,
  updateNote,
  deleteNote
} from '../notes'

function toErrorPayload(error: unknown): { code: string; message: string } {
  const message = error instanceof Error ? error.message : 'Erro desconhecido.'
  const code = error instanceof Error ? error.constructor.name : 'UNKNOWN'
  return { code, message }
}

export function registerIpcHandlers(mainWindow: BrowserWindow, toggleFromShortcut: () => void): void {
  // Repassa mudanças de status do Auto Clicker para o renderer
  onStatusChange((status) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('auto-clicker:status', status)
    }
  })

  ipcMain.handle('auto-clicker:start', (_event, config: AutoClickerConfig) => {
    try {
      startAutoClicker(config)
      return { ok: true }
    } catch (error) {
      return { ok: false, error: toErrorPayload(error) }
    }
  })

  ipcMain.handle('auto-clicker:stop', () => {
    stopAutoClicker()
    return { ok: true }
  })

  ipcMain.handle('auto-clicker:get-status', () => getStatus())

  ipcMain.handle('auto-clicker:capture-position', async () => {
    try {
      const point = await captureMousePosition()
      return { ok: true, point }
    } catch (error) {
      return { ok: false, error: toErrorPayload(error) }
    }
  })

  ipcMain.handle('settings:get', () => loadSettings())

  ipcMain.handle('settings:save', (_event, settings: AppSettings) => {
    try {
      saveSettings(settings)
      return { ok: true }
    } catch (error) {
      return { ok: false, error: toErrorPayload(error) }
    }
  })

  ipcMain.handle('shortcut:validate', (_event, accelerator: string) => {
    try {
      validateAccelerator(accelerator)
      return { ok: true }
    } catch (error) {
      return { ok: false, error: toErrorPayload(error) }
    }
  })

  ipcMain.handle('shortcut:register', (_event, accelerator: string) => {
    try {
      const registered = registerGlobalShortcut(accelerator, toggleFromShortcut)
      return { ok: true, accelerator: registered }
    } catch (error) {
      return { ok: false, error: toErrorPayload(error) }
    }
  })

  ipcMain.handle('shortcut:get-current', () => getCurrentAccelerator())

  ipcMain.handle('agenda:parse-task', async (_event, text: string) => {
    try {
      const settings = loadSettings()
      const task = await parseTaskWithAI(text, settings.ollamaBaseUrl, settings.ollamaModel)
      return { ok: true, task }
    } catch (error) {
      return { ok: false, error: toErrorPayload(error) }
    }
  })

  ipcMain.handle('ollama:check-connection', async (_event, baseUrl: string) => {
    return checkOllamaConnection(baseUrl)
  })

  ipcMain.handle('agenda:get-tasks', () => getAllTasks())

  ipcMain.handle('agenda:add-task', (_event, task: TaskDraft) => {
    try {
      const created = addTask(task)
      return { ok: true, task: created }
    } catch (error) {
      return { ok: false, error: toErrorPayload(error) }
    }
  })

  ipcMain.handle('agenda:update-task', (_event, id: string, partial: Partial<AgendaTask>) => {
    try {
      const updated = updateTask(id, partial)
      return { ok: true, task: updated }
    } catch (error) {
      return { ok: false, error: toErrorPayload(error) }
    }
  })

  ipcMain.handle('agenda:delete-task', (_event, id: string) => {
    try {
      deleteTask(id)
      return { ok: true }
    } catch (error) {
      return { ok: false, error: toErrorPayload(error) }
    }
  })

  ipcMain.handle('notes:improve', async (_event, text: string) => {
    try {
      const settings = loadSettings()
      const note = await improveNoteWithAI(text, settings.ollamaBaseUrl, settings.ollamaModel)
      return { ok: true, note }
    } catch (error) {
      return { ok: false, error: toErrorPayload(error) }
    }
  })

  ipcMain.handle('notes:get-notes', () => getAllNotes())

  ipcMain.handle('notes:add-note', (_event, note: NoteDraft) => {
    try {
      const created = addNote(note)
      return { ok: true, note: created }
    } catch (error) {
      return { ok: false, error: toErrorPayload(error) }
    }
  })

  ipcMain.handle('notes:update-note', (_event, id: string, partial: Partial<StickyNote>) => {
    try {
      const updated = updateNote(id, partial)
      return { ok: true, note: updated }
    } catch (error) {
      return { ok: false, error: toErrorPayload(error) }
    }
  })

  ipcMain.handle('notes:delete-note', (_event, id: string) => {
    try {
      deleteNote(id)
      return { ok: true }
    } catch (error) {
      return { ok: false, error: toErrorPayload(error) }
    }
  })

  ipcMain.handle('window:minimize', () => {
    mainWindow.minimize()
  })

  ipcMain.handle('window:minimize-to-tray', () => {
    mainWindow.hide()
  })

  ipcMain.handle('window:close', () => {
    mainWindow.close()
  })
}
