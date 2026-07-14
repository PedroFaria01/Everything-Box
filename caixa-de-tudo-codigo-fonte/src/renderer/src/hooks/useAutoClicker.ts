import { useCallback, useEffect, useRef } from 'react'
import { addToast } from '@heroui/react'
import { desktopApi } from '../services/desktopApi'
import { useAppStore } from '../store/appStore'
import type { AutoClickerConfig } from '../types'

const ERROR_MESSAGES: Record<string, string> = {
  AlreadyRunningError: 'O Auto Clicker já está em execução.',
  InvalidIntervalError: 'Intervalo entre cliques inválido.',
  InvalidCountError: 'Quantidade de cliques inválida.',
  InvalidCoordinatesError: 'Capture uma posição fixa válida antes de iniciar.',
  InvalidShortcutError: 'Atalho inválido.',
  ShortcutUnavailableError: 'Esse atalho já está em uso por outro programa.'
}

function friendlyMessage(code: string, fallback: string): string {
  return ERROR_MESSAGES[code] ?? fallback
}

export function useAutoClicker(): {
  start: () => Promise<void>
  stop: () => Promise<void>
  capturePosition: () => Promise<void>
} {
  const settings = useAppStore((s) => s.settings)
  const setStatus = useAppStore((s) => s.setStatus)
  const updateAutoClicker = useAppStore((s) => s.updateAutoClicker)
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  useEffect(() => {
    const unsubscribe = desktopApi().onAutoClickerStatus((status) => {
      setStatus(status)
    })
    const unsubscribeShortcutStart = desktopApi().onAutoClickerStartRequested(
      (config: AutoClickerConfig) => {
        void desktopApi()
          .startAutoClicker(config)
          .then((result) => {
            if (!result.ok) {
              addToast({
                title: 'Não foi possível iniciar',
                description: friendlyMessage(result.error.code, result.error.message),
                color: 'danger'
              })
            }
          })
      }
    )
    return () => {
      unsubscribe()
      unsubscribeShortcutStart()
    }
  }, [setStatus])

  const start = useCallback(async () => {
    const result = await desktopApi().startAutoClicker(settingsRef.current.autoClicker)
    if (!result.ok) {
      addToast({
        title: 'Não foi possível iniciar',
        description: friendlyMessage(result.error.code, result.error.message),
        color: 'danger'
      })
    }
  }, [])

  const stop = useCallback(async () => {
    await desktopApi().stopAutoClicker()
  }, [])

  const capturePosition = useCallback(async () => {
    const result = await desktopApi().captureMousePosition()
    if (result.ok) {
      updateAutoClicker({ fixedPosition: result.point, positionMode: 'fixed' })
      addToast({
        title: 'Posição capturada',
        description: `X: ${result.point.x}, Y: ${result.point.y}`,
        color: 'success'
      })
    } else {
      addToast({
        title: 'Falha ao capturar posição',
        description: friendlyMessage(result.error.code, result.error.message),
        color: 'danger'
      })
    }
  }, [updateAutoClicker])

  return { start, stop, capturePosition }
}
