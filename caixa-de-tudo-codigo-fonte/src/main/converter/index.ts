import { extname } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { BrowserWindow } from 'electron'
import { Document, Packer, Paragraph } from 'docx'
import mammoth from 'mammoth'
import { PDFParse } from 'pdf-parse'
import type { ConversionFormat } from '../../renderer/src/types'

export class UnsupportedConversionError extends Error {}
export class ConversionFailedError extends Error {}

const CONVERSION_TARGETS: Record<ConversionFormat, ConversionFormat[]> = {
  txt: ['docx', 'pdf'],
  docx: ['txt', 'pdf'],
  pdf: ['txt', 'docx']
}

export function detectFormat(filePath: string): ConversionFormat | null {
  const ext = extname(filePath).toLowerCase().replace('.', '')
  if (ext === 'txt' || ext === 'docx' || ext === 'pdf') return ext
  return null
}

export function getAvailableTargets(from: ConversionFormat): ConversionFormat[] {
  return CONVERSION_TARGETS[from] ?? []
}

async function readTxt(path: string): Promise<string> {
  return readFile(path, 'utf-8')
}

function textToDocxBuffer(text: string): Promise<Buffer> {
  const lines = text.split(/\r?\n/)
  const paragraphs = lines.map((line) => new Paragraph(line))
  const doc = new Document({
    sections: [{ children: paragraphs.length > 0 ? paragraphs : [new Paragraph('')] }]
  })
  return Packer.toBuffer(doc)
}

async function docxToText(path: string): Promise<string> {
  const result = await mammoth.extractRawText({ path })
  return result.value
}

async function docxToHtml(path: string): Promise<string> {
  const result = await mammoth.convertToHtml({ path })
  return result.value
}

async function pdfToText(path: string): Promise<string> {
  const buffer = await readFile(path)
  const parser = new PDFParse({ data: buffer })
  try {
    const result = await parser.getText()
    return result.text
  } finally {
    await parser.destroy()
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function wrapPlainTextAsHtml(text: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { font-family: Arial, sans-serif; font-size: 12pt; white-space: pre-wrap; padding: 40px; }
  </style></head><body>${escapeHtml(text)}</body></html>`
}

function wrapHtmlFragment(html: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { font-family: Arial, sans-serif; font-size: 12pt; padding: 40px; line-height: 1.5; }
    img { max-width: 100%; }
  </style></head><body>${html}</body></html>`
}

async function htmlToPdfBuffer(html: string): Promise<Buffer> {
  const win = new BrowserWindow({ show: false, webPreferences: { sandbox: false } })
  try {
    const encoded = Buffer.from(html, 'utf-8').toString('base64')
    await win.loadURL(`data:text/html;base64,${encoded}`)
    return await win.webContents.printToPDF({ printBackground: true, pageSize: 'A4' })
  } finally {
    win.destroy()
  }
}

/**
 * Converte um arquivo entre os formatos suportados. DOCX->PDF e TXT->PDF renderizam HTML
 * offscreen e usam o Chromium embutido no Electron (printToPDF) em vez de dependências
 * nativas externas como LibreOffice.
 */
export async function convertFile(
  inputPath: string,
  outputPath: string,
  from: ConversionFormat,
  to: ConversionFormat
): Promise<void> {
  if (from === to || !CONVERSION_TARGETS[from]?.includes(to)) {
    throw new UnsupportedConversionError(`Não é possível converter de ${from} para ${to}.`)
  }

  try {
    if (from === 'txt' && to === 'docx') {
      const buffer = await textToDocxBuffer(await readTxt(inputPath))
      await writeFile(outputPath, buffer)
      return
    }
    if (from === 'txt' && to === 'pdf') {
      const buffer = await htmlToPdfBuffer(wrapPlainTextAsHtml(await readTxt(inputPath)))
      await writeFile(outputPath, buffer)
      return
    }
    if (from === 'docx' && to === 'txt') {
      await writeFile(outputPath, await docxToText(inputPath), 'utf-8')
      return
    }
    if (from === 'docx' && to === 'pdf') {
      const buffer = await htmlToPdfBuffer(wrapHtmlFragment(await docxToHtml(inputPath)))
      await writeFile(outputPath, buffer)
      return
    }
    if (from === 'pdf' && to === 'txt') {
      await writeFile(outputPath, await pdfToText(inputPath), 'utf-8')
      return
    }
    if (from === 'pdf' && to === 'docx') {
      const buffer = await textToDocxBuffer(await pdfToText(inputPath))
      await writeFile(outputPath, buffer)
      return
    }
    throw new UnsupportedConversionError(`Conversão de ${from} para ${to} não implementada.`)
  } catch (error) {
    if (error instanceof UnsupportedConversionError) throw error
    throw new ConversionFailedError(
      error instanceof Error ? error.message : 'Falha desconhecida na conversão.'
    )
  }
}

/**
 * Salva um texto digitado diretamente pelo usuário como um arquivo TXT, DOCX ou PDF,
 * reaproveitando os mesmos conversores usados para arquivos.
 */
export async function exportTextToFile(
  text: string,
  outputPath: string,
  format: ConversionFormat
): Promise<void> {
  try {
    if (format === 'txt') {
      await writeFile(outputPath, text, 'utf-8')
      return
    }
    if (format === 'docx') {
      const buffer = await textToDocxBuffer(text)
      await writeFile(outputPath, buffer)
      return
    }
    if (format === 'pdf') {
      const buffer = await htmlToPdfBuffer(wrapPlainTextAsHtml(text))
      await writeFile(outputPath, buffer)
      return
    }
  } catch (error) {
    throw new ConversionFailedError(
      error instanceof Error ? error.message : 'Falha desconhecida ao salvar o arquivo.'
    )
  }
}
