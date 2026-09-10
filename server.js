import bcrypt from 'bcryptjs'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { closeDatabase, getDatabase, initializeDatabase } from './db.js'

const app = express()
const port = process.env.PORT || 3001
const schoolName = 'ABC Nursery and Primary School, Madurai'
const demoAccounts = [
  { role: 'student', username: 'arjun', password: 'student123', name: 'Arjun' },
  { role: 'teacher', username: 'priya', password: 'teacher123', name: 'Priya' },
]

app.use(express.json())

app.get('/', (_request, response) => {
  response.type('html').send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>ABC School API</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 3rem; line-height: 1.6;">
        <h1>ABC Nursery and Primary School API</h1>
        <p>The school backend is running successfully.</p>
        <p>Open the frontend here: <a href="http://localhost:5173">http://localhost:5173</a></p>
        <p>Use the API endpoints under <code>/api</code> from the backend server.</p>
      </body>
    </html>
  `)
})

async function seedDemoAccounts() {
  const database = getDatabase()

  for (const account of demoAccounts) {
    const passwordHash = await bcrypt.hash(account.password, 12)
    await database.query(`
      INSERT INTO users (role, username, password_hash, name, school)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (role, username) DO NOTHING
    `, [account.role, account.username, passwordHash, account.name, schoolName])
  }
}

app.get('/api/health', async (_request, response) => {
  try {
    await getDatabase().query('SELECT 1')
    response.json({ status: 'ok', database: 'postgresql', school: schoolName })
  } catch {
    response.status(503).json({ status: 'error', message: 'PostgreSQL is unavailable.' })
  }
})

app.post('/api/login', async (request, response) => {
  const { role, username, password } = request.body

  if (!role || !username || !password) {
    return response.status(400).json({ message: 'Role, username, and password are required.' })
  }

  try {
    const { rows } = await getDatabase().query(
      'SELECT role, name, password_hash FROM users WHERE role = $1 AND username = $2',
      [role, username.trim().toLowerCase()],
    )
    const account = rows[0]
    const passwordMatches = account && await bcrypt.compare(password, account.password_hash)

    if (!passwordMatches) {
      return response.status(401).json({ message: 'The login details do not match this account.' })
    }

    return response.json({ user: { name: account.name, role: account.role, school: schoolName } })
  } catch {
    return response.status(503).json({ message: 'The school database is unavailable.' })
  }
})

async function authenticateTeacher(request) {
  const authorization = request.headers.authorization || ''
  const encodedCredentials = authorization.startsWith('Basic ') ? authorization.slice(6) : ''
  const [teacherUsername, teacherPassword] = Buffer.from(encodedCredentials, 'base64').toString().split(':')
  const { rows } = await getDatabase().query(
    'SELECT password_hash FROM users WHERE role = $1 AND username = $2',
    ['teacher', teacherUsername?.trim().toLowerCase()],
  )
  const teacher = rows[0]
  return teacher && await bcrypt.compare(teacherPassword || '', teacher.password_hash)
}

app.get('/api/students', async (request, response) => {
  try {
    const isTeacher = await authenticateTeacher(request)
    if (!isTeacher) {
      return response.status(403).json({ message: 'Only an authenticated teacher can view student accounts.' })
    }

    const { rows: students } = await getDatabase().query(
      'SELECT id, role, username, name, school, created_at AS "createdAt" FROM users WHERE role = $1 ORDER BY created_at DESC',
      ['student'],
    )
    return response.json({ students })
  } catch {
    return response.status(503).json({ message: 'The school database is unavailable.' })
  }
})

app.post('/api/students', async (request, response) => {
  try {
    const isTeacher = await authenticateTeacher(request)
    if (!isTeacher) {
      return response.status(403).json({ message: 'Only an authenticated teacher can create student accounts.' })
    }

    const { name, username, password } = request.body
    const normalizedUsername = username?.trim().toLowerCase()

    if (!name?.trim() || !normalizedUsername || !password) {
      return response.status(400).json({ message: 'Student name, username, and password are required.' })
    }

    const { rows } = await getDatabase().query(`
      INSERT INTO users (role, username, password_hash, name, school)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING name, username, school
    `, ['student', normalizedUsername, await bcrypt.hash(password, 12), name.trim(), schoolName])
    return response.status(201).json({ student: rows[0] })
  } catch (error) {
    if (error.code === '23505') {
      return response.status(409).json({ message: 'That username is already in use.' })
    }
    return response.status(503).json({ message: 'The school database is unavailable.' })
  }
})

const currentFile = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFile)
const distDirectory = path.join(currentDirectory, 'dist')

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distDirectory))
  app.get('/{*splat}', (_request, response) => response.sendFile(path.join(distDirectory, 'index.html')))
}

async function startServer() {
  try {
    await initializeDatabase()
    await seedDemoAccounts()
    app.listen(port, () => console.log(`ABC School backend running at http://localhost:${port}`))
  } catch (error) {
    console.error('Unable to connect to PostgreSQL:', error.message)
    process.exitCode = 1
  }
}

process.on('SIGINT', async () => {
  await closeDatabase()
  process.exit(0)
})

startServer()
