import { Tray, Menu, BrowserWindow, nativeImage, app } from 'electron'
import { join } from 'path'
import { startAutoClicker, stopAutoClicker, getStatus } from '../auto-clicker'
import { loadSettings } from '../store'

let tray: Tray | null = null

export function createTray(mainWindow: BrowserWindow, iconPath?: string): Tray {
  const resolvedIcon = iconPath ?? join(__dirname, '../../resources/icon.png')
  const image = nativeImage.createFromPath(resolvedIcon)
  tray = new Tray(image.isEmpty() ? nativeImage.createEmpty() : image)
  tray.setToolTip('Caixa de Tudo')

  const rebuildMenu = (): void => {
    const status = getStatus()
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Abrir Caixa de Tudo',
        click: () => {
          mainWindow.show()
          mainWindow.focus()
        }
      },
      {
        label: status.running ? 'Parar Auto Clicker' : 'Iniciar Auto Clicker',
        click: () => {
          if (status.running) {
            stopAutoClicker()
          } else {
            const settings = loadSettings()
            try {
              startAutoClicker(settings.autoClicker)
            } catch (error) {
              console.error('[tray] Falha ao iniciar auto clicker:', error)
            }
          }
          rebuildMenu()
        }
      },
      { type: 'separator' },
      {
        label: 'Sair',
        click: () => {
          app.exit(0)
        }
      }
    ])
    tray?.setContextMenu(contextMenu)
  }

  rebuildMenu()

  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
  })

  return tray
}

export function destroyTray(): void {
  tray?.destroy()
  tray = null
}
