import { Button, Input, Textarea } from '@heroui/react'
import type { NoteDraft } from '../../types'
import { PRIORITY_LABELS } from '../../types'
import { PrioritySelector } from '../../components/PrioritySelector'

interface NoteDraftCardProps {
  draft: NoteDraft
  onChange: (next: NoteDraft) => void
  onConfirm: () => void
  onCancel: () => void
}

export function NoteDraftCard({ draft, onChange, onConfirm, onCancel }: NoteDraftCardProps): JSX.Element {
  return (
    <div className="glass-card glow-border rounded-2xl p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-accent-violet">
        A IA organizou isso — revise antes de salvar
      </p>

      <div className="flex flex-col gap-3">
        <Input
          label="Título"
          size="sm"
          value={draft.title}
          onValueChange={(value) => onChange({ ...draft, title: value })}
        />

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
        <Button size="sm" color="primary" onPress={onConfirm} isDisabled={!draft.title}>
          Salvar post-it
        </Button>
      </div>
    </div>
  )
}
