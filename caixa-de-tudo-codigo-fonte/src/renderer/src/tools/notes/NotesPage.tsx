import { useState } from 'react'
import { Button, Textarea } from '@heroui/react'
import { Sparkles } from 'lucide-react'
import { useNotes } from '../../hooks/useNotes'
import type { NoteDraft } from '../../types'
import { NoteCard } from './NoteCard'
import { NoteDraftCard } from './NoteDraftCard'

export function NotesPage(): JSX.Element {
  const { notes, loading, improving, improveNoteFromText, confirmNote, updateNote, removeNote } = useNotes()
  const [inputText, setInputText] = useState('')
  const [draft, setDraft] = useState<NoteDraft | null>(null)

  const handleImprove = async (): Promise<void> => {
    if (!inputText.trim()) return
    const result = await improveNoteFromText(inputText)
    if (result) setDraft({ ...result, priority: 'normal' })
  }

  const handleConfirm = async (): Promise<void> => {
    if (!draft) return
    await confirmNote(draft)
    setDraft(null)
    setInputText('')
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="glass-card rounded-2xl p-4">
        <h2 className="mb-1 text-sm font-semibold text-gray-100">Post-its</h2>
        <p className="mb-3 text-xs text-gray-500">
          Escreva sua anotação do jeito que vier — a IA organiza um título e melhora o texto, sem inventar
          nada. Use <span className="text-gray-400">#</span> pra dar uma instrução à IA sobre como formatar
          (ex: "...#transforma em lista"). Depois é só escolher a cor pela prioridade.
        </p>

        <Textarea
          placeholder='Ex: "lembrar de ligar pro fornecedor sobre o atraso da entrega #resuma em uma frase"'
          size="sm"
          minRows={2}
          value={inputText}
          onValueChange={setInputText}
          isDisabled={improving}
        />

        <div className="mt-2 flex justify-end">
          <Button
            size="sm"
            color="primary"
            startContent={<Sparkles size={14} />}
            onPress={() => void handleImprove()}
            isLoading={improving}
            isDisabled={!inputText.trim()}
          >
            Melhorar com IA
          </Button>
        </div>
      </div>

      {draft && (
        <NoteDraftCard
          draft={draft}
          onChange={setDraft}
          onConfirm={() => void handleConfirm()}
          onCancel={() => setDraft(null)}
        />
      )}

      {loading && <p className="px-1 text-xs text-gray-500">Carregando post-its...</p>}

      {!loading && notes.length === 0 && (
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-xs text-gray-500">Nenhum post-it ainda. Escreva algo acima para começar.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onChangePriority={(id, priority) => void updateNote(id, { priority })}
            onSave={(id, partial) => void updateNote(id, partial)}
            onDelete={(id) => void removeNote(id)}
          />
        ))}
      </div>
    </div>
  )
}
