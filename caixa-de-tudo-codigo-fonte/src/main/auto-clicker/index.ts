import { mouse, Point as NutPoint, Button } from '@nut-tree-fork/nut-js'
import type { AutoClickerConfig, AutoClickerStatus, MouseButton } from '../../renderer/src/types'
import {
  MIN_INTERVAL_MS,
  MAX_INTERVAL_MS,
  MIN_CLICK_COUNT,
  MAX_CLICK_COUNT,
  MAX_INITIAL_DELAY_MS
} from '../../renderer/src/types'

export class InvalidIntervalError extends Error {}
export class InvalidCountError extends Error {}
export class InvalidCoordinatesError extends Error {}
export class AlreadyRunningError extends Error {}
export class AutomationUnavailableError extends Error {}

const BUTTON_MAP: Record<MouseButton, Button> = {
  left: Button.LEFT,
  right: Button.RIGHT,
  middle: Button.MIDDLE
}

type StatusListener = (status: AutoClickerStatus) => void

let intervalHandle: ReturnType<typeof setInterval> | null = null
let delayHandle: ReturnType<typeof setTimeout> | null = null
let running = false
let clicksExecuted = 0
let startedAt: number | null = null
let listener: StatusListener | null = null
let ticking = false // evita sobreposição caso um clique demore mais que o intervalo

function validateConfig(config: AutoClickerConfig): void {
  if (!Number.isFinite(config.intervalMs) || config.intervalMs < MIN_INTERVAL_MS || config.intervalMs > MAX_INTERVAL_MS) {
    throw new InvalidIntervalError(
      `Intervalo inválido. Use um valor entre ${MIN_INTERVAL_MS}ms e ${MAX_INTERVAL_MS}ms.`
    )
  }

  if (config.executionMode === 'count') {
    if (
      !Number.isInteger(config.clickCount) ||
      config.clickCount < MIN_CLICK_COUNT ||
      config.clickCount > MAX_CLICK_COUNT
    ) {
      throw new InvalidCountError(
        `Quantidade de cliques inválida. Use um valor entre ${MIN_CLICK_COUNT} e ${MAX_CLICK_COUNT}.`
      )
    }
  }

  if (config.initialDelayMs < 0 || config.initialDelayMs > MAX_INITIAL_DELAY_MS) {
    throw new InvalidIntervalError('Atraso inicial inválido.')
  }

  if (config.positionMode === 'fixed') {
    const pos = config.fixedPosition
    if (
      !pos ||
      !Number.isFinite(pos.x) ||
      !Number.isFinite(pos.y) ||
      pos.x < 0 ||
      pos.y < 0
    ) {
      throw new InvalidCoordinatesError('Coordenadas fixas inválidas ou não capturadas.')
    }
  }
}

function emitStatus(): void {
  if (!listener) return
  listener({
    running,
    clicksExecuted,
    elapsedMs: startedAt ? Date.now() - startedAt : 0,
    startedAt
  })
}

async function performClick(config: AutoClickerConfig): Promise<void> {
  if (ticking) return
  ticking = true
  try {
    if (config.positionMode === 'fixed' && config.fixedPosition) {
      await mouse.setPosition(new NutPoint(config.fixedPosition.x, config.fixedPosition.y))
    }
    const button = BUTTON_MAP[config.mouseButton]
    await mouse.pressButton(button)
    await mouse.releaseButton(button)
    clicksExecuted += 1
    emitStatus()

    if (config.executionMode === 'count' && clicksExecuted >= config.clickCount) {
      stopAutoClicker()
    }
  } catch (error) {
    console.error('[auto-clicker] Falha ao executar clique:', error)
    stopAutoClicker()
    throw error
  } finally {
    ticking = false
  }
}

export function onStatusChange(cb: StatusListener): void {
  listener = cb
}

export function getStatus(): AutoClickerStatus {
  return {
    running,
    clicksExecuted,
    elapsedMs: startedAt ? Date.now() - startedAt : 0,
    startedAt
  }
}

export function startAutoClicker(config: AutoClickerConfig): void {
  if (running) {
    throw new AlreadyRunningError('O Auto Clicker já está em execução.')
  }

  validateConfig(config)

  clicksExecuted = 0
  running = true
  startedAt = Date.now()
  emitStatus()

  const begin = (): void => {
    if (!running) return
    void performClick(config)
    intervalHandle = setInterval(() => {
      if (!running) return
      void performClick(config)
    }, config.intervalMs)
  }

  if (config.initialDelayMs > 0) {
    delayHandle = setTimeout(begin, config.initialDelayMs)
  } else {
    begin()
  }
}

export function stopAutoClicker(): void {
  if (delayHandle) {
    clearTimeout(delayHandle)
    delayHandle = null
  }
  if (intervalHandle) {
    clearInterval(intervalHandle)
    intervalHandle = null
  }
  running = false
  startedAt = null
  emitStatus()
}

export async function captureMousePosition(): Promise<{ x: number; y: number }> {
  const pos = await mouse.getPosition()
  return { x: pos.x, y: pos.y }
}

/** Chamado ao fechar o app: garante que nenhuma automação continue rodando. */
export function shutdownAutoClicker(): void {
  stopAutoClicker()
}
