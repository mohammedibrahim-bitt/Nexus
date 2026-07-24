'use client'

import type { DefaultCellComponentProps } from 'payload'

import { toast } from '@payloadcms/ui'
import React, { useState } from 'react'

const ROLE_OPTIONS = [
  { label: 'Admin', value: 'admin' },
  { label: 'Author', value: 'author' },
  { label: 'Reviewer', value: 'reviewer' },
]

const baseClass = 'role-cell'

export const RoleCell: React.FC<DefaultCellComponentProps> = ({ cellData, rowData }) => {
  const [role, setRole] = useState((cellData as string) || 'author')
  const [saving, setSaving] = useState(false)

  const onChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextRole = e.target.value
    const previousRole = role
    setRole(nextRole)
    setSaving(true)

    try {
      const res = await fetch(`/api/users/${rowData.id}`, {
        body: JSON.stringify({ role: nextRole }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.errors?.[0]?.message || 'Could not update role.')
      }

      toast.success(`Role updated to ${nextRole}.`)
    } catch (err) {
      setRole(previousRole)
      toast.error(err instanceof Error ? err.message : 'Could not update role.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <select
      className={baseClass}
      disabled={saving}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        background: 'var(--theme-input-bg)',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '4px',
        color: 'var(--theme-elevation-800)',
        cursor: saving ? 'wait' : 'pointer',
        fontSize: '13px',
        padding: '4px 8px',
      }}
      value={role}
    >
      {ROLE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export default RoleCell
