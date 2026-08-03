import { cn } from '@/utilities/ui'
import * as React from 'react'

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  className,
  ...props
}) => {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input bg-card placeholder:text-muted-foreground flex field-sizing-content min-h-20 w-full rounded-md border px-4 py-3 text-base leading-relaxed transition-[color,border-color,box-shadow] duration-200 ease-out focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/25 md:text-sm',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
