import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold shadow-md active:scale-[0.98]',
        ghost: 'hover:bg-[#DCE7F8] hover:text-[#2563EB] text-[#666666]',
        outline: 'border border-[#E2E6ED] bg-white hover:bg-[#F5F6F8] text-[#1F1F1F]',
        danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
        success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
        muted: 'bg-[#DCE7F8] text-[#2563EB] hover:bg-[#B8CCF0] border border-[#B8CCF0]',
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
