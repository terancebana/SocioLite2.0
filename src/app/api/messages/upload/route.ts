import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { put } from "@vercel/blob"
import { nanoid } from "nanoid"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/quicktime"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP, MP4, MOV" }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum 10MB" }, { status: 400 })
    }

    // Check if Blob token is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "File storage is not configured. Add BLOB_READ_WRITE_TOKEN to your .env file." },
        { status: 500 }
      )
    }

    const filename = `${nanoid()}-${file.name}`
    const blob = await put(filename, file, { access: "public" })

    return NextResponse.json({
      url: blob.url,
      type: file.type.startsWith("image/") ? "image" : "video",
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}
