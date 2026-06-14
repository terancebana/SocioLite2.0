import 'dotenv/config'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { jwtVerify } from 'jose'

const port = parseInt(process.env.SOCKET_PORT || '3001', 10)

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is required')
  return new TextEncoder().encode(secret)
}

const eventUsers = new Map<string, Map<string, { userId: string; userName: string }>>()
const typingUsers = new Map<string, Map<string, NodeJS.Timeout>>()

const httpServer = createServer()
const io = new SocketIOServer(httpServer, {
  cors: { origin: `http://localhost:3000`, methods: ['GET', 'POST'] },
})

io.use(async (socket, next) => {
  try {
    const cookies = parseCookies(socket.handshake.headers.cookie || '')
    const token = cookies['auth_token']
    if (!token) return next(new Error('Authentication required'))
    const { payload } = await jwtVerify(token, getJwtSecret())
    ;(socket as any).userId = payload.userId as string
    next()
  } catch {
    next(new Error('Invalid authentication'))
  }
})

io.on('connection', async (socket) => {
  const userId = (socket as any).userId as string
  let userName = 'Unknown'
  try {
    const { query } = await import('./src/lib/db')
    const r = await query('SELECT name FROM users WHERE id = $1', [userId])
    if (r.rows.length > 0) userName = r.rows[0].name
  } catch (_) {}

  console.log(`Socket connected: ${userName} (${userId})`)

  socket.on('join-event', (eventId: string) => {
    socket.join(eventId)
    if (!eventUsers.has(eventId)) eventUsers.set(eventId, new Map())
    eventUsers.get(eventId)!.set(socket.id, { userId, userName })
    socket.to(eventId).emit('user-joined', { userId, userName })
    socket.emit('online-users', Array.from(eventUsers.get(eventId)!.values()))
  })

  socket.on('leave-event', (eventId: string) => {
    socket.leave(eventId)
    const room = eventUsers.get(eventId)
    if (room) { room.delete(socket.id); if (room.size === 0) eventUsers.delete(eventId) }
    const t = typingUsers.get(eventId)
    if (t) { const ti = t.get(userId); if (ti) clearTimeout(ti); t.delete(userId) }
    socket.to(eventId).emit('user-left', { userId, userName })
  })

  socket.on('new-message', (msg: any) => {
    io.to(msg.eventId).emit('message-received', msg)
  })

  socket.on('typing-start', (eventId: string) => {
    if (!typingUsers.has(eventId)) typingUsers.set(eventId, new Map())
    const room = typingUsers.get(eventId)!
    const ex = room.get(userId); if (ex) clearTimeout(ex)
    room.set(userId, setTimeout(() => { room.delete(userId); socket.to(eventId).emit('typing-stop', { userId, userName }) }, 5000))
    socket.to(eventId).emit('typing-start', { userId, userName })
  })

  socket.on('typing-stop', (eventId: string) => {
    const room = typingUsers.get(eventId)
    if (room) { const ti = room.get(userId); if (ti) clearTimeout(ti); room.delete(userId) }
    socket.to(eventId).emit('typing-stop', { userId, userName })
  })

  socket.on('event-renamed', (data: { eventId: string; oldTitle: string; newTitle: string }) => {
    io.to(data.eventId).emit('event-rename-notification', data)
  })

  socket.on('disconnect', () => {
    for (const [eventId, room] of eventUsers.entries()) {
      if (room.has(socket.id)) { room.delete(socket.id); if (room.size === 0) eventUsers.delete(eventId); io.to(eventId).emit('user-left', { userId, userName }) }
    }
    for (const [, room] of typingUsers.entries()) {
      const ti = room.get(userId); if (ti) { clearTimeout(ti); room.delete(userId) }
    }
  })
})

httpServer.listen(port, () => {
  console.log(`Socket.io server ready on port ${port}`)
})

function parseCookies(header: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  if (!header) return cookies
  header.split(';').forEach((p) => { const [k, ...r] = p.trim().split('='); if (k) cookies[k] = r.join('=') })
  return cookies
}
