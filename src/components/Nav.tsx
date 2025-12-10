import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const Nav: React.FC = () => {
  const { user, signOut } = useAuth()
  return (
    <div className="nav">
      <div>
        <strong>Auth Sample</strong>
      </div>
      <div className="row">
        {user ? (
          <>
            <span className="muted small">{user.email}</span>
            <Link to="/account"><button style={{background:'#0ea5e9'}}>Account</button></Link>
            <button onClick={() => signOut()} style={{background:'#ef4444'}}>Sign out</button>
          </>
        ) : (
          <Link to="/"><button>Sign in</button></Link>
        )}
      </div>
    </div>
  )
}

export default Nav
