import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'quiet' | 'ghost'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
}

const styles: Record<Variant, string> = {
  primary: 'bg-copper text-ivory hover:bg-copper-deep shadow-[var(--shadow-lift)]',
  quiet: 'bg-ivory text-ink hairline hover:bg-canvas',
  ghost: 'bg-transparent text-ink/80 hover:bg-ink/5 hover:text-ink',
}

export function Button({ variant = 'primary', className, type = 'button', ...props }: Props) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[10px] px-3.5 py-2 text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        styles[variant],
        className,
      )}
      {...props}
    />
  )
}
