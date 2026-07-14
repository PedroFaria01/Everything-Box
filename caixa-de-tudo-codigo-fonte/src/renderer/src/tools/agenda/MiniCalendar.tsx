import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { AgendaTask, Priority } from '../../types'
import { PRIORITY_STYLES } from '../../components/priorityStyles'

interface MiniCalendarProps {
  tasks: AgendaTask[]
  selectedDate: string | null
  onSelectDate: (date: string | null) => void
}

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function toISODate(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

/** Prioridade mais alta entre as tarefas de um dia, pra colorir o marcador no calendário. */
function highestPriorityForDate(tasks: AgendaTask[], date: string): Priority | null {
  const dayTasks = tasks.filter((t) => t.date === date)
  if (dayTasks.length === 0) return null
  if (dayTasks.some((t) => t.priority === 'alta')) return 'alta'
  if (dayTasks.some((t) => t.priority === 'media')) return 'media'
  return 'normal'
}

export function MiniCalendar({ tasks, selectedDate, onSelectDate }: MiniCalendarProps): JSX.Element {
  const [viewDate, setViewDate] = useState(() => new Date())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const todayISO = useMemo(() => {
    const now = new Date()
    return toISODate(now.getFullYear(), now.getMonth(), now.getDate())
  }, [])

  const monthLabel = viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const cells = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1)
    const startOffset = firstOfMonth.getDay() // 0 = domingo
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const items: Array<{ day: number; date: string } | null> = []
    for (let i = 0; i < startOffset; i++) items.push(null)
    for (let day = 1; day <= daysInMonth; day++) {
      items.push({ day, date: toISODate(year, month, day) })
    }
    return items
  }, [year, month])

  const goToPreviousMonth = (): void => setViewDate(new Date(year, month - 1, 1))
  const goToNextMonth = (): void => setViewDate(new Date(year, month + 1, 1))

  return (
    <div className="glass-card rounded-2xl p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="rounded-md p-1 text-gray-400 transition hover:bg-white/5 hover:text-gray-200"
          title="Mês anterior"
        >
          <ChevronLeft size={15} />
        </button>
        <p className="text-xs font-medium capitalize text-gray-200">{monthLabel}</p>
        <button
          type="button"
          onClick={goToNextMonth}
          className="rounded-md p-1 text-gray-400 transition hover:bg-white/5 hover:text-gray-200"
          title="Próximo mês"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_LABELS.map((label, index) => (
          <span key={index} className="text-[10px] text-gray-600">
            {label}
          </span>
        ))}

        {cells.map((cell, index) => {
          if (!cell) return <div key={`empty-${index}`} />

          const isToday = cell.date === todayISO
          const isSelected = cell.date === selectedDate
          const priority = highestPriorityForDate(tasks, cell.date)

          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onSelectDate(isSelected ? null : cell.date)}
              className={
                'relative mx-auto flex h-7 w-7 items-center justify-center rounded-lg text-[11px] transition ' +
                (isSelected
                  ? 'bg-accent-violet/20 text-accent-violet'
                  : isToday
                    ? 'border border-accent-violet/40 text-gray-200'
                    : 'text-gray-400 hover:bg-white/5')
              }
            >
              {cell.day}
              {priority && (
                <span
                  className={`absolute bottom-0.5 h-1 w-1 rounded-full ${PRIORITY_STYLES[priority].dot}`}
                />
              )}
            </button>
          )
        })}
      </div>

      {selectedDate && (
        <button
          type="button"
          onClick={() => onSelectDate(null)}
          className="mt-2 text-[11px] text-accent-violet underline underline-offset-2"
        >
          Ver todos os dias
        </button>
      )}
    </div>
  )
}
