import bcrypt from 'bcryptjs'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { closeDatabase, getDatabase } from './db.js'

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

async function usersCollection() {
  const database = await getDatabase()
  return database.collection('users')
}

async function seedDemoAccounts() {
  const users = await usersCollection()
  await users.createIndex({ role: 1, username: 1 }, { unique: true })

  for (const account of demoAccounts) {
    const existingAccount = await users.findOne({ role: account.role, username: account.username })
    if (!existingAccount) {
      await users.insertOne({
        role: account.role,
        username: account.username,
        passwordHash: await bcrypt.hash(account.password, 12),
        name: account.name,
        school: schoolName,
        createdAt: new Date(),
      })
    }
  }
}

app.get('/api/health', async (_request, response) => {
  try {
    await getDatabase()
    response.json({ status: 'ok', database: 'mongodb', school: schoolName })
  } catch {
    response.status(503).json({ status: 'error', message: 'MongoDB is unavailable.' })
  }
})

app.post('/api/login', async (request, response) => {
  const { role, username, password } = request.body

  if (!role || !username || !password) {
    return response.status(400).json({ message: 'Role, username, and password are required.' })
  }

  try {
    const users = await usersCollection()
    const account = await users.findOne({ role, username: username.trim().toLowerCase() })
    const passwordMatches = account && await bcrypt.compare(password, account.passwordHash)

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
  const users = await usersCollection()
  const teacher = await users.findOne({ role: 'teacher', username: teacherUsername?.trim().toLowerCase() })
  const matches = teacher && await bcrypt.compare(teacherPassword || '', teacher.passwordHash)
  return matches ? users : null
}

app.get('/api/students', async (request, response) => {
  try {
    const users = await authenticateTeacher(request)
    if (!users) {
      return response.status(403).json({ message: 'Only an authenticated teacher can view student accounts.' })
    }

    const students = await users.find({ role: 'student' }, { projection: { passwordHash: 0 } }).sort({ createdAt: -1 }).toArray()
    return response.json({ students })
  } catch {
    return response.status(503).json({ message: 'The school database is unavailable.' })
  }
})

app.post('/api/students', async (request, response) => {
  try {
    const users = await authenticateTeacher(request)
    if (!users) {
      return response.status(403).json({ message: 'Only an authenticated teacher can create student accounts.' })
    }

    const { name, username, password } = request.body
    const normalizedUsername = username?.trim().toLowerCase()

    if (!name?.trim() || !normalizedUsername || !password) {
      return response.status(400).json({ message: 'Student name, username, and password are required.' })
    }

    const student = {
      role: 'student',
      username: normalizedUsername,
      passwordHash: await bcrypt.hash(password, 12),
      name: name.trim(),
      school: schoolName,
      createdAt: new Date(),
    }

    await users.insertOne(student)
    return response.status(201).json({ student: { name: student.name, username: student.username, school: schoolName } })
  } catch (error) {
    if (error.code === 11000) {
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
    await seedDemoAccounts()
    app.listen(port, () => console.log(`ABC School backend running at http://localhost:${port}`))
  } catch (error) {
    console.error('Unable to connect to MongoDB:', error.message)
    process.exitCode = 1
  }
}

process.on('SIGINT', async () => {
  await closeDatabase()
  process.exit(0)
})

startServer()
