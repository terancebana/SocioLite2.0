import { query } from '../src/lib/db'

async function testConnection() {
  try {
    const result = await query('SELECT NOW()')
    console.log('Connection successful:', result.rows[0])
  } catch (err) {
    console.error('Connection error:', err)
  }
}

testConnection()
