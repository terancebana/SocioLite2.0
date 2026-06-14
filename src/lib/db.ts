import 'dotenv/config'
import { Pool, QueryResult } from 'pg'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required')
}

const pool = new Pool({
  connectionString: databaseUrl,
})

// Test connection on startup
pool.query('SELECT NOW()')
  .then(() => console.log('Database connected successfully'))
  .catch((err) => console.error('Database connection failed:', err.message))

export async function query(text: string, params?: unknown[]): Promise<QueryResult> {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    if (process.env.NODE_ENV !== 'production') {
      console.log('Query', { text: text.substring(0, 80), duration, rows: res.rowCount })
    }
    return res
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

export default pool
