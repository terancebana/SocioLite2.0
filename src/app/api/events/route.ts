import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, eventDate } = await request.json()

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (title.length > 200) {
      return NextResponse.json({ error: "Title must be under 200 characters" }, { status: 400 })
    }

    if (!eventDate) {
      return NextResponse.json({ error: "Event date is required" }, { status: 400 })
    }

    const parsedDate = new Date(eventDate)
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid event date" }, { status: 400 })
    }

    // Create event
    const result = await query(
      `INSERT INTO events (title, description, event_date, creator_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, description, event_date, created_at, creator_id`,
      [title.trim(), description || null, parsedDate.toISOString(), session.user.id]
    )

    // Add creator as participant
    await query(
      `INSERT INTO event_participants (event_id, user_id) VALUES ($1, $2)`,
      [result.rows[0].id, session.user.id]
    )

    return NextResponse.json({
      success: true,
      event: {
        ...result.rows[0],
        creator_name: session.user.name,
        participant_count: 1,
        participants: [{ name: session.user.name, email: session.user.email }],
      },
    })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Single query: fetch events with creator name, participant count, and participants
    const events = await query(
      `SELECT
        e.id, e.title, e.description, e.event_date, e.created_at, e.creator_id,
        u.name as creator_name,
        COUNT(ep.user_id) as participant_count,
        COALESCE(
          json_agg(
            json_build_object('name', pu.name, 'email', pu.email)
          ) FILTER (WHERE pu.id IS NOT NULL),
          '[]'::json
        ) as participants
       FROM events e
       JOIN users u ON e.creator_id = u.id
       LEFT JOIN event_participants ep ON e.id = ep.event_id
       LEFT JOIN users pu ON ep.user_id = pu.id
       WHERE e.creator_id = $1
          OR e.id IN (SELECT event_id FROM event_participants WHERE user_id = $1)
       GROUP BY e.id, u.name
       ORDER BY e.event_date DESC`,
      [session.user.id]
    )

    return NextResponse.json(events.rows)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}
