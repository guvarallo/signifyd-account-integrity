import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import AccountPage from './pages/AccountPage'
import { useAuth } from './auth/AuthContext'
import Nav from './components/Nav'

const App: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="container">
      <Nav />
      <Routes>
        <Route path="/" element={user ? <AccountPage /> : <AuthPage />} />
        <Route path="/account" element={user ? <AccountPage /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}

export default App
