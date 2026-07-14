import { useState } from 'react'
import { Button, Checkbox, Chip, Input, Select, SelectItem, Textarea } from '@heroui/react'
import { Pencil, Trash2 } from 'lucide-react'
import type { AgendaTask, TaskCategory } from '../../types'
import { TASK_CATEGORIES, TASK_CATEGORY_LABELS } from '../../types'
import { PRIORITY_STYLES } from '../../components/priorityStyles'
import { PrioritySelector } from '../../components/PrioritySelector'

interface TaskCardProps {
  task: AgendaTask
  onToggleDone: (id: string) => void
  onDelete: (id: string) => void
  onSave: (id: string, partial: Partial<AgendaTask>) => void
}

const CATEGORY_COLOR: Record<AgendaTask['category'], 'primary' | 'secondary' | 'success' | 'warning' | 'default'> = {
  trabalho: 'primary',
  pessoal: 'secondary',
  saude: 'success',
  financeiro: 'warning',
  outro: 'default'
}

export function TaskCard({ task, onToggleDone, onDelete, onSave }: TaskCardProps): JSX.Element {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(task)

  const style = PRIORITY_STYLES[task.priority]

  const startEditing = (): void => {
    setDraft(task)
    setIsEditing(true)
  }

  const handleSave = (): void => {
    onSave(task.id, {
      title: draft.title,
      date: draft.date,
      time: draft.time,
      description: draft.description,
      category: draft.category
    })
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className={`flex flex-col gap-2 rounded-xl border p-3 ${style.bg} ${style.border}`}>
        <Input
          label="Título"
          size="sm"
          value={draft.title}
          onValueChange={(value) => setDraft({ ...draft, title: value })}
        />
        <div className="flex gap-2">
          <Input
            type="date"
            label="Data"
            size="sm"
            value={draft.date}
            onValueChange={(value) => setDraft({ ...draft, date: value })}
          />
          <Input
            type="time"
            label="Horário"
            size="sm"
            value={draft.time}
            onValueChange={(value) => setDraft({ ...draft, time: value })}
          />
        </div>
        <Select
          label="Categoria"
          size="sm"
          selectedKeys={[draft.category]}
          onSelectionChange={(keys) => {
            const [value] = Array.from(keys)
            if (value) setDraft({ ...draft, category: value as TaskCategory })
          }}
        >
          {TASK_CATEGORIES.map((category) => (
            <SelectItem key={category}>{TASK_CATEGORY_LABELS[category]}</SelectItem>
          ))}
        </Select>
        <Textarea
          label="Descrição"
          size="sm"
          minRows={2}
          value={draft.description}
          onValueChange={(value) => setDraft({ ...draft, description: value })}
        />
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="light" onPress={() => setIsEditing(false)}>
            Cancelar
          </Button>
          <Button size="sm" color="primary" onPress={handleSave} isDisabled={!draft.title || !draft.date}>
            Salvar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={
        `flex items-start gap-3 rounded-xl border p-3 transition ${style.bg} ${style.border} ` +
        (task.done ? 'opacity-50' : '')
      }
    >
      <Checkbox
        isSelected={task.done}
        onValueChange={() => onToggleDone(task.id)}
        className="mt-0.5"
        aria-label={`Marcar "${task.title}" como concluída`}
      />

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className={'text-sm font-medium text-gray-100' + (task.done ? ' line-through' : '')}>
            {task.title}
          </p>
          {task.time && (
            <span className="rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-accent-violet">
              {task.time}
            </span>
          )}
        </div>
        {task.description && <p className="mt-1 text-xs text-gray-400">{task.description}</p>}

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Chip size="sm" variant="flat" color={CATEGORY_COLOR[task.category]}>
              {TASK_CATEGORY_LABELS[task.category]}
            </Chip>
            <PrioritySelector value={task.priority} onChange={(priority) => onSave(task.id, { priority })} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={startEditing}
          className="rounded-md p-1.5 text-gray-500 transition hover:bg-white/10 hover:text-gray-200"
          title="Editar tarefa"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="rounded-md p-1.5 text-gray-500 transition hover:bg-danger/10 hover:text-danger"
          title="Excluir tarefa"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
