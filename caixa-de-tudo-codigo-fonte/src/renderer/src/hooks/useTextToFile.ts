import { useCallback, useState } from 'react'
import { addToast } from '@heroui/react'
import { desktopApi } from '../services/desktopApi'
import type { ConversionFormat } from '../types'

const ERROR_MESSAGES: Record<string, string> = {
  ConversionFailedError: 'Não foi possível salvar o arquivo.'
}

function friendlyMessage(code: string, fallback: string): string {
  return ERROR_MESSAGES[code] ?? fallback
}

export function useTextToFile(): {
  text: string
  setText: (text: string) => void
  format: ConversionFormat
  setFormat: (format: ConversionFormat) => void
  saving: boolean
  lastOutputPath: string | null
  save: () => Promise<void>
  openLastInFolder: () => void
} {
  const [text, setText] = useState('')
  const [format, setFormat] = useState<ConversionFormat>('txt')
  const [saving, setSaving] = useState(false)
  const [lastOutputPath, setLastOutputPath] = useState<string | null>(null)

  const save = useCallback(async (): Promise<void> => {
    if (!text.trim()) return
    setSaving(true)
    try {
      const result = await desktopApi().exportTextToFile(text, format)
      if (!result.ok) {
        if ('canceled' in result) return
        addToast({
          title: 'Falha ao salvar',
          description: friendlyMessage(result.error.code, result.error.message),
          color: 'danger'
        })
        return
      }
      setLastOutputPath(result.outputPath)
      addToast({ title: 'Arquivo salvo com sucesso', color: 'success' })
    } finally {
      setSaving(false)
    }
  }, [text, format])

  const openLastInFolder = useCallback((): void => {
    if (lastOutputPath) void desktopApi().openInFolder(lastOutputPath)
  }, [lastOutputPath])

  return { text, setText, format, setFormat, saving, lastOutputPath, save, openLastInFolder }
}
