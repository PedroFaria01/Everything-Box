import { FileStack, FolderOpen, Upload } from 'lucide-react'
import { Button } from '@heroui/react'
import { useConverter } from '../../hooks/useConverter'
import { CONVERSION_FORMAT_LABELS } from '../../types'

export function ConverterPage(): JSX.Element {
  const { file, target, setTarget, converting, lastOutputPath, pickFile, convert, reset, openLastInFolder } =
    useConverter()

  return (
    <div className="flex flex-col gap-3">
      <div className="glass-card rounded-2xl p-4">
        <h2 className="mb-1 text-sm font-semibold text-gray-100">Conversor de arquivos</h2>
        <p className="mb-3 text-xs text-gray-500">
          Converta entre TXT, DOCX e PDF. Selecione um arquivo, escolha o formato de destino e salve.
        </p>

        {!file && (
          <Button size="sm" color="primary" startContent={<Upload size={14} />} onPress={() => void pickFile()}>
            Selecionar arquivo
          </Button>
        )}

        {file && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
              <FileStack size={16} className="text-accent-violet" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-gray-200">{file.name}</p>
                <p className="text-[11px] text-gray-500">{CONVERSION_FORMAT_LABELS[file.format]}</p>
              </div>
            </div>

            {file.targets.length === 0 && (
              <p className="text-xs text-gray-500">Não há conversões disponíveis para esse formato.</p>
            )}

            {file.targets.length > 0 && (
              <div>
                <p className="mb-1.5 text-[10px] uppercase tracking-wider text-gray-600">Converter para</p>
                <div className="flex flex-wrap gap-2">
                  {file.targets.map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setTarget(fmt)}
                      className={
                        'rounded-lg px-3 py-1.5 text-xs font-medium transition ' +
                        (target === fmt
                          ? 'bg-accent-violet/10 text-accent-violet glow-border'
                          : 'bg-white/5 text-gray-400 hover:text-gray-200')
                      }
                    >
                      {CONVERSION_FORMAT_LABELS[fmt]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                color="primary"
                isDisabled={!target}
                isLoading={converting}
                onPress={() => void convert()}
              >
                Converter
              </Button>
              <Button size="sm" variant="light" onPress={reset} isDisabled={converting}>
                Trocar arquivo
              </Button>
            </div>
          </div>
        )}
      </div>

      {lastOutputPath && (
        <div className="glass-card flex items-center justify-between gap-3 rounded-2xl p-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-200">Conversão concluída</p>
            <p className="truncate text-[11px] text-gray-500">{lastOutputPath}</p>
          </div>
          <Button
            size="sm"
            variant="flat"
            startContent={<FolderOpen size={14} />}
            onPress={openLastInFolder}
          >
            Abrir pasta
          </Button>
        </div>
      )}
    </div>
  )
}
