import { Button, Textarea } from '@heroui/react'
import { FolderOpen, Save, Sparkles } from 'lucide-react'
import { useTextGenerator } from '../../hooks/useTextGenerator'
import { CONVERSION_FORMAT_LABELS, CONVERSION_FORMATS } from '../../types'

export function TextGeneratorPage(): JSX.Element {
  const {
    prompt,
    setPrompt,
    generating,
    generate,
    text,
    setText,
    format,
    setFormat,
    saving,
    lastOutputPath,
    save,
    openLastInFolder
  } = useTextGenerator()

  return (
    <div className="flex flex-col gap-3">
      <div className="glass-card rounded-2xl p-4">
        <h2 className="mb-1 text-sm font-semibold text-gray-100">Gerador de texto</h2>
        <p className="mb-3 text-xs text-gray-500">
          Descreva o que você quer que a IA escreva — um e-mail, um resumo, um texto sobre qualquer assunto.
        </p>

        <Textarea
          placeholder='Ex: "escreva um e-mail formal pedindo prazo extra pra entrega de um projeto"'
          size="sm"
          minRows={3}
          value={prompt}
          onValueChange={setPrompt}
          isDisabled={generating}
        />

        <div className="mt-2 flex justify-end">
          <Button
            size="sm"
            color="primary"
            startContent={<Sparkles size={14} />}
            onPress={() => void generate()}
            isLoading={generating}
            isDisabled={!prompt.trim()}
          >
            Gerar com IA
          </Button>
        </div>
      </div>

      {text && (
        <div className="glass-card glow-border rounded-2xl p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-accent-violet">
            A IA escreveu isso — revise e edite antes de salvar
          </p>

          <Textarea size="sm" minRows={8} value={text} onValueChange={setText} isDisabled={saving} />

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
      )}

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
