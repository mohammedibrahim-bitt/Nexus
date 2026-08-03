import Link from 'next/link'
import React from 'react'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="container flex flex-col items-start py-28">
      <p className="kicker mb-3">Error 404</p>
      <h1 className="font-display text-5xl leading-tight font-semibold md:text-6xl">
        Page not found
      </h1>
      <p className="mt-4 mb-8 max-w-prose text-muted-foreground">
        The page you were looking for has moved, been unpublished, or never existed.
      </p>
      <Button asChild size="lg" variant="default">
        <Link href="/">Go home</Link>
      </Button>
    </div>
  )
}
