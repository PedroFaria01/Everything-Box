import { Button, Textarea } from '@heroui/react'
import { FolderOpen, Save } from 'lucide-react'
import { useTextToFile } from '../../hooks/useTextToFile'
import { CONVERSION_FORMAT_LABELS, CONVERSION_FORMATS } from '../../types'

export function TextToFilePage(): JSX.Element {
  const { text, setText, format, setFormat, saving, lastOutputPath, save, openLastInFolder } =
    useTextToFile()

  return (
    <div className="flex flex-col gap-3">
      <div className="glass-card rounded-2xl p-4">
        <h2 className="mb-1 text-sm font-semibold text-gray-100">Texto para arquivo</h2>
        <p className="mb-3 text-xs text-gray-500">
          Escreva ou cole um texto, escolha o formato e salve como um arquivo no seu computador.
        </p>

        <Textarea
          placeholder="Digite ou cole o texto aqui..."
          size="sm"
          minRows={8}
          value={text}
          onValueChange={setText}
          isDisabled={saving}
        />

        <div className="mt-3">
          <p className="mb-1.5 text-[10px] uppercase tracking-wider text-gray-600">Salvar como</p>
          <div className="flex flex-wrap gap-2">
            {CONVERSION_FORMATS.map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setFormat(fmt)}
                className={
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition ' +
                  (format === fmt
                    ? 'bg-accent-violet/10 text-accent-violet glow-border'
                    : 'bg-white/5 text-gray-400 hover:text-gray-200')
                }
              >
                {CONVERSION_FORMAT_LABELS[fmt]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <Button
            size="sm"
            color="primary"
            startContent={<Save size={14} />}
            isLoading={saving}
            isDisabled={!text.trim()}
            onPress={() => void save()}
          >
            Salvar arquivo
          </Button>
        </div>
      </div>

      {lastOutputPath && (
        <div className="glass-card flex items-center justify-between gap-3 rounded-2xl p-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-200">Arquivo salvo</p>
            <p className="truncate text-[11px] text-gray-500">{lastOutputPath}</p>
          </div>
          <Button size="sm" variant="flat" startContent={<FolderOpen size={14} />} onPress={openLastInFolder}>
            Abrir pasta
          </Button>
        </div>
      )}
    </div>
  )
}
