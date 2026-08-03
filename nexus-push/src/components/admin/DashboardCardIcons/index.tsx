'use client'

import { createRoot } from 'react-dom/client'
import React, { useEffect } from 'react'

import { entityIcons } from '../entityIcons'

export const DashboardCardIcons: React.FC = () => {
  useEffect(() => {
    Object.entries(entityIcons).forEach(([slug, Icon]) => {
      const card = document.getElementById(`card-${slug}`)
      const title = card?.querySelector('.card__title')

      if (!card || !title || card.querySelector('[data-card-icon]')) return

      const container = document.createElement('span')
      container.setAttribute('data-card-icon', 'true')
      container.style.display = 'inline-flex'
      container.style.marginRight = '6px'
      container.style.verticalAlign = 'text-bottom'
      title.prepend(container)
      createRoot(container).render(<Icon size={18} />)
    })
  }, [])

  return null
}

export default DashboardCardIcons
