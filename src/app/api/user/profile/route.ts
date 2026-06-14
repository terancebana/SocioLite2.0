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
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    if (name.length > 100) {
      return NextResponse.json({ error: "Name must be under 100 characters" }, { status: 400 })
    }

    const result = await query(
      'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, email',
      [name.trim(), session.user.id]
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
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
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
