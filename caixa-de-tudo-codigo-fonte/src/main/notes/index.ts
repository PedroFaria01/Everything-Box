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
  'Você organiza anotações rápidas e soltas do usuário, em português, transformando-as em um post-it com ' +
  'título e descrição. Siga estas regras rigidamente:\n' +
  '1. NUNCA invente fatos, nomes, datas, números ou qualquer detalhe que não esteja explicitamente no texto ' +
  'do usuário. Na dúvida, prefira ficar mais perto do texto original a arriscar inventar algo.\n' +
  '2. A descrição deve preservar as palavras e o sentido do usuário: você pode corrigir gramática/ortografia ' +
  'e organizar frases soltas em um texto coeso ou em tópicos, mas não pode adicionar informação nova nem ' +
  'mudar o significado do que foi escrito.\n' +
  '3. Se o texto do usuário contiver um trecho iniciado por "#", esse trecho NÃO é conteúdo da nota — é um ' +
  'COMANDO seu, uma instrução de como formatar a descrição. Exemplo: "reunião marcada pra sexta #transforma ' +
  'isso numa lista" → o conteúdo real é "reunião marcada pra sexta" e o comando é "transforma isso numa ' +
  'lista" (nesse caso, formate a descrição como lista). Siga o comando, mas NUNCA inclua o caractere "#" nem ' +
  'o texto do comando em si na descrição final.\n' +
  '4. O título deve ser curto (poucas palavras), resumindo o assunto sem inventar nada.\n' +
  '5. Preserve a formatação e o espaçamento do texto original: se o usuário já escreveu em várias linhas, ' +
  'itens de lista ou parágrafos separados, mantenha essa mesma quebra de linha na descrição em vez de juntar ' +
  'tudo em um único parágrafo. Só reorganize em tópicos quando o texto original já for uma lista de itens ' +
  'soltos ou quando um comando "#" pedir isso.\n' +
  'Responda apenas com o JSON pedido, sem texto ao redor.'

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
