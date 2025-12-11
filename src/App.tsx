import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import AccountPage from './pages/AccountPage'
import { useAuth } from './auth/AuthContext'
import Nav from './components/Nav'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import generateSessionId from './utils/session'

const App: React.FC = () => {
  const { user } = useAuth()
  const [session] = useState<string>(() => generateSessionId())

  return (
    <div className='container'>
      <HelmetProvider>
        <Helmet>
          <script
            defer
            type='text/javascript'
            id='sig-api'
            data-order-session-id={session}
            src='https://cdn-scripts.signifyd.com/api/script-tag.js'
          ></script>
        </Helmet>
        <Nav />
        <Routes>
          <Route
            path='/'
            element={
              user ? (
                <AccountPage session={session} />
              ) : (
                <AuthPage session={session} />
              )
            }
          />
          <Route
            path='/account'
            element={
              user ? <AccountPage session={session} /> : <Navigate to='/' />
            }
          />
          <Route path='*' element={<Navigate to='/' />} />
        </Routes>
      </HelmetProvider>
    </div>
  )
}

export default App
