import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email } = await request.json()
    const { eventId } = await params

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    // Verify the user is the event creator
    const eventCheck = await query(
      "SELECT creator_id FROM events WHERE id = $1",
      [eventId]
    )

    if (eventCheck.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (eventCheck.rows[0].creator_id !== session.user.id) {
      return NextResponse.json(
        { error: "Only event creator can invite participants" },
        { status: 403 }
      )
    }

    // Find user by email
    const userResult = await query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = userResult.rows[0].id

    // Check if user is already a participant
    const participantCheck = await query(
      "SELECT 1 FROM event_participants WHERE event_id = $1 AND user_id = $2",
      [eventId, userId]
    )

    if (participantCheck.rows.length > 0) {
      return NextResponse.json(
        { error: "User is already a participant" },
        { status: 400 }
      )
    }

    // Add user as participant
    await query(
      "INSERT INTO event_participants (event_id, user_id) VALUES ($1, $2)",
      [eventId, userId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error inviting participant:", error)
    return NextResponse.json(
      { error: "Failed to invite participant" },
      { status: 500 }
    )
  }
}
