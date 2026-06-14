import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { query } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new password are required" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 })
    }

    // Get current password hash
    const userResult = await query(
      "SELECT password_hash FROM users WHERE id = $1",
      [session.user.id]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const isCorrectPassword = await bcrypt.compare(
      currentPassword,
      userResult.rows[0].password_hash
    )

    if (!isCorrectPassword) {
      return NextResponse.json({ error: "Invalid current password" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [hashedPassword, session.user.id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[USER_PASSWORD_UPDATE]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
