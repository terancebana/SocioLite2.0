import { query } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function createUser() {
  const email = process.argv[2]
  const password = process.argv[3]
  const name = process.argv[4]

  if (!email || !password || !name) {
    console.error('Usage: tsx scripts/createUser.ts <email> <password> <name>')
    process.exit(1)
  }

  try {
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existingUser.rows.length > 0) {
      console.log('User with this email already exists')
      process.exit(1)
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const result = await query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [name, email, hashedPassword]
    )

    console.log('User created with ID:', result.rows[0].id)
  } catch (error) {
    console.error('Error creating user:', error)
    process.exit(1)
  }
}

createUser()
