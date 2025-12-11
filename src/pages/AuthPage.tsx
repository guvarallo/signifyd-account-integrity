import React, { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

interface AuthPageProps {
  session: string
}

const AuthPage: React.FC<AuthPageProps> = ({ session }) => {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [username, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    try {
      if (mode === 'signin') await signIn(email.trim(), password, session)
      else await signUp(email.trim(), password, username.trim(), session)
    } catch (e: any) {
      setErr(e?.message || 'An error occurred')
    }
  }

  return (
    <div className='card'>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setMode('signin')}
          style={{ background: mode === 'signin' ? '#2563eb' : '#ddd' }}
        >
          Sign in
        </button>
        <button
          onClick={() => setMode('signup')}
          style={{ background: mode === 'signup' ? '#2563eb' : '#ddd' }}
        >
          Sign up
        </button>
      </div>
      <form className='form' onSubmit={submit}>
        {mode === 'signup' && <label className='small'>Username</label>}
        {mode === 'signup' && (
          <input
            value={username}
            onChange={e => setUserName(e.target.value)}
            type='username'
            required
          />
        )}
        <label className='small'>Email</label>
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          type='email'
          required
        />
        <label className='small'>Password</label>
        <input
          value={password}
          onChange={e => setPassword(e.target.value)}
          type='password'
          required
        />
        {err && <div style={{ color: 'crimson' }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type='submit'>
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AuthPage
