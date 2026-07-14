import { useCallback, useEffect, useState } from 'react'
import { addToast } from '@heroui/react'
import { desktopApi } from '../services/desktopApi'
import type { NoteDraft, ParsedNoteInput, StickyNote } from '../types'

const ERROR_MESSAGES: Record<string, string> = {
  OllamaUnavailableError: 'Não foi possível falar com o Ollama. Confira em Configurações se ele está rodando.',
  InvalidNoteInputError: 'Escreva algo antes de continuar.',
  AiParseError: 'Não foi possível processar o texto com a IA.',
  NoteNotFoundError: 'Esse post-it não existe mais.'
}

function friendlyMessage(code: string, fallback: string): string {
  return ERROR_MESSAGES[code] ?? fallback
}

export function useNotes(): {
  notes: StickyNote[]
  loading: boolean
  improving: boolean
  improveNoteFromText: (text: string) => Promise<ParsedNoteInput | null>
  confirmNote: (note: NoteDraft) => Promise<void>
  updateNote: (id: string, partial: Partial<StickyNote>) => Promise<void>
  removeNote: (id: string) => Promise<void>
} {
  const [notes, setNotes] = useState<StickyNote[]>([])
  const [loading, setLoading] = useState(true)
  const [improving, setImproving] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function bootstrap(): Promise<void> {
      try {
        const loaded = await desktopApi().getNotes()
        if (!cancelled) setNotes(loaded)
      } catch (error) {
        console.error('[useNotes] Falha ao carregar post-its:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const improveNoteFromText = useCallback(async (text: string): Promise<ParsedNoteInput | null> => {
    setImproving(true)
    try {
      const result = await desktopApi().improveNoteWithAI(text)
      if (!result.ok) {
        addToast({
          title: 'Não foi possível melhorar o texto',
          description: friendlyMessage(result.error.code, result.error.message),
          color: 'danger'
        })
        return null
      }
      return result.note
    } catch (error) {
      addToast({
        title: 'Falha ao falar com a IA',
        description: error instanceof Error ? error.message : 'Erro desconhecido.',
        color: 'danger'
      })
      return null
    } finally {
      setImproving(false)
    }
  }, [])

  const confirmNote = useCallback(async (note: NoteDraft): Promise<void> => {
    const result = await desktopApi().addNote(note)
    if (!result.ok) {
      addToast({
        title: 'Não foi possível salvar o post-it',
        description: friendlyMessage(result.error.code, result.error.message),
        color: 'danger'
      })
      return
    }
    setNotes((current) => [result.note, ...current])
    addToast({ title: 'Post-it criado', color: 'success' })
  }, [])

  const updateNote = useCallback(async (id: string, partial: Partial<StickyNote>): Promise<void> => {
    const result = await desktopApi().updateNote(id, partial)
    if (!result.ok) {
      addToast({
        title: 'Não foi possível atualizar o post-it',
        description: friendlyMessage(result.error.code, result.error.message),
        color: 'danger'
      })
      return
    }
    setNotes((current) => current.map((n) => (n.id === id ? result.note : n)))
  }, [])

  const removeNote = useCallback(async (id: string): Promise<void> => {
    const result = await desktopApi().deleteNote(id)
    if (!result.ok) {
      addToast({
        title: 'Não foi possível excluir o post-it',
        description: friendlyMessage(result.error.code, result.error.message),
        color: 'danger'
      })
      return
    }
    setNotes((current) => current.filter((n) => n.id !== id))
  }, [])

  return { notes, loading, improving, improveNoteFromText, confirmNote, updateNote, removeNote }
}
