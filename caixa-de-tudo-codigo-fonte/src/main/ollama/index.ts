export class OllamaUnavailableError extends Error {}
export class AiParseError extends Error {}

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

/** Confere se o Ollama está acessível e devolve a lista de modelos já baixados. */
export async function checkOllamaConnection(
  baseUrl: string
): Promise<{ connected: boolean; models: string[] }> {
  try {
    const response = await fetch(`${normalizeBaseUrl(baseUrl)}/api/tags`)
    if (!response.ok) return { connected: false, models: [] }
    const data = (await response.json()) as { models?: Array<{ name: string }> }
    return { connected: true, models: (data.models ?? []).map((m) => m.name) }
  } catch (error) {
    console.warn('[ollama] Ollama indisponível ao testar conexão:', error)
    return { connected: false, models: [] }
  }
}

interface CallOllamaJSONParams {
  baseUrl: string
  model: string
  systemPrompt: string
  userText: string
  /** JSON Schema usado no parâmetro `format` do Ollama para forçar a estrutura da resposta. */
  schema: Record<string, unknown>
}

/**
 * Chama o endpoint /api/chat de um modelo rodando localmente no Ollama (https://ollama.com),
 * pedindo uma resposta em JSON que siga o schema informado, e devolve o objeto já parseado.
 */
export async function callOllamaJSON<T>({
  baseUrl,
  model,
  systemPrompt,
  userText,
  schema
}: CallOllamaJSONParams): Promise<T> {
  if (!model || !model.trim()) {
    throw new OllamaUnavailableError('Informe o nome do modelo do Ollama em Configurações.')
  }

  let response: Response
  try {
    response = await fetch(`${normalizeBaseUrl(baseUrl)}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText }
        ],
        format: schema,
        stream: false
      })
    })
  } catch (error) {
    console.error('[ollama] Falha ao conectar ao Ollama:', error)
    throw new OllamaUnavailableError(
      'Não foi possível conectar ao Ollama. Verifique se ele está rodando ("ollama serve") e se o ' +
        'endereço configurado em Configurações está correto.'
    )
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '')
    console.error('[ollama] Ollama retornou erro:', response.status, bodyText)
    throw new OllamaUnavailableError(
      response.status === 404
        ? `Modelo "${model}" não encontrado no Ollama. Rode "ollama pull ${model}" e tente de novo.`
        : 'O Ollama retornou um erro ao processar o pedido.'
    )
  }

  let payload: { message?: { content?: string } }
  try {
    payload = (await response.json()) as { message?: { content?: string } }
  } catch (error) {
    console.error('[ollama] Resposta do Ollama não é um JSON válido:', error)
    throw new AiParseError('O Ollama retornou uma resposta inesperada.')
  }

  const content = payload.message?.content
  if (!content) {
    throw new AiParseError('O modelo não retornou nenhum conteúdo.')
  }

  try {
    return JSON.parse(content) as T
  } catch (error) {
    console.error('[ollama] Resposta do modelo não é um JSON válido:', content, error)
    throw new AiParseError('O modelo retornou uma resposta em formato inesperado.')
  }
}
