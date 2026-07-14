import { useState } from 'react'
import { Button, Input, Radio, RadioGroup, addToast } from '@heroui/react'
import { useAppStore } from '../store/appStore'
import { desktopApi } from '../services/desktopApi'
import type { TrayBehavior } from '../types'

export function Settings(): JSX.Element {
  const settings = useAppStore((s) => s.settings)
  const setSettings = useAppStore((s) => s.setSettings)
  const currentShortcut = useAppStore((s) => s.currentShortcut)
  const [baseUrlDraft, setBaseUrlDraft] = useState(settings.ollamaBaseUrl)
  const [modelDraft, setModelDraft] = useState(settings.ollamaModel)
  const [savingOllama, setSavingOllama] = useState(false)
  const [testingOllama, setTestingOllama] = useState(false)

  const hasUnsavedOllamaChanges =
    baseUrlDraft !== settings.ollamaBaseUrl || modelDraft !== settings.ollamaModel

  const handleTrayBehaviorChange = async (value: TrayBehavior): Promise<void> => {
    const next = { ...settings, trayBehavior: value }
    setSettings(next)
    await desktopApi().saveSettings(next)
  }

  const handleSaveOllamaSettings = async (): Promise<void> => {
    setSavingOllama(true)
    try {
      const next = {
        ...settings,
        ollamaBaseUrl: baseUrlDraft.trim(),
        ollamaModel: modelDraft.trim()
      }
      setSettings(next)
      const result = await desktopApi().saveSettings(next)
      if (!result.ok) {
        addToast({
          title: 'Falha ao salvar as configurações do Ollama',
          description: result.error.message,
          color: 'danger'
        })
        return
      }
      addToast({ title: 'Configurações do Ollama salvas', color: 'success' })
    } finally {
      setSavingOllama(false)
    }
  }

  const handleTestConnection = async (): Promise<void> => {
    setTestingOllama(true)
    try {
      const result = await desktopApi().checkOllamaConnection(baseUrlDraft.trim())
      if (!result.connected) {
        addToast({
          title: 'Não foi possível conectar ao Ollama',
          description: 'Confira se ele está rodando ("ollama serve") e se o endereço está certo.',
          color: 'danger'
        })
        return
      }
      addToast({
        title: 'Conectado ao Ollama',
        description:
          result.models.length > 0
            ? `Modelos instalados: ${result.models.join(', ')}`
            : 'Nenhum modelo baixado ainda — rode "ollama pull <modelo>".',
        color: 'success'
      })
    } finally {
      setTestingOllama(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="glass-card rounded-2xl p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-100">Configurações</h2>

        <div className="mb-4">
          <p className="mb-1 text-xs text-gray-400">Atalho global atual</p>
          <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs text-accent-cyan">
            {currentShortcut}
          </span>
          <p className="mt-1 text-[11px] text-gray-500">
            Altere o atalho na tela do Auto Clicker.
          </p>
        </div>

        <RadioGroup
          label="Ao clicar em fechar (X)"
          size="sm"
          value={settings.trayBehavior}
          onValueChange={(value) => void handleTrayBehaviorChange(value as TrayBehavior)}
        >
          <Radio value="ask" description="Mostrar essa pergunta toda vez">
            Perguntar
          </Radio>
          <Radio value="minimize" description="O app continua rodando na bandeja">
            Minimizar para a bandeja
          </Radio>
          <Radio value="close" description="Encerra o processo e para qualquer automação">
            Fechar o aplicativo
          </Radio>
        </RadioGroup>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <h2 className="mb-1 text-sm font-semibold text-gray-100">IA da Agenda (Ollama local)</h2>
        <p className="mb-3 text-xs text-gray-500">
          A Agenda usa um modelo rodando localmente via{' '}
          <a
            href="https://ollama.com"
            target="_blank"
            rel="noreferrer"
            className="text-accent-cyan underline"
          >
            Ollama
          </a>{' '}
          — sem custo e sem enviar seus dados pra fora do seu computador. Instale o Ollama, rode
          &quot;ollama pull &lt;modelo&gt;&quot; para baixar um modelo e confira a conexão abaixo.
        </p>

        <div className="flex flex-col gap-3">
          <Input
            label="Endereço do Ollama"
            size="sm"
            placeholder="http://localhost:11434"
            value={baseUrlDraft}
            onValueChange={setBaseUrlDraft}
          />
          <Input
            label="Nome do modelo baixado"
            size="sm"
            placeholder="llama3.1"
            value={modelDraft}
            onValueChange={setModelDraft}
          />

          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="flat"
              onPress={() => void handleTestConnection()}
              isLoading={testingOllama}
            >
              Testar conexão
            </Button>
            <Button
              size="sm"
              color="primary"
              onPress={() => void handleSaveOllamaSettings()}
              isLoading={savingOllama}
              isDisabled={!hasUnsavedOllamaChanges}
            >
              Salvar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
