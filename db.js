import { MongoClient } from 'mongodb'
import 'dotenv/config'

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
const databaseName = process.env.MONGODB_DB || 'abc_school'

let client
let connectionPromise

export function getDatabase() {
  if (!connectionPromise) {
    client = new MongoClient(mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 0,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 5000,
    })
    connectionPromise = client.connect().then(() => client.db(databaseName))
  }

  return connectionPromise
}

export async function closeDatabase() {
  if (client) {
    await client.close()
    client = undefined
    connectionPromise = undefined
  }
}
