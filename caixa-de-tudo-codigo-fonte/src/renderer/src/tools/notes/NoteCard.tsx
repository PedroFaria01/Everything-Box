import { useState } from 'react'
import { Button, Input, Textarea } from '@heroui/react'
import { Pencil, Trash2 } from 'lucide-react'
import type { Priority, StickyNote } from '../../types'
import { PRIORITY_STYLES } from '../../components/priorityStyles'
import { PrioritySelector } from '../../components/PrioritySelector'

interface NoteCardProps {
  note: StickyNote
  onChangePriority: (id: string, priority: Priority) => void
  onSave: (id: string, partial: Partial<StickyNote>) => void
  onDelete: (id: string) => void
}

export function NoteCard({ note, onChangePriority, onSave, onDelete }: NoteCardProps): JSX.Element {
  const [isEditing, setIsEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(note.title)
  const [draftDescription, setDraftDescription] = useState(note.description)

  const style = PRIORITY_STYLES[note.priority]

  const startEditing = (): void => {
    setDraftTitle(note.title)
    setDraftDescription(note.description)
    setIsEditing(true)
  }

  const handleSave = (): void => {
    onSave(note.id, { title: draftTitle, description: draftDescription })
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className={`flex flex-col gap-2 rounded-xl border p-3 ${style.bg} ${style.border}`}>
        <Input label="Título" size="sm" value={draftTitle} onValueChange={setDraftTitle} />
        <Textarea label="Descrição" size="sm" minRows={2} value={draftDescription} onValueChange={setDraftDescription} />
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="light" onPress={() => setIsEditing(false)}>
            Cancelar
          </Button>
          <Button size="sm" color="primary" onPress={handleSave} isDisabled={!draftTitle}>
            Salvar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-2 rounded-xl border p-3 ${style.bg} ${style.border}`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-sm font-semibold ${style.text}`}>{note.title}</p>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={startEditing}
            className="rounded-md p-1 text-gray-500 transition hover:bg-white/10 hover:text-gray-200"
            title="Editar post-it"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(note.id)}
            className="rounded-md p-1 text-gray-500 transition hover:bg-danger/10 hover:text-danger"
            title="Excluir post-it"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {note.description && (
        <p className="whitespace-pre-wrap text-xs text-gray-300">{note.description}</p>
      )}

      <div className="mt-1 flex items-center justify-between">
        <PrioritySelector value={note.priority} onChange={(priority) => onChangePriority(note.id, priority)} />
        <span className="text-[10px] text-gray-500">
          {new Date(note.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </span>
      </div>
    </div>
  )
}
