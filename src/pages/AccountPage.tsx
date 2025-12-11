import React, { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

interface AccountPageProps {
  session: string
}

const AccountPage: React.FC<AccountPageProps> = ({ session }) => {
  const { user, updateEmail, updatePassword, updateUsername } = useAuth()
  const [newEmail, setNewEmail] = useState(user?.email || '')
  const [newUsername, setNewUsername] = useState(user?.username || '')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [password, setPassword] = useState('')

  async function changeUSerName(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setMsg(null)
    try {
      await updateUsername(newUsername.trim())
      setMsg('Username updated')
    } catch (e: any) {
      setErr(e?.message || 'Error')
    }
  }

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setMsg(null)
    try {
      await updateEmail(newEmail.trim())
      setMsg('Email updated')
    } catch (e: any) {
      setErr(e?.message || 'Error')
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setMsg(null)
    try {
      await updatePassword(password)
      setMsg('Password updated')
      setPassword('')
    } catch (e: any) {
      setErr(e?.message || 'Error')
    }
  }

  return (
    <div className='card'>
      <h3>Account</h3>
      <div className='muted'>
        Signed in as: <strong>{user?.email}</strong>
      </div>

      <form
        onSubmit={changeUSerName}
        className='form'
        style={{ marginTop: 12 }}
      >
        <label className='small'>Change Username</label>
        <input
          value={newUsername}
          onChange={e => setNewUsername(e.target.value)}
          type='username'
          required
        />
        <button type='submit'>Update Username</button>
      </form>

      <form onSubmit={changeEmail} className='form' style={{ marginTop: 12 }}>
        <label className='small'>Change Email</label>
        <input
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          type='email'
          required
        />
        <button type='submit'>Update Email</button>
      </form>

      <form
        onSubmit={changePassword}
        className='form'
        style={{ marginTop: 12 }}
      >
        <label className='small'>Change Password</label>
        <input
          value={password}
          onChange={e => setPassword(e.target.value)}
          type='password'
          required
        />
        <button type='submit'>Update Password</button>
      </form>

      {msg && <div style={{ color: 'green', marginTop: 8 }}>{msg}</div>}
      {err && <div style={{ color: 'crimson', marginTop: 8 }}>{err}</div>}
    </div>
  )
}

export default AccountPage
