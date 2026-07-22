'use client'

import { motion, useReducedMotion, type Variants } from 'framer-motion'
import React from 'react'

import { useNexus } from './NexusProvider'

const variants: Variants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
  }),
}

/** Fades + slides content in when it scrolls into view. Respects the settings toggle and reduced-motion. */
export function Reveal({
  children,
  delay = 0,
  className,
  as = 'div',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  as?: 'div' | 'section' | 'li' | 'header'
}) {
  const { settings } = useNexus()
  const reduced = useReducedMotion()
  const Tag = (motion as unknown as Record<string, typeof motion.div>)[as] ?? motion.div

  if (!settings.animations || reduced) return <div className={className}>{children}</div>

  return (
    <Tag
      className={className}
      custom={delay}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      variants={variants}
    >
      {children}
    </Tag>
  )
}

/** Staggers direct children as the container scrolls into view. */
export function RevealList({ children, className }: { children: React.ReactNode; className?: string }) {
  const items = React.Children.toArray(children)
  return (
    <div className={className}>
      {items.map((child, i) => (
        <Reveal key={i} delay={Math.min(i * 0.08, 0.5)}>
          {child}
        </Reveal>
      ))}
    </div>
  )
}
