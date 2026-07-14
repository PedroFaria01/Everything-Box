import { globalShortcut } from 'electron'

/**
 * Lista de teclas/modificadores aceitos pelo Electron globalShortcut.
 * Usada para validar combinações digitadas pelo usuário antes de tentar registrar.
 */
const VALID_MODIFIERS = new Set(['CommandOrControl', 'Ctrl', 'Alt', 'Shift', 'Super', 'Meta'])

const VALID_KEYS = new Set([
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split(''),
  ...Array.from({ length: 24 }, (_, i) => `F${i + 1}`),
  'Space',
  'Tab',
  'Backspace',
  'Delete',
  'Insert',
  'Return',
  'Enter',
  'Up',
  'Down',
  'Left',
  'Right',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'Escape',
  'PrintScreen'
])

export class InvalidShortcutError extends Error {}
export class ShortcutUnavailableError extends Error {}

/** Valida a sintaxe do acelerador (ex: "Ctrl+Shift+C", "F6", "Alt+A"). */
export function validateAccelerator(accelerator: string): void {
  if (!accelerator || !accelerator.trim()) {
    throw new InvalidShortcutError('Atalho vazio.')
  }

  const parts = accelerator.split('+').map((p) => p.trim())
  const key = parts[parts.length - 1]
  const modifiers = parts.slice(0, -1)

  if (!VALID_KEYS.has(key)) {
    throw new InvalidShortcutError(`Tecla principal inválida: "${key}".`)
  }

  for (const mod of modifiers) {
    if (!VALID_MODIFIERS.has(mod)) {
      throw new InvalidShortcutError(`Modificador inválido: "${mod}".`)
    }
  }
}

let currentAccelerator: string | null = null

/**
 * Remove o atalho anterior (se houver) e registra o novo.
 * Retorna o acelerador efetivamente registrado.
 */
export function registerGlobalShortcut(accelerator: string, callback: () => void): string {
  validateAccelerator(accelerator)

  // Remove o atalho anterior antes de registrar o novo
  if (currentAccelerator) {
    try {
      globalShortcut.unregister(currentAccelerator)
    } catch (error) {
      console.warn('[shortcuts] Falha ao remover atalho anterior:', error)
    }
    currentAccelerator = null
  }

  const success = globalShortcut.register(accelerator, callback)

  if (!success) {
    throw new ShortcutUnavailableError(
      `O atalho "${accelerator}" já está em uso por outro programa ou não pôde ser registrado.`
    )
  }

  currentAccelerator = accelerator
  return accelerator
}

export function unregisterCurrentShortcut(): void {
  if (currentAccelerator) {
    globalShortcut.unregister(currentAccelerator)
    currentAccelerator = null
  }
}

export function unregisterAllShortcuts(): void {
  globalShortcut.unregisterAll()
  currentAccelerator = null
}

export function getCurrentAccelerator(): string | null {
  return currentAccelerator
}
