import { cn } from '@/utilities/ui'
import { Slot } from '@radix-ui/react-slot'
import { type VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'

/*
 * Buttons follow the reference UI: fully-rounded to the shared radius token,
 * a 1px lift on hover, and a 0.97 press shrink standing in for its
 * `whileTap={{ scale: 0.97 }}` (kept in CSS so the admin "Enable Animations"
 * switch and prefers-reduced-motion both still cancel it).
 *
 * `cta` now resolves to the same accent as `default` — the reference drives
 * every call-to-action from the single accent colour rather than holding a
 * separate editorial link-blue — but stays as its own variant so existing
 * call sites keep working and can be re-pointed later if that changes.
 */
const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-[color,background-color,box-shadow,transform,border-color] duration-200 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[var(--shadow-sm)] hover:bg-primary/90 hover:shadow-[var(--shadow-md)] hover:-translate-y-px active:translate-y-0',
        cta: 'bg-link text-white shadow-[var(--shadow-sm)] hover:bg-link-hover hover:shadow-[var(--shadow-md)] hover:-translate-y-px active:translate-y-0',
        destructive:
          'bg-destructive text-destructive-foreground shadow-[var(--shadow-sm)] hover:bg-destructive/90 hover:shadow-[var(--shadow-md)] hover:-translate-y-px active:translate-y-0',
        outline:
          'border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground',
        secondary:
          'border border-border bg-secondary text-secondary-foreground hover:bg-accent hover:shadow-[var(--shadow-sm)]',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-link underline underline-offset-4 decoration-1 hover:text-link-hover',
      },
      size: {
        clear: '',
        default: 'h-10 px-5 py-2 has-[>svg]:px-4',
        sm: 'h-9 rounded-lg px-3.5 text-[0.8125rem] has-[>svg]:px-3',
        lg: 'h-12 rounded-lg px-7 text-base has-[>svg]:px-5',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button: React.FC<ButtonProps> = ({ asChild = false, className, size, variant, ...props }) => {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
