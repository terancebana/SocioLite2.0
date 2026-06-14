import 'dotenv/config'

const SECRET = process.env.JWT_SECRET
if (!SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

export function getJwtSecret(): Uint8Array {
  return new TextEncoder().encode(SECRET)
}
