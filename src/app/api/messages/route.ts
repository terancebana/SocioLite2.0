import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")
    const before = searchParams.get("before") // cursor for pagination
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 50)

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    // Verify user is a participant
    const participantCheck = await query(
      `SELECT 1 FROM event_participants WHERE event_id = $1 AND user_id = $2
       UNION
       SELECT 1 FROM events WHERE id = $1 AND creator_id = $2`,
      [eventId, session.user.id]
    )

    if (participantCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Not authorized to view this event's messages" },
        { status: 403 }
      )
    }

    // Fetch messages with optional cursor-based pagination
    let sql: string
    let params: unknown[]

    if (before) {
      sql = `SELECT m.*, u.name as user_name
             FROM messages m
             JOIN users u ON m.user_id = u.id
             WHERE m.event_id = $1 AND m.created_at < $2
             ORDER BY m.created_at DESC
             LIMIT $3`
      params = [eventId, before, limit]
    } else {
      sql = `SELECT m.*, u.name as user_name
             FROM messages m
             JOIN users u ON m.user_id = u.id
             WHERE m.event_id = $1
             ORDER BY m.created_at DESC
             LIMIT $2`
      params = [eventId, limit]
    }

    const messages = await query(sql, params)

    // Return in ascending order for display
    return NextResponse.json([...messages.rows].reverse())
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId, message, mediaUrl, mediaType } = await request.json()

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    if (!message && !mediaUrl) {
      return NextResponse.json({ error: "Message text or media is required" }, { status: 400 })
    }

    // Validate message length
    if (message && message.length > 5000) {
      return NextResponse.json({ error: "Message too long (max 5000 chars)" }, { status: 400 })
    }

    // Verify user is a participant
    const participantCheck = await query(
      `SELECT 1 FROM event_participants WHERE event_id = $1 AND user_id = $2
       UNION
       SELECT 1 FROM events WHERE id = $1 AND creator_id = $2`,
      [eventId, session.user.id]
    )

    if (participantCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Not authorized to send messages to this event" },
        { status: 403 }
      )
    }

    // Create message
    const result = await query(
      `INSERT INTO messages (event_id, user_id, message_text, media_url, media_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [eventId, session.user.id, message || "", mediaUrl || null, mediaType || null]
    )

    return NextResponse.json({
      success: true,
      messageId: result.rows[0].id,
      createdAt: result.rows[0].created_at,
      userName: session.user.name,
    })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
  }
}
