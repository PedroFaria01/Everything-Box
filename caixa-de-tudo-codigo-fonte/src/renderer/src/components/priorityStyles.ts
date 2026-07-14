import type { Priority } from '../types'

interface PriorityStyle {
  bg: string
  border: string
  text: string
  dot: string
}

export const PRIORITY_STYLES: Record<Priority, PriorityStyle> = {
  normal: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-300',
    dot: 'bg-blue-500'
  },
  media: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-300',
    dot: 'bg-yellow-500'
  },
  alta: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-300',
    dot: 'bg-red-500'
  }
}
