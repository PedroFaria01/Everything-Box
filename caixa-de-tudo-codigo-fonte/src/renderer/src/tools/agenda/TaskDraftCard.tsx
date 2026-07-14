import { Button, Input, Select, SelectItem, Textarea } from '@heroui/react'
import type { TaskCategory, TaskDraft } from '../../types'
import { PRIORITY_LABELS, TASK_CATEGORIES, TASK_CATEGORY_LABELS } from '../../types'
import { PrioritySelector } from '../../components/PrioritySelector'

interface TaskDraftCardProps {
  draft: TaskDraft
  onChange: (next: TaskDraft) => void
  onConfirm: () => void
  onCancel: () => void
}

export function TaskDraftCard({ draft, onChange, onConfirm, onCancel }: TaskDraftCardProps): JSX.Element {
  return (
    <div className="glass-card glow-border rounded-2xl p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-accent-violet">
        A IA entendeu isso — revise antes de salvar
      </p>

      <div className="flex flex-col gap-3">
        <Input
          label="Título"
          size="sm"
          value={draft.title}
          onValueChange={(value) => onChange({ ...draft, title: value })}
        />

        <div className="flex gap-3">
          <Input
            type="date"
            label="Data"
            size="sm"
            value={draft.date}
            onValueChange={(value) => onChange({ ...draft, date: value })}
          />
          <Input
            type="time"
            label="Horário (opcional)"
            size="sm"
            value={draft.time}
            onValueChange={(value) => onChange({ ...draft, time: value })}
          />
        </div>

        <Select
          label="Categoria"
          size="sm"
          selectedKeys={[draft.category]}
          onSelectionChange={(keys) => {
            const [value] = Array.from(keys)
            if (value) onChange({ ...draft, category: value as TaskCategory })
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
          onValueChange={(value) => onChange({ ...draft, description: value })}
        />

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Prioridade: {PRIORITY_LABELS[draft.priority]}</p>
          <PrioritySelector value={draft.priority} onChange={(priority) => onChange({ ...draft, priority })} />
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button size="sm" variant="light" onPress={onCancel}>
          Cancelar
        </Button>
        <Button size="sm" color="primary" onPress={onConfirm} isDisabled={!draft.title || !draft.date}>
          Salvar na agenda
        </Button>
      </div>
    </div>
  )
}
