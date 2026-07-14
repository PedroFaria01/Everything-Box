import { create } from 'zustand'
import type { AppSettings, AutoClickerStatus, AppError } from '../types'
import { DEFAULT_SETTINGS } from '../types'

interface AppState {
  settings: AppSettings
  status: AutoClickerStatus
  currentShortcut: string
  loaded: boolean
  errors: AppError[]

  setSettings: (settings: AppSettings) => void
  updateAutoClicker: (partial: Partial<AppSettings['autoClicker']>) => void
  setStatus: (status: AutoClickerStatus) => void
  setCurrentShortcut: (accelerator: string) => void
  setLoaded: (loaded: boolean) => void
  pushError: (error: AppError) => void
  dismissError: (index: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  settings: DEFAULT_SETTINGS,
  status: { running: false, clicksExecuted: 0, elapsedMs: 0, startedAt: null },
  currentShortcut: DEFAULT_SETTINGS.shortcut,
  loaded: false,
  errors: [],

  setSettings: (settings) => set({ settings }),

  updateAutoClicker: (partial) =>
    set((state) => ({
      settings: {
        ...state.settings,
        autoClicker: { ...state.settings.autoClicker, ...partial }
      }
    })),

  setStatus: (status) => set({ status }),

  setCurrentShortcut: (accelerator) => set({ currentShortcut: accelerator }),

  setLoaded: (loaded) => set({ loaded }),

  pushError: (error) => set((state) => ({ errors: [...state.errors, error] })),

  dismissError: (index) =>
    set((state) => ({ errors: state.errors.filter((_, i) => i !== index) }))
}))
