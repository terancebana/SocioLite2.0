import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { query } from "@/lib/db"

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email } = body

    // Build dynamic update
    const updates: string[] = []
    const params: (string | number)[] = []
    let paramIndex = 1

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 })
      }
      if (name.length > 100) {
        return NextResponse.json({ error: "Name must be under 100 characters" }, { status: 400 })
      }
      updates.push(`name = $${paramIndex++}`)
      params.push(name.trim())
    }

    if (email !== undefined) {
      if (!email || typeof email !== "string" || !email.includes("@") || email.length > 255) {
        return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
      }
      // Check if email already taken by another user
      const existing = await query("SELECT id FROM users WHERE email = $1 AND id != $2", [email.toLowerCase().trim(), session.user.id])
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 })
      }
      updates.push(`email = $${paramIndex++}`)
      params.push(email.toLowerCase().trim())
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
    }

    params.push(session.user.id)
    const result = await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING id, name, email, created_at`,
      params
    )

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("[USER_PROFILE_UPDATE]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await query(
      "SELECT id, name, email, created_at FROM users WHERE id = $1",
      [session.user.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("[USER_PROFILE_GET]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
