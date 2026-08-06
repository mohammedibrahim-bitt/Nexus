'use client'

import type { DefaultCellComponentProps } from 'payload'

import { toast, useAuth } from '@payloadcms/ui'
import React, { useState } from 'react'

const ROLE_OPTIONS = [
  { label: 'Super Admin', value: 'super_admin' },
  { label: 'Admin', value: 'admin' },
  { label: 'Author', value: 'author' },
  { label: 'Reviewer', value: 'reviewer' },
  { label: 'Reader', value: 'reader' },
]

const baseClass = 'role-cell'

export const RoleCell: React.FC<DefaultCellComponentProps> = ({ cellData, rowData }) => {
  const { user } = useAuth()
  const [role, setRole] = useState((cellData as string) || 'author')
  const [saving, setSaving] = useState(false)

  // A tenant-scoped admin can grant Admin/Author/Reviewer/Reader within their
  // own tenant, but never Super Admin — enforced server-side in
  // enforceTenantAdminBoundaries.ts, mirrored here so the option isn't
  // offered in the first place. They also can't change their own role at
  // all, so that row's select is disabled rather than silently rejected.
  const isTenantAdminViewer = user?.role === 'admin'
  const isEditingOwnRow = user && String(user.id) === String(rowData.id)
  const options = isTenantAdminViewer ? ROLE_OPTIONS.filter((o) => o.value !== 'super_admin') : ROLE_OPTIONS
  const disabled = saving || (isTenantAdminViewer && Boolean(isEditingOwnRow))

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
      disabled={disabled}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        background: 'var(--theme-input-bg)',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '4px',
        color: 'var(--theme-elevation-800)',
        cursor: disabled ? (saving ? 'wait' : 'not-allowed') : 'pointer',
        fontSize: '13px',
        padding: '4px 8px',
      }}
      value={role}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export default RoleCell
