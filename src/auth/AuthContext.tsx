/// <reference types="vite/client" />
import React, { createContext, useContext, useEffect, useState } from 'react'

type User = { id: string; email: string; username: string }

type AuthContextType = {
  user: User | null
  signUp: (
    email: string,
    password: string,
    username: string,
    session: string
  ) => Promise<void>
  signIn: (email: string, password: string, session: string) => Promise<void>
  signOut: () => void
  updateEmail: (newEmail: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  updateUsername: (newUsername: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'rtas_token'
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

async function handleResp(res: Response) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error || 'Request failed')
  }
  return data
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return
    fetch(`${API_BASE}/api/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => handleResp(res))
      .then(data =>
        setUser({ id: data.id, email: data.email, username: data.username })
      )
      .catch(() => localStorage.removeItem(TOKEN_KEY))
  }, [])

  async function signUp(
    email: string,
    password: string,
    username: string,
    session: string
  ) {
    const res = await fetch(`${API_BASE}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username, session })
    })
    const data = await handleResp(res)
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
  }

  async function signIn(email: string, password: string, session: string) {
    const res = await fetch(`${API_BASE}/api/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, session })
    })
    const data = await handleResp(res)
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
  }

  function signOut() {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  async function updateEmail(newEmail: string) {
    if (!user) throw new Error('Not signed in')
    const token = localStorage.getItem(TOKEN_KEY)
    const res = await fetch(`${API_BASE}/api/email`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ email: newEmail })
    })
    const data = await handleResp(res)
    setUser({ id: data.id, email: data.email, username: data.username })
  }

  async function updatePassword(newPassword: string) {
    if (!user) throw new Error('Not signed in')
    const token = localStorage.getItem(TOKEN_KEY)
    const res = await fetch(`${API_BASE}/api/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ password: newPassword })
    })
    await handleResp(res)
  }

  async function updateUsername(newUsername: string) {
    if (!user) throw new Error('Not signed in')
    const token = localStorage.getItem(TOKEN_KEY)
    const res = await fetch(`${API_BASE}/api/username`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ username: newUsername })
    })
    await handleResp(res)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        signUp,
        signIn,
        signOut,
        updateEmail,
        updatePassword,
        updateUsername
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
