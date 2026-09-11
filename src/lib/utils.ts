import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function uid(prefix = 'id') {
  return `${prefix}_${crypto.randomUUID()}`
}

export function formatPct(n: number) {
  return `${Math.round(n * 10) / 10}%`
}
