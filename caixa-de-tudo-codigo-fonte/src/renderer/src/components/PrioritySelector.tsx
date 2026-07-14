import { PRIORITIES, PRIORITY_LABELS } from '../types'
import type { Priority } from '../types'
import { PRIORITY_STYLES } from './priorityStyles'

interface PrioritySelectorProps {
  value: Priority
  onChange: (priority: Priority) => void
}

export function PrioritySelector({ value, onChange }: PrioritySelectorProps): JSX.Element {
  return (
    <div className="flex items-center gap-1.5">
      {PRIORITIES.map((priority) => (
        <button
          key={priority}
          type="button"
          onClick={() => onChange(priority)}
          title={PRIORITY_LABELS[priority]}
          aria-label={PRIORITY_LABELS[priority]}
          className={
            'h-3.5 w-3.5 rounded-full transition ' +
            PRIORITY_STYLES[priority].dot +
            ' ' +
            (value === priority
              ? 'ring-2 ring-white/60 ring-offset-1 ring-offset-base-900'
              : 'opacity-40 hover:opacity-80')
          }
        />
      ))}
    </div>
  )
}
