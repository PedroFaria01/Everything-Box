import { randomUUID } from 'crypto'
import type { AgendaTask, ParsedTaskInput, TaskCategory, TaskDraft } from '../../renderer/src/types'
import { TASK_CATEGORIES } from '../../renderer/src/types'
import { loadTasks, saveTasks } from '../store'
import { callOllamaJSON } from '../ollama'

export class InvalidTaskInputError extends Error {}
export class TaskNotFoundError extends Error {}

interface ParsedTaskFromAI {
  titulo: string
  data: string
  hora: string
  descricao: string
  categoria: string
}

const TASK_SCHEMA = {
  type: 'object',
  properties: {
    titulo: { type: 'string' },
    data: { type: 'string' },
    hora: { type: 'string' },
    descricao: { type: 'string' },
    categoria: { type: 'string', enum: TASK_CATEGORIES }
  },
  required: ['titulo', 'data', 'hora', 'descricao', 'categoria']
}

function buildSystemPrompt(): string {
  const now = new Date()
  const dataAtual = now.toISOString().slice(0, 10)
  const diaSemana = now.toLocaleDateString('pt-BR', { weekday: 'long' })

  return (
    `Você transforma uma descrição de tarefa em português em dados estruturados para uma agenda pessoal. ` +
    `Hoje é ${dataAtual} (${diaSemana}). Resolva datas relativas ("amanhã", "sexta-feira", "semana que vem", ` +
    `"daqui a 3 dias" etc.) com base nessa data e responda a data no formato YYYY-MM-DD. Se o usuário não ` +
    `mencionar um horário, deixe "hora" como string vazia; caso contrário use o formato HH:MM em 24 horas. ` +
    `Escreva a descrição em português, com um pouco mais de contexto do que o texto original, mas sem inventar ` +
    `informação que não foi dita. A categoria deve ser exatamente uma destas: ${TASK_CATEGORIES.join(', ')}. ` +
    `Responda apenas com o JSON pedido, sem texto ao redor.`
  )
}

/**
 * Usa um modelo rodando localmente no Ollama para transformar um texto livre
 * (ex: "reunião com o cliente amanhã às 14h") em campos estruturados de uma tarefa.
 */
export async function parseTaskWithAI(
  inputText: string,
  baseUrl: string,
  model: string
): Promise<ParsedTaskInput> {
  if (!inputText || !inputText.trim()) {
    throw new InvalidTaskInputError('Descreva a tarefa antes de continuar.')
  }

  const parsed = await callOllamaJSON<ParsedTaskFromAI>({
    baseUrl,
    model,
    systemPrompt: buildSystemPrompt(),
    userText: inputText,
    schema: TASK_SCHEMA
  })

  const category = TASK_CATEGORIES.includes(parsed.categoria as TaskCategory)
    ? (parsed.categoria as TaskCategory)
    : 'outro'

  return {
    title: parsed.titulo,
    date: parsed.data,
    time: parsed.hora ?? '',
    description: parsed.descricao,
    category
  }
}

export function getAllTasks(): AgendaTask[] {
  return loadTasks().sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
}

export function addTask(task: TaskDraft): AgendaTask {
  const newTask: AgendaTask = {
    ...task,
    id: randomUUID(),
    createdAt: Date.now(),
    done: false
  }
  const tasks = loadTasks()
  tasks.push(newTask)
  saveTasks(tasks)
  return newTask
}

export function updateTask(id: string, partial: Partial<AgendaTask>): AgendaTask {
  const tasks = loadTasks()
  const index = tasks.findIndex((t) => t.id === id)
  if (index === -1) {
    throw new TaskNotFoundError(`Tarefa "${id}" não encontrada.`)
  }
  const updated = { ...tasks[index], ...partial, id: tasks[index].id }
  tasks[index] = updated
  saveTasks(tasks)
  return updated
}

export function deleteTask(id: string): void {
  const tasks = loadTasks()
  const next = tasks.filter((t) => t.id !== id)
  if (next.length === tasks.length) {
    throw new TaskNotFoundError(`Tarefa "${id}" não encontrada.`)
  }
  saveTasks(next)
}
