import { useState } from 'react'
import { Button, Textarea } from '@heroui/react'
import { Sparkles } from 'lucide-react'
import { useAgenda } from '../../hooks/useAgenda'
import type { AgendaTask, TaskDraft } from '../../types'
import { MiniCalendar } from './MiniCalendar'
import { TaskCard } from './TaskCard'
import { TaskDraftCard } from './TaskDraftCard'

function formatDateLabel(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dateStr

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.getTime() === today.getTime()) return 'Hoje'
  if (date.getTime() === tomorrow.getTime()) return 'Amanhã'

  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
}

function groupByDate(tasks: AgendaTask[]): Array<[string, AgendaTask[]]> {
  const groups = new Map<string, AgendaTask[]>()
  for (const task of tasks) {
    const list = groups.get(task.date) ?? []
    list.push(task)
    groups.set(task.date, list)
  }
  return Array.from(groups.entries())
}

export function AgendaPage(): JSX.Element {
  const { tasks, loading, parsing, parseTaskFromText, confirmTask, updateTask, toggleDone, removeTask } =
    useAgenda()
  const [inputText, setInputText] = useState('')
  const [draft, setDraft] = useState<TaskDraft | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const handleParse = async (): Promise<void> => {
    if (!inputText.trim()) return
    const result = await parseTaskFromText(inputText)
    if (result) setDraft({ ...result, priority: 'normal' })
  }

  const handleConfirm = async (): Promise<void> => {
    if (!draft) return
    await confirmTask(draft)
    setDraft(null)
    setInputText('')
  }

  const visibleTasks = selectedDate ? tasks.filter((t) => t.date === selectedDate) : tasks
  const groups = groupByDate(visibleTasks)

  return (
    <div className="flex flex-col gap-3">
      <div className="glass-card rounded-2xl p-4">
        <h2 className="mb-1 text-sm font-semibold text-gray-100">Agenda</h2>
        <p className="mb-3 text-xs text-gray-500">
          Descreva a tarefa com suas palavras — a IA organiza data, horário e categoria pra você.
        </p>

        <Textarea
          placeholder='Ex: "reunião com o cliente amanhã às 14h" ou "pagar o boleto sexta-feira"'
          size="sm"
          minRows={2}
          value={inputText}
          onValueChange={setInputText}
          isDisabled={parsing}
        />

        <div className="mt-2 flex justify-end">
          <Button
            size="sm"
            color="primary"
            startContent={<Sparkles size={14} />}
            onPress={() => void handleParse()}
            isLoading={parsing}
            isDisabled={!inputText.trim()}
          >
            Organizar com IA
          </Button>
        </div>
      </div>

      {draft && (
        <TaskDraftCard
          draft={draft}
          onChange={setDraft}
          onConfirm={() => void handleConfirm()}
          onCancel={() => setDraft(null)}
        />
      )}

      <MiniCalendar tasks={tasks} selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <div className="flex flex-col gap-3">
        {loading && <p className="px-1 text-xs text-gray-500">Carregando tarefas...</p>}

        {!loading && groups.length === 0 && (
          <div className="glass-card rounded-2xl p-4 text-center">
            <p className="text-xs text-gray-500">
              {selectedDate
                ? 'Nenhuma tarefa nesse dia.'
                : 'Nenhuma tarefa ainda. Descreva uma acima para começar.'}
            </p>
          </div>
        )}

        {groups.map(([date, dateTasks]) => (
          <div key={date} className="glass-card rounded-2xl p-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-500">
              {formatDateLabel(date)}
            </p>
            <div className="flex flex-col gap-2">
              {dateTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleDone={(id) => void toggleDone(id)}
                  onDelete={(id) => void removeTask(id)}
                  onSave={(id, partial) => void updateTask(id, partial)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
