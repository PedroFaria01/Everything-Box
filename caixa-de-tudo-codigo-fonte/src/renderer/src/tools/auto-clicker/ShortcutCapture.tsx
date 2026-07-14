import { useState, type KeyboardEvent } from 'react'
import { Button, Input, addToast } from '@heroui/react'
import { desktopApi } from '../../services/desktopApi'
import { useAppStore } from '../../store/appStore'

const KEY_ALIASES: Record<string, string> = {
  ' ': 'Space',
  Control: '',
  Shift: '',
  Alt: '',
  Meta: '',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Escape: 'Escape',
  Enter: 'Return'
}

function normalizeKey(key: string): string {
  if (KEY_ALIASES[key] !== undefined) return KEY_ALIASES[key]
  if (/^[a-z]$/.test(key)) return key.toUpperCase()
  if (/^F\d{1,2}$/.test(key)) return key
  return key.length === 1 ? key.toUpperCase() : key
}

function buildAccelerator(e: KeyboardEvent<HTMLInputElement>): string | null {
  const parts: string[] = []
  if (e.ctrlKey) parts.push('Ctrl')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')
  if (e.metaKey) parts.push('Super')

  const main = normalizeKey(e.key)
  if (!main) return null // era só um modificador sozinho

  parts.push(main)
  return parts.join('+')
}

export function ShortcutCapture(): JSX.Element {
  const currentShortcut = useAppStore((s) => s.currentShortcut)
  const setCurrentShortcut = useAppStore((s) => s.setCurrentShortcut)
  const settings = useAppStore((s) => s.settings)
  const setSettings = useAppStore((s) => s.setSettings)

  const [capturing, setCapturing] = useState(false)
  const [draft, setDraft] = useState(currentShortcut)
  const [saving, setSaving] = useState(false)

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    e.preventDefault()
    const accelerator = buildAccelerator(e)
    if (accelerator) {
      setDraft(accelerator)
    }
  }

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    try {
      const validation = await desktopApi().validateShortcut(draft)
      if (!validation.ok) {
        addToast({
          title: 'Atalho inválido',
          description: validation.error.message,
          color: 'danger'
        })
        return
      }

      const registration = await desktopApi().registerShortcut(draft)
      if (!registration.ok) {
        addToast({
          title: 'Atalho indisponível',
          description: registration.error.message,
          color: 'danger'
        })
        return
      }

      setCurrentShortcut(registration.accelerator)
      const newSettings = { ...settings, shortcut: registration.accelerator }
      setSettings(newSettings)
      await desktopApi().saveSettings(newSettings)

      addToast({
        title: 'Atalho atualizado',
        description: `Novo atalho: ${registration.accelerator}`,
        color: 'success'
      })
      setCapturing(false)
    } finally {
      setSaving(false)
    }
  }

  if (!capturing) {
    return (
      <div className="flex items-center gap-2">
        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs text-accent-violet">
          {currentShortcut}
        </span>
        <Button
          size="sm"
          variant="flat"
          onPress={() => {
            setDraft(currentShortcut)
            setCapturing(true)
          }}
        >
          Alterar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        size="sm"
        autoFocus
        value={draft}
        onKeyDown={handleKeyDown}
        onChange={() => {}}
        placeholder="Pressione as teclas..."
        className="w-40 font-mono"
      />
      <Button size="sm" color="primary" isLoading={saving} onPress={() => void handleSave()}>
        Salvar
      </Button>
      <Button size="sm" variant="light" onPress={() => setCapturing(false)}>
        Cancelar
      </Button>
    </div>
  )
}
