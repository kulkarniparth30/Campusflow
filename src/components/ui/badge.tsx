import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const tones: Record<string, string> = {
  cyan: 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]',
  blue: 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/30',
  indigo: 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/30',
  violet: 'bg-purple-500/15 text-purple-300 ring-1 ring-purple-400/30',
  gold: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30',
  amber: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30',
  crimson: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]',
  emerald: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
  zinc: 'bg-white/6 text-zinc-300 ring-1 ring-white/10',
}

export function Badge({
  className,
  tone = 'zinc',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider', tones[tone], className)}
      {...props}
    />
  )
}
