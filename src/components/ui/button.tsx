import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white font-semibold shadow-[0_0_24px_-4px_rgba(6,182,212,0.6)] hover:shadow-[0_0_30px_rgba(6,182,212,0.8)] hover:brightness-110 active:scale-[0.98]',
        ghost: 'hover:bg-cyan-500/10 hover:text-cyan-300 text-zinc-300',
        outline: 'border border-white/12 bg-white/3 hover:bg-white/8 hover:border-cyan-500/40 text-zinc-200',
        danger: 'bg-rose-600 text-white hover:bg-rose-500 shadow-[0_0_20px_-5px_rgba(244,63,94,0.5)]',
        success: 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)]',
        muted: 'bg-white/6 text-zinc-200 hover:bg-white/10',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-5',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
