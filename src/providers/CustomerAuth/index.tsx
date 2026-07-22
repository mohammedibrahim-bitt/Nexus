'use client'

import React, { createContext, use, useCallback, useEffect, useState } from 'react'

export type Customer = {
  id: string
  email: string
  name: string
}

type CustomerAuthContextType = {
  customer: Customer | null
  forgotPassword: (email: string) => Promise<void>
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  verifyEmail: (token: string) => Promise<void>
}

const CustomerAuthContext = createContext<CustomerAuthContextType>({
  customer: null,
  forgotPassword: async () => {},
  loading: true,
  login: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  signup: async () => {},
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

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/customers/me', { credentials: 'include' })
      const data = await res.json()
      if (data?.user) {
        setCustomer({ id: data.user.id, email: data.user.email, name: data.user.name })
      } else {
        setCustomer(null)
      }
    } catch {
      setCustomer(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/customers/login', {
      body: JSON.stringify({ email, password }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })

    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Login failed'))
    }

    const data = await res.json()
    setCustomer({ id: data.user.id, email: data.user.email, name: data.user.name })
  }, [])

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const registerRes = await fetch('/api/customers', {
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
    await fetch('/api/customers/logout', { credentials: 'include', method: 'POST' })
    setCustomer(null)
  }, [])

  const forgotPassword = useCallback(async (email: string) => {
    const res = await fetch('/api/customers/forgot-password', {
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
    const res = await fetch('/api/customers/reset-password', {
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
      setCustomer({ id: data.user.id, email: data.user.email, name: data.user.name })
    }
  }, [])

  const verifyEmail = useCallback(async (token: string) => {
    const res = await fetch(`/api/customers/verify/${token}`, {
      credentials: 'include',
      method: 'POST',
    })

    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Could not verify your account'))
    }
  }, [])

  return (
    <CustomerAuthContext
      value={{ customer, forgotPassword, loading, login, logout, resetPassword, signup, verifyEmail }}
    >
      {children}
    </CustomerAuthContext>
  )
}

export const useCustomerAuth = (): CustomerAuthContextType => use(CustomerAuthContext)
