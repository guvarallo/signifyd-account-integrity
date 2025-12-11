# React + TypeScript Auth Sample

Simple sample app demonstrating sign up / sign in by email wired with Signifyd's Account Integrity APIs.

Getting started

1. Install dependencies (root of project folder)

```bash
cd react-ts-auth-sample
npm install
cd server && npm install
```

Next, create a file inside the `server` folder named `apiKey.js` with your API key:

```bash
const apiKey = 'YOUR_API_KEY'

module.exports = { apiKey }
```

2. Run backend server and frontend dev server (two terminals recommended)

```bash
# Terminal 1 - start server
cd react-ts-auth-sample
npm run server

# Terminal 2 - start frontend
cd react-ts-auth-sample
npm run dev
```

Notes

- This is a minimal demo: users are stored in `server/data/users.json` and passwords are hashed with `bcryptjs`. JWTs are used for authentication. Do not use this for production authentication as-is.
