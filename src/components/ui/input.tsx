import { cn } from '@/utilities/ui'
import * as React from 'react'

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className,
  type,
  ...props
}) => {
  return (
    <input
      data-slot="input"
      className={cn(
        'border-input bg-card file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-11 w-full min-w-0 rounded-md border px-4 py-2 text-base transition-[color,border-color,box-shadow] duration-200 ease-out file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25 focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/25 md:text-sm',
        className,
      )}
      type={type}
      {...props}
    />
  )
}

export { Input }
