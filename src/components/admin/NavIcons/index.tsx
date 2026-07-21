'use client'

import { createRoot } from 'react-dom/client'
import React, { useEffect } from 'react'

import { entityIcons } from '../entityIcons'

export const NavIcons: React.FC = () => {
  useEffect(() => {
    Object.entries(entityIcons).forEach(([slug, Icon]) => {
      const id = slug === 'header' || slug === 'footer' ? `nav-global-${slug}` : `nav-${slug}`
      const link = document.getElementById(id)
      const label = link?.querySelector('.nav__link-label')

      if (!link || !label || link.querySelector('[data-nav-icon]')) return

      const container = document.createElement('span')
      container.setAttribute('data-nav-icon', 'true')
      container.style.display = 'inline-flex'
      container.style.marginRight = '8px'
      label.before(container)
      createRoot(container).render(<Icon size={16} />)
    })
  }, [])

  return null
}

export default NavIcons
