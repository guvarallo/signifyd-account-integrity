const express = require('express')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const { apiKey } = require('./apiKey')

const app = express()
const DATA_FILE = path.join(__dirname, 'data', 'users.json')
const PORT = process.env.PORT || 4000
const JWT_SECRET = process.env.RTAS_JWT_SECRET || 'dev-secret-change-this'

app.use(express.json())
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))

function loadUsers() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    console.log(err)
    return []
  }
}

function saveUsers(users) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf8')
}

async function accountLogin(user, type) {
  const signinUrl = 'https://api.signifyd.com/v3/accounts/events/logins'
  const signupUrl = 'https://api.signifyd.com/v3/accounts/events/openings'
  const now = new Date()
  const isoDate = now.toISOString()
  const randomId = Math.random().toString(36).slice(2, 10)
  const isSignIn = type === 'signin' ? true : false
  const url = isSignIn ? signinUrl : signupUrl
  const reqBody = isSignIn
    ? {
        loginMethod: 'PASSWORD',
        loginResult: 'SUCCESS',
        userAccount: {
          accountType: 'BUYER',
          username: user.username,
          accountId: user.id,
          email: user.email
        },
        loginAt: isoDate,
        loginId: randomId
      }
    : {
        signupMethod: 'PASSWORD',
        accountType: 'BUYER',
        openingId: user.id,
        accountId: user.id,
        username: user.username,
        email: user.email,
        createdAt: isoDate
      }
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'SIGNIFYD-TEST-DECISION-RESPONSE': 'DENY',
      'content-type': 'application/json',
      authorization: `Basic ${apiKey}`
    },
    body: JSON.stringify(reqBody)
  }

  return await fetch(url, options)
    .then(res => res.json())
    .then(data => data)
    .catch(err => {
      console.error('error:' + err)
      return err
    })
}

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: '7d'
  })
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'Missing authorization' })
  const parts = auth.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer')
    return res.status(401).json({ error: 'Invalid authorization' })
  const token = parts[1]
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

app.post('/api/signup', async (req, res) => {
  const { email, password, username } = req.body || {}
  if (!email || !password || !username)
    return res
      .status(400)
      .json({ error: 'Email, username and password required' })
  const users = loadUsers()
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(400).json({ error: 'Username already in use' })
  }
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Email already in use' })
  }

  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(password, salt)
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  const user = { id, email, username, passwordHash: hash }

  // Signifyd account opening event
  const sigRes = await accountLogin(user)
  console.log('Signifyd signup response:', sigRes)
  console.log('Policies:', sigRes.decision?.policies)

  if (sigRes.decision?.checkpointAction === 'ALLOW') {
    users.push(user)
    saveUsers(users)
    const token = signToken(user)
    res.json({
      user: { id: user.id, email: user.email, username: user.username },
      token
    })
  }

  if (sigRes.decision?.checkpointAction === 'STEP_UP') {
    res.status(403).json({
      error: 'Further verification required',
      detail: 'STEP_UP'
    })
  }

  if (sigRes.decision?.checkpointAction === 'DENY') {
    res.status(403).json({
      error: 'Account creation denied',
      detail: 'DENY'
    })
  }
})

app.post('/api/signin', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' })
  const users = loadUsers()
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())
  if (!user) return res.status(400).json({ error: 'Invalid credentials' })
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' })

  // Signifyd account opening event
  const sigRes = await accountLogin(user, 'signin')
  console.log('Signifyd signin response:', sigRes)
  console.log('Policies:', sigRes.decision?.policies)

  if (sigRes.decision?.checkpointAction === 'ALLOW') {
    users.push(user)
    saveUsers(users)
    const token = signToken(user)
    res.json({ user: { id: user.id, email: user.email }, token })
  }

  if (sigRes.decision?.checkpointAction === 'STEP_UP') {
    res.status(403).json({
      error: 'Further verification required to login',
      detail: 'STEP_UP'
    })
  }

  if (sigRes.decision?.checkpointAction === 'DENY') {
    res.status(403).json({
      error: 'Login denied',
      detail: 'DENY'
    })
  }
})

app.get('/api/me', authMiddleware, (req, res) => {
  const users = loadUsers()
  const user = users.find(u => u.id === req.user.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json({ id: user.id, email: user.email, username: user.username })
})

app.put('/api/email', authMiddleware, (req, res) => {
  const { email } = req.body || {}
  if (!email) return res.status(400).json({ error: 'Email required' })
  const users = loadUsers()
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Email already in use' })
  }
  const idx = users.findIndex(u => u.id === req.user.id)
  if (idx === -1) return res.status(404).json({ error: 'User not found' })
  users[idx].email = email
  saveUsers(users)
  res.json({ id: users[idx].id, email: users[idx].email })
})

app.put('/api/password', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'Missing authorization' })
  const parts = auth.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer')
    return res.status(401).json({ error: 'Invalid authorization' })
  const token = parts[1]
  let payload
  try {
    payload = jwt.verify(token, JWT_SECRET)
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
  const { password } = req.body || {}
  if (!password) return res.status(400).json({ error: 'Password required' })
  const users = loadUsers()
  const idx = users.findIndex(u => u.id === payload.id)
  if (idx === -1) return res.status(404).json({ error: 'User not found' })
  const salt = await bcrypt.genSalt(10)
  users[idx].passwordHash = await bcrypt.hash(password, salt)
  saveUsers(users)
  res.json({ ok: true })
})

app.put('/api/username', authMiddleware, (req, res) => {
  const { username } = req.body || {}
  if (!username) return res.status(400).json({ error: 'Username required' })
  const users = loadUsers()
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(400).json({ error: 'Username already in use' })
  }
  const idx = users.findIndex(u => u.id === req.user.id)
  if (idx === -1) return res.status(404).json({ error: 'User not found' })
  users[idx].username = username
  saveUsers(users)
  res.json({ id: users[idx].id, username: users[idx].username })
})

app.listen(PORT, () => {
  console.log(`RTAS server listening on http://localhost:${PORT}`)
})
