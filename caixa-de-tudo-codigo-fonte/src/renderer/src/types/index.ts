export type MouseButton = 'left' | 'right' | 'middle'

export type ExecutionMode = 'continuous' | 'count'

export type ClickPositionMode = 'cursor' | 'fixed'

export interface Point {
  x: number
  y: number
}

export interface AutoClickerConfig {
  intervalMs: number
  mouseButton: MouseButton
  executionMode: ExecutionMode
  clickCount: number
  initialDelayMs: number
  positionMode: ClickPositionMode
  fixedPosition: Point | null
}

export interface AutoClickerStatus {
  running: boolean
  clicksExecuted: number
  elapsedMs: number
  startedAt: number | null
}

export interface ShortcutState {
  accelerator: string
  registered: boolean
}

export type AppErrorCode =
  | 'INVALID_SHORTCUT'
  | 'SHORTCUT_UNAVAILABLE'
  | 'SHORTCUT_REGISTER_FAILED'
  | 'CLICK_EXECUTION_FAILED'
  | 'INVALID_INTERVAL'
  | 'INVALID_COUNT'
  | 'INVALID_COORDINATES'
  | 'SETTINGS_LOAD_FAILED'
  | 'SETTINGS_SAVE_FAILED'
  | 'AUTOMATION_LIB_UNAVAILABLE'
  | 'ALREADY_RUNNING'
  | 'CLOSED_WHILE_RUNNING'
  | 'OLLAMA_UNAVAILABLE'
  | 'INVALID_TASK_INPUT'
  | 'AI_PARSE_FAILED'
  | 'TASK_NOT_FOUND'
  | 'INVALID_NOTE_INPUT'
  | 'NOTE_NOT_FOUND'
  | 'UNKNOWN'

export interface AppError {
  code: AppErrorCode
  message: string
}

export type TrayBehavior = 'ask' | 'minimize' | 'close'

export interface AppSettings {
  autoClicker: AutoClickerConfig
  shortcut: string
  trayBehavior: TrayBehavior
  /** Endereço do servidor Ollama local, ex: http://localhost:11434 */
  ollamaBaseUrl: string
  /** Nome do modelo já baixado no Ollama (ollama pull <modelo>), ex: llama3.1 */
  ollamaModel: string
  interfacePrefs: {
    theme: 'dark'
  }
}

export const DEFAULT_SHORTCUT = 'F6'

export const DEFAULT_AUTO_CLICKER_CONFIG: AutoClickerConfig = {
  intervalMs: 1000,
  mouseButton: 'left',
  executionMode: 'continuous',
  clickCount: 10,
  initialDelayMs: 0,
  positionMode: 'cursor',
  fixedPosition: null
}

export const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434'
export const DEFAULT_OLLAMA_MODEL = 'llama3.2:1b'

export const DEFAULT_SETTINGS: AppSettings = {
  autoClicker: DEFAULT_AUTO_CLICKER_CONFIG,
  shortcut: DEFAULT_SHORTCUT,
  trayBehavior: 'ask',
  ollamaBaseUrl: DEFAULT_OLLAMA_BASE_URL,
  ollamaModel: DEFAULT_OLLAMA_MODEL,
  interfacePrefs: {
    theme: 'dark'
  }
}

// --- Prioridade (compartilhada entre Agenda e Post-its) ---

/** azul = normal, amarelo = média prioridade, vermelho = alta prioridade */
export type Priority = 'normal' | 'media' | 'alta'

export const PRIORITIES: Priority[] = ['normal', 'media', 'alta']

export const PRIORITY_LABELS: Record<Priority, string> = {
  normal: 'Normal',
  media: 'Média prioridade',
  alta: 'Alta prioridade'
}

// --- Agenda / Tarefas diárias ---

export type TaskCategory = 'trabalho' | 'pessoal' | 'saude' | 'financeiro' | 'outro'

export const TASK_CATEGORIES: TaskCategory[] = [
  'trabalho',
  'pessoal',
  'saude',
  'financeiro',
  'outro'
]

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  trabalho: 'Trabalho',
  pessoal: 'Pessoal',
  saude: 'Saúde',
  financeiro: 'Financeiro',
  outro: 'Outro'
}

export interface AgendaTask {
  id: string
  title: string
  /** Data no formato YYYY-MM-DD */
  date: string
  /** Horário no formato HH:MM (24h), ou string vazia se não houver horário */
  time: string
  description: string
  category: TaskCategory
  priority: Priority
  createdAt: number
  done: boolean
}

/** Campos retornados pela IA a partir do texto livre do usuário (a prioridade é escolhida à parte). */
export type ParsedTaskInput = Omit<AgendaTask, 'id' | 'createdAt' | 'done' | 'priority'>

/** Payload usado para criar uma tarefa (campos da IA + prioridade escolhida pelo usuário). */
export type TaskDraft = Omit<AgendaTask, 'id' | 'createdAt' | 'done'>

// --- Post-its ---

export interface StickyNote {
  id: string
  title: string
  description: string
  priority: Priority
  createdAt: number
}

/** Campos retornados pela IA a partir do texto livre do usuário. */
export type ParsedNoteInput = Pick<StickyNote, 'title' | 'description'>

/** Payload usado para criar um post-it (título/descrição da IA + prioridade escolhida pelo usuário). */
export type NoteDraft = Pick<StickyNote, 'title' | 'description' | 'priority'>

// Limites de segurança para evitar uso excessivo de CPU / cliques inválidos
export const MIN_INTERVAL_MS = 20 // 50 cliques/segundo no máximo
export const MAX_INTERVAL_MS = 60_000
export const MIN_CLICK_COUNT = 1
export const MAX_CLICK_COUNT = 1_000_000
export const MAX_INITIAL_DELAY_MS = 3_600_000
