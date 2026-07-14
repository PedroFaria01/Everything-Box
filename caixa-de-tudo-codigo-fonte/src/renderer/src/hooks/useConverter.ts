import { useCallback, useState } from 'react'
import { addToast } from '@heroui/react'
import { desktopApi } from '../services/desktopApi'
import type { ConversionFormat } from '../types'

interface SelectedFile {
  path: string
  name: string
  format: ConversionFormat
  targets: ConversionFormat[]
}

const ERROR_MESSAGES: Record<string, string> = {
  UnsupportedConversionError: 'Essa conversão não é suportada.',
  ConversionFailedError: 'Não foi possível converter o arquivo.'
}

function friendlyMessage(code: string, fallback: string): string {
  return ERROR_MESSAGES[code] ?? fallback
}

export function useConverter(): {
  file: SelectedFile | null
  target: ConversionFormat | null
  setTarget: (format: ConversionFormat) => void
  converting: boolean
  lastOutputPath: string | null
  pickFile: () => Promise<void>
  convert: () => Promise<void>
  reset: () => void
  openLastInFolder: () => void
} {
  const [file, setFile] = useState<SelectedFile | null>(null)
  const [target, setTarget] = useState<ConversionFormat | null>(null)
  const [converting, setConverting] = useState(false)
  const [lastOutputPath, setLastOutputPath] = useState<string | null>(null)

  const pickFile = useCallback(async (): Promise<void> => {
    const result = await desktopApi().pickConversionFile()
    if (!result.ok) {
      if ('canceled' in result) return
      addToast({
        title: 'Não foi possível abrir o arquivo',
        description: friendlyMessage(result.error.code, result.error.message),
        color: 'danger'
      })
      return
    }
    setFile({ path: result.path, name: result.name, format: result.format, targets: result.targets })
    setTarget(result.targets[0] ?? null)
    setLastOutputPath(null)
  }, [])

  const convert = useCallback(async (): Promise<void> => {
    if (!file || !target) return
    setConverting(true)
    try {
      const result = await desktopApi().convertFile(file.path, target)
      if (!result.ok) {
        if ('canceled' in result) return
        addToast({
          title: 'Falha na conversão',
          description: friendlyMessage(result.error.code, result.error.message),
          color: 'danger'
        })
        return
      }
      setLastOutputPath(result.outputPath)
      addToast({ title: 'Arquivo convertido com sucesso', color: 'success' })
    } finally {
      setConverting(false)
    }
  }, [file, target])

  const reset = useCallback((): void => {
    setFile(null)
    setTarget(null)
    setLastOutputPath(null)
  }, [])

  const openLastInFolder = useCallback((): void => {
    if (lastOutputPath) void desktopApi().openInFolder(lastOutputPath)
  }, [lastOutputPath])

  return { file, target, setTarget, converting, lastOutputPath, pickFile, convert, reset, openLastInFolder }
}
