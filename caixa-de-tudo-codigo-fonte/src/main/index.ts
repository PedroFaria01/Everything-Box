import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipc'
import { createTray, destroyTray } from './tray'
import { loadSettings, saveSettings } from './store'
import {
  registerGlobalShortcut,
  unregisterAllShortcuts
} from './shortcuts'
import { shutdownAutoClicker, getStatus, stopAutoClicker } from './auto-clicker'
import { startReminderScheduler, stopReminderScheduler } from './reminders'

const isDev = !app.isPackaged

let mainWindow: BrowserWindow | null = null
let isQuitting = false

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 500,
    height: 680,
    minWidth: 420,
    minHeight: 560,
    show: false,
    frame: false,
    backgroundColor: '#05060b',
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  win.on('ready-to-show', () => {
    win.show()
  })

  // Abre links externos no navegador padrão, nunca dentro do app
  win.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  win.on('close', (event) => {
    if (isQuitting) return

    const settings = loadSettings()
    if (settings.trayBehavior === 'minimize') {
      event.preventDefault()
      win.hide()
      return
    }
    if (settings.trayBehavior === 'ask') {
      event.preventDefault()
      win.webContents.send('window:ask-close-behavior')
      return
    }
    // 'close' -> deixa fechar normalmente, o handler 'before-quit' cuida da limpeza
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

function toggleAutoClickerFromShortcut(): void {
  const status = getStatus()
  if (status.running) {
    stopAutoClicker()
    return
  }
  const settings = loadSettings()
  mainWindow?.webContents.send('auto-clicker:start-requested', settings.autoClicker)
}

app.whenReady().then(() => {
  mainWindow = createWindow()

  const settings = loadSettings()
  try {
    registerGlobalShortcut(settings.shortcut, toggleAutoClickerFromShortcut)
  } catch (error) {
    console.warn('[main] Não foi possível registrar o atalho salvo ao iniciar:', error)
  }

  registerIpcHandlers(mainWindow, toggleAutoClickerFromShortcut)
  createTray(mainWindow)
  startReminderScheduler()

  // Respostas para a decisão do usuário no diálogo "fechar ou minimizar"
  ipcMain.handle('window:resolve-close-behavior', (_event, choice: 'minimize' | 'close', remember: boolean) => {
    if (remember) {
      const current = loadSettings()
      saveSettings({ ...current, trayBehavior: choice })
    }
    if (choice === 'minimize') {
      mainWindow?.hide()
    } else {
      isQuitting = true
      mainWindow?.close()
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow()
    } else {
      mainWindow?.show()
    }
  })
})

app.on('before-quit', () => {
  isQuitting = true
  shutdownAutoClicker()
  unregisterAllShortcuts()
  destroyTray()
  stopReminderScheduler()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
