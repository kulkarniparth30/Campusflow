import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const tones: Record<string, string> = {
  cyan: 'bg-[#DCE7F8] text-[#2563EB] border border-[#B8CCF0]',
  blue: 'bg-[#DCE7F8] text-[#2563EB] border border-[#B8CCF0]',
  indigo: 'bg-[#DCE7F8] text-[#2563EB] border border-[#B8CCF0]',
  violet: 'bg-[#DCE7F8] text-[#2563EB] border border-[#B8CCF0]',
  gold: 'bg-amber-50 text-amber-700 border border-amber-200',
  amber: 'bg-amber-50 text-amber-700 border border-amber-200',
  crimson: 'bg-rose-50 text-rose-700 border border-rose-200',
  emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  zinc: 'bg-[#F5F6F8] text-[#1F1F1F] border border-[#E2E6ED]',
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
