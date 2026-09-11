import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] px-3.5 text-xs text-[#1F1F1F] placeholder:text-[#999999] outline-none transition-all duration-200 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20',
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
        'min-h-28 w-full rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] px-3.5 py-2.5 text-xs text-[#1F1F1F] placeholder:text-[#999999] outline-none transition-all duration-200 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20',
        className,
      )}
      {...props}
    />
  )
}
