import { useCallback, useEffect, useState } from 'react'
import { addToast } from '@heroui/react'
import { desktopApi } from '../services/desktopApi'
import type { AgendaTask, ParsedTaskInput, TaskDraft } from '../types'

const ERROR_MESSAGES: Record<string, string> = {
  OllamaUnavailableError: 'Não foi possível falar com o Ollama. Confira em Configurações se ele está rodando.',
  InvalidTaskInputError: 'Descreva a tarefa antes de continuar.',
  AiParseError: 'Não foi possível processar a tarefa com a IA.',
  TaskNotFoundError: 'Essa tarefa não existe mais.'
}

function friendlyMessage(code: string, fallback: string): string {
  return ERROR_MESSAGES[code] ?? fallback
}

export function useAgenda(): {
  tasks: AgendaTask[]
  loading: boolean
  parsing: boolean
  parseTaskFromText: (text: string) => Promise<ParsedTaskInput | null>
  confirmTask: (task: TaskDraft) => Promise<void>
  updateTask: (id: string, partial: Partial<AgendaTask>) => Promise<void>
  toggleDone: (id: string) => Promise<void>
  removeTask: (id: string) => Promise<void>
} {
  const [tasks, setTasks] = useState<AgendaTask[]>([])
  const [loading, setLoading] = useState(true)
  const [parsing, setParsing] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function bootstrap(): Promise<void> {
      try {
        const loaded = await desktopApi().getTasks()
        if (!cancelled) setTasks(loaded)
      } catch (error) {
        console.error('[useAgenda] Falha ao carregar tarefas:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const parseTaskFromText = useCallback(async (text: string): Promise<ParsedTaskInput | null> => {
    setParsing(true)
    try {
      const result = await desktopApi().parseTaskWithAI(text)
      if (!result.ok) {
        addToast({
          title: 'Não foi possível entender a tarefa',
          description: friendlyMessage(result.error.code, result.error.message),
          color: 'danger'
        })
        return null
      }
      return result.task
    } catch (error) {
      addToast({
        title: 'Falha ao falar com a IA',
        description: error instanceof Error ? error.message : 'Erro desconhecido.',
        color: 'danger'
      })
      return null
    } finally {
      setParsing(false)
    }
  }, [])

  const confirmTask = useCallback(async (task: TaskDraft): Promise<void> => {
    const result = await desktopApi().addTask(task)
    if (!result.ok) {
      addToast({
        title: 'Não foi possível salvar a tarefa',
        description: friendlyMessage(result.error.code, result.error.message),
        color: 'danger'
      })
      return
    }
    setTasks((current) =>
      [...current, result.task].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    )
    addToast({ title: 'Tarefa adicionada', color: 'success' })
  }, [])

  const updateTask = useCallback(async (id: string, partial: Partial<AgendaTask>): Promise<void> => {
    const result = await desktopApi().updateTask(id, partial)
    if (!result.ok) {
      addToast({
        title: 'Não foi possível atualizar a tarefa',
        description: friendlyMessage(result.error.code, result.error.message),
        color: 'danger'
      })
      return
    }
    setTasks((current) => current.map((t) => (t.id === id ? result.task : t)))
  }, [])

  const toggleDone = useCallback(
    async (id: string): Promise<void> => {
      const target = tasks.find((t) => t.id === id)
      if (!target) return
      await updateTask(id, { done: !target.done })
    },
    [tasks, updateTask]
  )

  const removeTask = useCallback(async (id: string): Promise<void> => {
    const result = await desktopApi().deleteTask(id)
    if (!result.ok) {
      addToast({
        title: 'Não foi possível excluir a tarefa',
        description: friendlyMessage(result.error.code, result.error.message),
        color: 'danger'
      })
      return
    }
    setTasks((current) => current.filter((t) => t.id !== id))
  }, [])

  return { tasks, loading, parsing, parseTaskFromText, confirmTask, updateTask, toggleDone, removeTask }
}
