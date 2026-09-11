import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-all duration-200 focus:border-amber-400/70 focus:ring-2 focus:ring-amber-500/25 focus:shadow-[0_0_15px_rgba(245,158,11,0.2)]',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-28 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-all duration-200 focus:border-amber-400/70 focus:ring-2 focus:ring-amber-500/25 focus:shadow-[0_0_15px_rgba(245,158,11,0.2)]',
        className,
      )}
      {...props}
    />
  )
}
