import { useEffect, useMemo, useState } from 'react'
import { Button, Select, SelectItem, Input, Switch, Radio, RadioGroup } from '@heroui/react'
import { Crosshair, Play, Square } from 'lucide-react'
import { StatusIndicator } from '../../components/StatusIndicator'
import { ShortcutCapture } from './ShortcutCapture'
import { useAppStore } from '../../store/appStore'
import { useAutoClicker } from '../../hooks/useAutoClicker'
import { desktopApi } from '../../services/desktopApi'
import {
  MIN_INTERVAL_MS,
  MAX_INTERVAL_MS,
  MIN_CLICK_COUNT,
  MAX_CLICK_COUNT,
  MAX_INITIAL_DELAY_MS,
  type MouseButton,
  type ExecutionMode,
  type ClickPositionMode
} from '../../types'

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.min(Math.max(value, min), max)
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number): string => n.toString().padStart(2, '0')
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
}

export function AutoClickerCard(): JSX.Element {
  const config = useAppStore((s) => s.settings.autoClicker)
  const settings = useAppStore((s) => s.settings)
  const setSettings = useAppStore((s) => s.setSettings)
  const updateAutoClicker = useAppStore((s) => s.updateAutoClicker)
  const status = useAppStore((s) => s.status)
  const { start, stop, capturePosition } = useAutoClicker()

  const [displayElapsed, setDisplayElapsed] = useState(0)

  useEffect(() => {
    if (!status.running || !status.startedAt) {
      setDisplayElapsed(status.elapsedMs)
      return
    }
    const startedAt = status.startedAt
    const tick = (): void => setDisplayElapsed(Date.now() - startedAt)
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [status.running, status.startedAt, status.elapsedMs])

  const clicksPerSecond = useMemo(() => {
    if (config.intervalMs <= 0) return 0
    return Math.round((1000 / config.intervalMs) * 100) / 100
  }, [config.intervalMs])

  const persist = async (partial: Partial<typeof config>): Promise<void> => {
    updateAutoClicker(partial)
    const next = { ...settings, autoClicker: { ...config, ...partial } }
    setSettings(next)
    await desktopApi().saveSettings(next)
  }

  const handleIntervalChange = (value: string): void => {
    const ms = clamp(Number(value), MIN_INTERVAL_MS, MAX_INTERVAL_MS)
    void persist({ intervalMs: ms })
  }

  const handleCpsChange = (value: string): void => {
    const cps = clamp(Number(value), 1000 / MAX_INTERVAL_MS, 1000 / MIN_INTERVAL_MS)
    const ms = clamp(Math.round(1000 / cps), MIN_INTERVAL_MS, MAX_INTERVAL_MS)
    void persist({ intervalMs: ms })
  }

  const toggle = async (): Promise<void> => {
    if (status.running) {
      await stop()
    } else {
      await start()
    }
  }

  return (
    <div className="glass-card glow-border rounded-2xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-100">Auto Clicker</h2>
          <StatusIndicator active={status.running} />
        </div>
        <ShortcutCapture />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl bg-white/[0.03] p-3 text-center">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-500">Cliques</p>
          <p className="font-mono text-lg text-accent-cyan">{status.clicksExecuted}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-500">Tempo</p>
          <p className="font-mono text-lg text-accent-purple">{formatElapsed(displayElapsed)}</p>
        </div>
      </div>

      <Button
        fullWidth
        color={status.running ? 'danger' : 'primary'}
        startContent={status.running ? <Square size={16} /> : <Play size={16} />}
        onPress={() => void toggle()}
        className="mb-4"
      >
        {status.running ? 'Parar' : 'Iniciar'}
      </Button>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Intervalo (ms)"
          type="number"
          size="sm"
          value={String(config.intervalMs)}
          onChange={(e) => handleIntervalChange(e.target.value)}
          min={MIN_INTERVAL_MS}
          max={MAX_INTERVAL_MS}
        />
        <Input
          label="Cliques/segundo"
          type="number"
          size="sm"
          value={String(clicksPerSecond)}
          onChange={(e) => handleCpsChange(e.target.value)}
        />
      </div>

      <div className="mt-3">
        <Select
          label="Botão do mouse"
          size="sm"
          selectedKeys={[config.mouseButton]}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0] as MouseButton
            void persist({ mouseButton: value })
          }}
        >
          <SelectItem key="left">Esquerdo</SelectItem>
          <SelectItem key="right">Direito</SelectItem>
          <SelectItem key="middle">Meio</SelectItem>
        </Select>
      </div>

      <div className="mt-3">
        <RadioGroup
          label="Tipo de execução"
          size="sm"
          orientation="horizontal"
          value={config.executionMode}
          onValueChange={(value) => void persist({ executionMode: value as ExecutionMode })}
        >
          <Radio value="continuous">Contínuo</Radio>
          <Radio value="count">Quantidade</Radio>
        </RadioGroup>
      </div>

      {config.executionMode === 'count' && (
        <Input
          className="mt-3"
          label="Quantidade de cliques"
          type="number"
          size="sm"
          value={String(config.clickCount)}
          min={MIN_CLICK_COUNT}
          max={MAX_CLICK_COUNT}
          onChange={(e) =>
            void persist({ clickCount: clamp(Number(e.target.value), MIN_CLICK_COUNT, MAX_CLICK_COUNT) })
          }
        />
      )}

      <Input
        className="mt-3"
        label="Atraso inicial (ms)"
        type="number"
        size="sm"
        value={String(config.initialDelayMs)}
        min={0}
        max={MAX_INITIAL_DELAY_MS}
        onChange={(e) =>
          void persist({ initialDelayMs: clamp(Number(e.target.value), 0, MAX_INITIAL_DELAY_MS) })
        }
      />

      <div className="mt-3 flex items-center justify-between rounded-xl bg-white/[0.03] p-3">
        <div>
          <p className="text-xs text-gray-300">Posição fixa</p>
          <p className="text-[11px] text-gray-500">
            {config.positionMode === 'fixed' && config.fixedPosition
              ? `X: ${config.fixedPosition.x} · Y: ${config.fixedPosition.y}`
              : 'Usando posição atual do cursor'}
          </p>
        </div>
        <Switch
          size="sm"
          isSelected={config.positionMode === 'fixed'}
          onValueChange={(selected: boolean) =>
            void persist({ positionMode: (selected ? 'fixed' : 'cursor') as ClickPositionMode })
          }
        />
      </div>

      {config.positionMode === 'fixed' && (
        <Button
          size="sm"
          variant="flat"
          className="mt-2"
          startContent={<Crosshair size={14} />}
          onPress={() => void capturePosition()}
        >
          Capturar posição atual
        </Button>
      )}
    </div>
  )
}
