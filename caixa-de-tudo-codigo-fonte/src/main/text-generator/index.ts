import { callOllamaJSON } from '../ollama'

export class InvalidPromptError extends Error {}

interface GeneratedTextFromAI {
  texto: string
}

const TEXT_SCHEMA = {
  type: 'object',
  properties: {
    texto: { type: 'string' }
  },
  required: ['texto']
}

const SYSTEM_PROMPT =
  'Você é um assistente de escrita que gera textos em português a partir de um pedido do usuário. ' +
  'Escreva diretamente o texto solicitado — sem introduções como "aqui está o texto", sem explicar o que ' +
  'fez, sem comentários fora do texto pedido. Siga o tom, o tamanho e o formato pedidos (ex: se pedirem um ' +
  'parágrafo curto, não escreva várias páginas; se pedirem tópicos, use tópicos). Não invente fatos ' +
  'específicos e verificáveis (nomes reais, datas, números, eventos) que não tenham sido dados pelo usuário, ' +
  'a menos que o pedido seja claramente fictício ou genérico. Responda apenas com o JSON pedido, sem texto ' +
  'ao redor.'

/**
 * Usa um modelo rodando localmente no Ollama para escrever um texto livre a partir de um
 * pedido do usuário (ex: "escreva um e-mail pedindo prazo extra pra entrega de um projeto").
 */
export async function generateTextWithAI(
  prompt: string,
  baseUrl: string,
  model: string
): Promise<string> {
  if (!prompt || !prompt.trim()) {
    throw new InvalidPromptError('Descreva o que você quer que a IA escreva.')
  }

  const result = await callOllamaJSON<GeneratedTextFromAI>({
    baseUrl,
    model,
    systemPrompt: SYSTEM_PROMPT,
    userText: prompt,
    schema: TEXT_SCHEMA,
    temperature: 0.7
  })

  return result.texto
}
