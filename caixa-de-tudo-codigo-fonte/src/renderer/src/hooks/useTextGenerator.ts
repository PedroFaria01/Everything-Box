import { useCallback, useState } from 'react'
import { addToast } from '@heroui/react'
import { desktopApi } from '../services/desktopApi'
import type { ConversionFormat } from '../types'

const ERROR_MESSAGES: Record<string, string> = {
  OllamaUnavailableError:
    'Não foi possível conectar ao Ollama. Verifique se ele está rodando e configurado em Configurações.',
  InvalidPromptError: 'Descreva o que você quer que a IA escreva.',
  AiParseError: 'A IA retornou uma resposta inesperada. Tente novamente.',
  ConversionFailedError: 'Não foi possível salvar o arquivo.'
}

function friendlyMessage(code: string, fallback: string): string {
  return ERROR_MESSAGES[code] ?? fallback
}

export function useTextGenerator(): {
  prompt: string
  setPrompt: (value: string) => void
  generating: boolean
  generate: () => Promise<void>
  text: string
  setText: (value: string) => void
  format: ConversionFormat
  setFormat: (format: ConversionFormat) => void
  saving: boolean
  lastOutputPath: string | null
  save: () => Promise<void>
  openLastInFolder: () => void
} {
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [text, setText] = useState('')
  const [format, setFormat] = useState<ConversionFormat>('txt')
  const [saving, setSaving] = useState(false)
  const [lastOutputPath, setLastOutputPath] = useState<string | null>(null)

  const generate = useCallback(async (): Promise<void> => {
    if (!prompt.trim()) return
    setGenerating(true)
    try {
      const result = await desktopApi().generateText(prompt)
      if (!result.ok) {
        addToast({
          title: 'Falha ao gerar texto',
          description: friendlyMessage(result.error.code, result.error.message),
          color: 'danger'
        })
        return
      }
      setText(result.text)
      setLastOutputPath(null)
    } finally {
      setGenerating(false)
    }
  }, [prompt])

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

  return {
    prompt,
    setPrompt,
    generating,
    generate,
    text,
    setText,
    format,
    setFormat,
    saving,
    lastOutputPath,
    save,
    openLastInFolder
  }
}
