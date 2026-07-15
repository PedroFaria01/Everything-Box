import { BrowserWindow, screen, shell } from 'electron'
import type { AgendaTask } from '../../renderer/src/types'
import { TASK_CATEGORY_LABELS } from '../../renderer/src/types'
import { getAllTasks } from '../agenda'

const CHECK_INTERVAL_MS = 15_000
const REMINDER_LEAD_MINUTES = 15
const POPUP_WIDTH = 340
const POPUP_HEIGHT = 118
const POPUP_GAP = 12
const POPUP_MARGIN = 16
const POPUP_AUTO_CLOSE_MS = 20_000

let checkTimer: ReturnType<typeof setInterval> | null = null
let lastCheckTs = Date.now()
const openPopups: BrowserWindow[] = []

function parseTaskDueTs(task: AgendaTask): number | null {
  if (!task.time) return null
  const ts = new Date(`${task.date}T${task.time}:00`).getTime()
  return Number.isNaN(ts) ? null : ts
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      default:
        return '&#39;'
    }
  })
}

function formatLeadLabel(minutesRemaining: number): string {
  if (minutesRemaining <= 0) return 'Começando agora'
  if (minutesRemaining === 1) return 'Em 1 minuto'
  return `Em ${minutesRemaining} minutos`
}

function buildPopupHtml(task: AgendaTask, minutesRemaining: number): string {
  const title = escapeHtml(task.title || 'Compromisso')
  const category = escapeHtml(TASK_CATEGORY_LABELS[task.category] ?? task.category)
  const time = escapeHtml(task.time)
  const description = escapeHtml(task.description || '')
  const leadLabel = escapeHtml(formatLeadLabel(minutesRemaining))

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    overflow: hidden;
    font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
    user-select: none;
  }
  .card {
    width: 100%;
    height: 100%;
    background: #0b0d17;
    border: 1px solid rgba(192, 132, 252, 0.35);
    border-radius: 12px;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
    -webkit-app-region: drag;
    position: relative;
    color: #e5e7eb;
  }
  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .badge {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: #c084fc;
    text-transform: uppercase;
  }
  .close {
    -webkit-app-region: no-drag;
    cursor: pointer;
    color: #9ca3af;
    background: transparent;
    border: none;
    font-size: 14px;
    line-height: 1;
    padding: 2px 4px;
    border-radius: 4px;
  }
  .close:hover {
    color: #e5e7eb;
    background: rgba(255, 255, 255, 0.08);
  }
  .title {
    font-size: 15px;
    font-weight: 700;
    color: #f9fafb;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .meta {
    font-size: 12px;
    color: #a1a1aa;
  }
  .desc {
    font-size: 12px;
    color: #d4d4d8;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="top">
      <span class="badge">${leadLabel}</span>
      <button class="close" id="closeBtn">&#10005;</button>
    </div>
    <div class="title">${title}</div>
    <div class="meta">${time ? `${time} · ` : ''}${category}</div>
    ${description ? `<div class="desc">${description}</div>` : ''}
  </div>
  <script>
    document.getElementById('closeBtn').addEventListener('click', () => window.close())
  </script>
</body>
</html>`
}

function repositionPopups(): void {
  const display = screen.getPrimaryDisplay()
  const { x, y, width } = display.workArea
  openPopups.forEach((popup, index) => {
    if (popup.isDestroyed()) return
    const posX = x + width - POPUP_WIDTH - POPUP_MARGIN
    const posY = y + POPUP_MARGIN + index * (POPUP_HEIGHT + POPUP_GAP)
    popup.setPosition(posX, posY)
  })
}

function showReminderPopup(task: AgendaTask, minutesRemaining: number): void {
  const display = screen.getPrimaryDisplay()
  const { x, y, width } = display.workArea
  const posX = x + width - POPUP_WIDTH - POPUP_MARGIN
  const posY = y + POPUP_MARGIN + openPopups.length * (POPUP_HEIGHT + POPUP_GAP)

  const popup = new BrowserWindow({
    width: POPUP_WIDTH,
    height: POPUP_HEIGHT,
    x: posX,
    y: posY,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  popup.setAlwaysOnTop(true, 'screen-saver')
  popup.once('ready-to-show', () => popup.show())
  void popup.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(buildPopupHtml(task, minutesRemaining))}`
  )

  openPopups.push(popup)
  popup.on('closed', () => {
    const idx = openPopups.indexOf(popup)
    if (idx !== -1) openPopups.splice(idx, 1)
    repositionPopups()
  })

  const autoCloseTimer = setTimeout(() => {
    if (!popup.isDestroyed()) popup.close()
  }, POPUP_AUTO_CLOSE_MS)
  popup.on('closed', () => clearTimeout(autoCloseTimer))

  try {
    shell.beep()
  } catch (error) {
    console.warn('[reminders] Não foi possível tocar o alerta sonoro:', error)
  }
}

function checkDueTasks(): void {
  const now = Date.now()
  try {
    const tasks = getAllTasks()
    for (const task of tasks) {
      if (task.done) continue
      const dueTs = parseTaskDueTs(task)
      if (dueTs === null) continue
      for (let minutesRemaining = REMINDER_LEAD_MINUTES; minutesRemaining >= 0; minutesRemaining--) {
        const alertTs = dueTs - minutesRemaining * 60_000
        if (alertTs > lastCheckTs && alertTs <= now) {
          showReminderPopup(task, minutesRemaining)
        }
      }
    }
  } catch (error) {
    console.error('[reminders] Falha ao verificar compromissos:', error)
  }
  lastCheckTs = now
}

export function startReminderScheduler(): void {
  if (checkTimer) return
  lastCheckTs = Date.now()
  checkTimer = setInterval(checkDueTasks, CHECK_INTERVAL_MS)
}

export function stopReminderScheduler(): void {
  if (checkTimer) {
    clearInterval(checkTimer)
    checkTimer = null
  }
  openPopups.splice(0).forEach((popup) => {
    if (!popup.isDestroyed()) popup.close()
  })
}
