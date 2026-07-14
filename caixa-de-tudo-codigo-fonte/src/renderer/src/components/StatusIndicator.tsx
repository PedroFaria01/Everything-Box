interface StatusIndicatorProps {
  active: boolean
  label?: string
}

export function StatusIndicator({ active, label }: StatusIndicatorProps): JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <span
        className={
          'h-2.5 w-2.5 rounded-full ' +
          (active ? 'bg-accent-violet pulse-active' : 'bg-gray-500')
        }
      />
      <span className={'text-xs font-medium ' + (active ? 'text-accent-violet' : 'text-gray-400')}>
        {label ?? (active ? 'Ativo' : 'Inativo')}
      </span>
    </div>
  )
}
