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

/* ── Groq API Client Service (OpenAI-compatible) ── */
export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export interface GroqChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export function getGroqApiKey(): string | null {
  if (typeof localStorage !== 'undefined') {
    const local = localStorage.getItem('cf-groq-api-key')
    if (local && local.trim()) return local.trim()
  }
  const envKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined
  if (envKey && envKey.trim()) return envKey.trim()
  return null
}

export function saveGroqApiKey(key: string) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('cf-groq-api-key', key.trim())
  }
}

export async function queryGroq(
  messages: GroqChatMessage[],
  options: {
    model?: string
    temperature?: number
    max_tokens?: number
  } = {}
): Promise<string> {
  const apiKey = getGroqApiKey()
  if (!apiKey) {
    throw new Error('Groq API Key is not set. Please provide your Groq API key (starts with gsk_).')
  }

  // Use groq/compound-mini or groq/compound (instant & versatile on Groq)
  const model = options.model || 'groq/compound-mini'

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.6,
      max_tokens: options.max_tokens ?? 1024,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Groq API Error (${res.status}): ${errText || res.statusText}`)
  }

  const json = await res.json()
  const content = json.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Groq did not return a response.')
  }
  return content
}

