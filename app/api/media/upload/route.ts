import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Get other form data
    const title = (formData.get("title") as string) || file.name
    const type = (formData.get("type") as string) || "IMAGE"
    const duration = Number.parseInt((formData.get("duration") as string) || "10")
    const muted = ((formData.get("muted") as string) || "true") === "true"

    // Create directories if they don't exist
    const mediaDir = type === "IMAGE" ? "images" : "videos"
    const publicDir = path.join(process.cwd(), "public")
    const mediaTypeDir = path.join(publicDir, mediaDir)

    try {
      await mkdir(mediaTypeDir, { recursive: true })
    } catch (err) {
      console.log("Directory already exists or cannot be created")
    }

    // Create unique filename
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate a unique filename with a timestamp to avoid collisions
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const fileId = `${timestamp.toString(36)}${randomStr}`
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "png"
    const fileName = `${fileId}.${fileExtension}`
    const filePath = path.join(mediaTypeDir, fileName)

    // Save the file to the public directory
    await writeFile(filePath, buffer)

    // Create the public URL path
    const url = `/${mediaDir}/${fileName}`

    // Create the media item in the database
    const mediaItem = await db.mediaItem.create({
      data: {
        title,
        url,
        type,
        duration: type === "IMAGE" ? duration : null,
        muted,
        fileSize: file.size,
      },
    })

    // Set appropriate headers to prevent caching
    return NextResponse.json(mediaItem, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Error uploading media:", error)
    return NextResponse.json({ error: "Failed to upload media" }, { status: 500 })
  }
}
