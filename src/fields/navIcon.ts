import type { Field } from 'payload'

export const navIconOptions = [
  { label: 'None', value: '' },
  { label: 'Home', value: 'home' },
  { label: 'Post / Article', value: 'file-text' },
  { label: 'Mail', value: 'mail' },
  { label: 'Phone', value: 'phone' },
  { label: 'Info', value: 'info' },
  { label: 'Search', value: 'search' },
  { label: 'Star', value: 'star' },
  { label: 'Shield / Trust', value: 'shield-check' },
  { label: 'Globe', value: 'globe' },
  { label: 'Message', value: 'message-square-text' },
]

export const navIcon = (): Field => ({
  name: 'icon',
  type: 'select',
  admin: {
    description: 'Optional icon shown next to this link.',
  },
  defaultValue: '',
  options: navIconOptions,
})
