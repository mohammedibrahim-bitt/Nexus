'use client'

import React, { createContext, use, useCallback, useEffect, useState } from 'react'

export type StaffRole = 'admin' | 'author' | 'reader' | 'reviewer'

export type Staff = {
  avatarUrl: null | string
  email: string
  id: string
  name: string
  role: StaffRole
}

const extractAvatarUrl = (user: { avatar?: { url?: null | string } | null }): null | string =>
  (typeof user.avatar === 'object' && user.avatar?.url) || null

type StaffAuthContextType = {
  forgotPassword: (email: string) => Promise<void>
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  staff: null | Staff
  verifyEmail: (token: string) => Promise<void>
}

const StaffAuthContext = createContext<StaffAuthContextType>({
  forgotPassword: async () => {},
  loading: true,
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
  resetPassword: async () => {},
  signup: async () => {},
  staff: null,
  verifyEmail: async () => {},
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
      const res = await fetch('/api/users/me?depth=1', { credentials: 'include' })
      const data = await res.json()
      if (data?.user) {
        setStaff({
          id: data.user.id,
          avatarUrl: extractAvatarUrl(data.user),
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
    const res = await fetch('/api/users/login?depth=1', {
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
      avatarUrl: extractAvatarUrl(data.user),
      email: data.user.email,
      name: data.user.name,
      role: data.user.role,
    })
  }, [])

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const registerRes = await fetch('/api/users', {
      body: JSON.stringify({ email, name, password }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })

    if (!registerRes.ok) {
      throw new Error(await parseErrorMessage(registerRes, 'Could not create your account'))
    }

    // Accounts require email verification before they can log in, so we
    // intentionally don't attempt to log in here.
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/users/logout', { credentials: 'include', method: 'POST' })
    setStaff(null)
  }, [])

  const forgotPassword = useCallback(async (email: string) => {
    const res = await fetch('/api/users/forgot-password', {
      body: JSON.stringify({ email }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })

    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Something went wrong'))
    }
  }, [])

  const resetPassword = useCallback(async (token: string, password: string) => {
    const res = await fetch('/api/users/reset-password?depth=1', {
      body: JSON.stringify({ token, password }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })

    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Could not reset your password'))
    }

    const data = await res.json()
    if (data?.user) {
      setStaff({
        id: data.user.id,
        avatarUrl: extractAvatarUrl(data.user),
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
      })
    }
  }, [])

  const verifyEmail = useCallback(async (token: string) => {
    const res = await fetch(`/api/users/verify/${token}`, {
      credentials: 'include',
      method: 'POST',
    })

    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Could not verify your account'))
    }
  }, [])

  return (
    <StaffAuthContext
      value={{ forgotPassword, loading, login, logout, refresh, resetPassword, signup, staff, verifyEmail }}
    >
      {children}
    </StaffAuthContext>
  )
}

export const useStaffAuth = (): StaffAuthContextType => use(StaffAuthContext)
