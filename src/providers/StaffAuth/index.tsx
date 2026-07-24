'use client'

import React, { createContext, use, useCallback, useEffect, useState } from 'react'

export type StaffRole = 'admin' | 'author' | 'reviewer'

export type Staff = {
  email: string
  id: string
  name: string
  role: StaffRole
}

type StaffAuthContextType = {
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  staff: null | Staff
}

const StaffAuthContext = createContext<StaffAuthContextType>({
  loading: true,
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
  staff: null,
})

const parseErrorMessage = async (res: Response, fallback: string) => {
  try {
    const data = await res.json()
    return data?.errors?.[0]?.message || fallback
  } catch {
    return fallback
  }
}

export const StaffAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [staff, setStaff] = useState<null | Staff>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/users/me', { credentials: 'include' })
      const data = await res.json()
      if (data?.user) {
        setStaff({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
        })
      } else {
        setStaff(null)
      }
    } catch {
      setStaff(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/users/login', {
      body: JSON.stringify({ email, password }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })

    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Login failed'))
    }

    const data = await res.json()
    setStaff({
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      role: data.user.role,
    })
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/users/logout', { credentials: 'include', method: 'POST' })
    setStaff(null)
  }, [])

  return (
    <StaffAuthContext value={{ loading, login, logout, refresh, staff }}>
      {children}
    </StaffAuthContext>
  )
}

export const useStaffAuth = (): StaffAuthContextType => use(StaffAuthContext)
