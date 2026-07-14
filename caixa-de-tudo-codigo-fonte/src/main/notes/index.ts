import { randomUUID } from 'crypto'
import type { NoteDraft, ParsedNoteInput, StickyNote } from '../../renderer/src/types'
import { loadNotes, saveNotes } from '../store'
import { callOllamaJSON } from '../ollama'

export class InvalidNoteInputError extends Error {}
export class NoteNotFoundError extends Error {}

interface ParsedNoteFromAI {
  titulo: string
  descricao: string
}

const NOTE_SCHEMA = {
  type: 'object',
  properties: {
    titulo: { type: 'string' },
    descricao: { type: 'string' }
  },
  required: ['titulo', 'descricao']
}

const SYSTEM_PROMPT =
  'Você recebe uma anotação rápida e solta do usuário, em português, e devolve um post-it organizado: ' +
  'um título curto (poucas palavras) e uma descrição reescrita de forma mais clara e organizada, mantendo o ' +
  'sentido e o tom original. Não invente informação que não foi dita. Responda apenas com o JSON pedido, ' +
  'sem texto ao redor.'

/**
 * Usa um modelo rodando localmente no Ollama para transformar uma anotação livre em
 * um título curto e uma descrição melhorada, prontos para virar um post-it.
 */
export async function improveNoteWithAI(
  inputText: string,
  baseUrl: string,
  model: string
): Promise<ParsedNoteInput> {
  if (!inputText || !inputText.trim()) {
    throw new InvalidNoteInputError('Escreva algo antes de continuar.')
  }

  const parsed = await callOllamaJSON<ParsedNoteFromAI>({
    baseUrl,
    model,
    systemPrompt: SYSTEM_PROMPT,
    userText: inputText,
    schema: NOTE_SCHEMA
  })

  return { title: parsed.titulo, description: parsed.descricao }
}

export function getAllNotes(): StickyNote[] {
  return loadNotes().sort((a, b) => b.createdAt - a.createdAt)
}

export function addNote(note: NoteDraft): StickyNote {
  const newNote: StickyNote = {
    ...note,
    id: randomUUID(),
    createdAt: Date.now()
  }
  const notes = loadNotes()
  notes.push(newNote)
  saveNotes(notes)
  return newNote
}

export function updateNote(id: string, partial: Partial<StickyNote>): StickyNote {
  const notes = loadNotes()
  const index = notes.findIndex((n) => n.id === id)
  if (index === -1) {
    throw new NoteNotFoundError(`Post-it "${id}" não encontrado.`)
  }
  const updated = { ...notes[index], ...partial, id: notes[index].id }
  notes[index] = updated
  saveNotes(notes)
  return updated
}

export function deleteNote(id: string): void {
  const notes = loadNotes()
  const next = notes.filter((n) => n.id !== id)
  if (next.length === notes.length) {
    throw new NoteNotFoundError(`Post-it "${id}" não encontrado.`)
  }
  saveNotes(next)
}
